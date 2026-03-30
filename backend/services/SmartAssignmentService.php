<?php

require_once __DIR__ . '/../repositories/SmartAssignmentRepository.php';
require_once __DIR__ . '/../repositories/AffectationRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../repositories/PlanningRepository.php';
require_once __DIR__ . '/../repositories/ModuleRepository.php';
require_once __DIR__ . '/../services/ValidationService.php';
require_once __DIR__ . '/../models/SmartAssignmentCandidate.php';
require_once __DIR__ . '/../models/SmartAssignmentReason.php';
require_once __DIR__ . '/../core/HttpException.php';
require_once __DIR__ . '/../core/helpers.php';

class SmartAssignmentService
{
    private const MAX_WEEKLY_HOURS = 44.0;

    private PDO $db;
    private SmartAssignmentRepository $smart;
    private AffectationRepository $affectations;
    private FormateurRepository $formateurs;
    private PlanningRepository $planning;
    private ModuleRepository $modules;
    private ValidationService $validation;
    private array $competenceLevelCache = [];
    private array $experienceCountCache = [];
    private array $availabilityCache = [];

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->smart = new SmartAssignmentRepository($db);
        $this->affectations = new AffectationRepository($db);
        $this->formateurs = new FormateurRepository($db);
        $this->planning = new PlanningRepository($db);
        $this->modules = new ModuleRepository($db);
        $this->validation = new ValidationService($db);
    }

    public function suggestions(int $moduleId): array
    {
        $module = $this->modules->find($moduleId);
        if (!$module) {
            throw new NotFoundException('Module not found');
        }

        $academicYear = currentAcademicYear();
        $currentWeek = currentAcademicWeek();
        $trainers = $this->smart->listTrainersForSuggestions($academicYear, $currentWeek);
        $trainerIds = array_map(static fn(array $trainer): int => intval($trainer['id']), $trainers);
        $assignedModulesByTrainer = $this->smart->getAssignedModuleCodesMap(
            $trainerIds,
            $academicYear
        );
        $competenceLevels = $this->smart->getCompetenceLevelsForModule($trainerIds, intval($module['id']));
        $experienceCounts = $this->smart->getExperienceCountsForFiliere($trainerIds, (string) ($module['filiere'] ?? ''), $academicYear);

        $rows = [];
        foreach ($trainers as $trainer) {
            $trainerId = intval($trainer['id']);
            $competenceLevel = $this->resolveCompetenceLevel($trainer, $module, $competenceLevels[$trainerId] ?? null);
            $availability = $this->buildAvailabilitySnapshot($trainer, $module);

            if (!$this->isEligibleTrainer($trainer, $module, $competenceLevel, $availability, $academicYear)) {
                continue;
            }

            [$score, $reason] = $this->resolveScore(
                $trainer,
                $module,
                $competenceLevel,
                $experienceCounts[$trainerId] ?? 0,
                $availability
            );
            $rows[] = [
                'trainer' => $trainer,
                'trainer_id' => $trainerId,
                'score' => $score,
                'reason' => $reason,
                'modules' => $assignedModulesByTrainer[intval($trainer['id'])] ?? [],
                'remaining_hours' => $availability['remaining_hours'],
                'current_week_hours' => $availability['current_week_hours'],
                'source_index' => count($rows),
            ];
        }

        usort($rows, static function (array $left, array $right): int {
            if ($left['score'] !== $right['score']) {
                return $right['score'] <=> $left['score'];
            }

            if ($left['remaining_hours'] !== $right['remaining_hours']) {
                return $right['remaining_hours'] <=> $left['remaining_hours'];
            }

            if ($left['current_week_hours'] !== $right['current_week_hours']) {
                return $left['current_week_hours'] <=> $right['current_week_hours'];
            }

            if ($left['trainer_id'] !== $right['trainer_id']) {
                return $left['trainer_id'] <=> $right['trainer_id'];
            }

            return $left['source_index'] <=> $right['source_index'];
        });

        return array_map(function (array $row, int $index): array {
            $candidate = new SmartAssignmentCandidate(
                intval($row['trainer']['id']),
                $row['trainer']['nom'],
                $row['trainer']['specialite'],
                $row['modules'],
                $row['remaining_hours'],
                $row['score'],
                $index === 0 ? 'best_match' : 'recommended',
                $row['reason']
            );

            return $candidate->toArray();
        }, $rows, array_keys($rows));
    }

    public function autoAssignPreview(int $moduleId): array
    {
        $suggestions = $this->suggestions($moduleId);
        if (!$suggestions) {
            throw new NotFoundException('No trainer suggestion available');
        }

        $best = $suggestions[0];

        return [
            'formateur' => [
                'id' => $best['id'],
                'name' => $best['name'],
                'specialite' => $best['specialite'],
                'modules' => $best['modules'],
                'heures_restantes' => $best['heures_restantes'],
                'badge' => $best['badge'],
            ],
            'score' => $best['score'],
            'reason' => $best['reason'],
        ];
    }

    public function assign(int $formateurId, int $moduleId): array
    {
        $formateur = $this->formateurs->find($formateurId);
        if (!$formateur) {
            throw new NotFoundException('Trainer not found');
        }

        $module = $this->modules->find($moduleId);
        if (!$module) {
            throw new NotFoundException('Module not found');
        }

        $competenceLevel = $this->resolveCompetenceLevel($formateur, $module);
        if ($competenceLevel < 2) {
            throw new ValidationException('Competence match is too low');
        }

        if ($this->affectations->findByFormateurAndModule($formateurId, $moduleId, currentAcademicYear())) {
            throw new ConflictException('Already assigned');
        }

        $this->validation->validateAssignment($formateurId, $moduleId, currentAcademicYear());

        $remainingHours = $this->remainingHours($formateur);
        if ($remainingHours < floatval($module['volume_horaire'])) {
            throw new ValidationException('Trainer not available');
        }

        $this->db->beginTransaction();

        try {
            $this->affectations->create([
                'formateur_id' => $formateurId,
                'module_id' => $moduleId,
                'annee' => currentAcademicYear(),
            ]);

            $this->smart->updateTrainerCurrentHours($formateurId, currentAcademicYear());
            $this->smart->clearScoreCacheForTrainer($formateurId);
            $this->smart->clearScoreCacheForModule($moduleId);

            $this->db->commit();
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }

        return ['success' => true];
    }

    private function resolveScore(
        array $trainer,
        array $module,
        ?int $competenceLevelOverride = null,
        ?int $experienceCountOverride = null,
        ?array $availabilityOverride = null
    ): array
    {
        $trainerId = intval($trainer['id']);
        $competenceLevel = $this->resolveCompetenceLevel($trainer, $module, $competenceLevelOverride);
        $competenceScore = ($competenceLevel / 5) * 100;

        $questionnaireScore = $trainer['questionnaire_percentage'] !== null
            ? max(0.0, min(100.0, floatval($trainer['questionnaire_percentage'])))
            : $competenceScore;

        $availability = $availabilityOverride ?? $this->buildAvailabilitySnapshot($trainer, $module);
        $remainingHours = $availability['remaining_hours'];
        $currentWeekHours = $availability['current_week_hours'];
        $projectedWeeklyHours = $availability['projected_weekly_hours'];
        $weeklyTargetHours = $availability['weekly_capacity_hours'];
        $availabilityScore = $availability['availability_score'];

        $experienceCount = $experienceCountOverride ?? $this->resolveExperienceCount($trainerId, (string) ($module['filiere'] ?? ''));
        $experienceScore = min(100.0, $experienceCount * 25);
        if ($experienceScore < 40 && $competenceLevel >= 4) {
            $experienceScore = 40;
        }

        $score = ($questionnaireScore * 0.4) + ($availabilityScore * 0.35) + ($competenceScore * 0.15) + ($experienceScore * 0.1);
        $reason = (new SmartAssignmentReason(
            $questionnaireScore,
            $competenceScore,
            $availabilityScore,
            $experienceScore,
            $competenceLevel,
            $remainingHours,
            $experienceCount,
            $currentWeekHours,
            $projectedWeeklyHours,
            $weeklyTargetHours
        ))->toArray();

        return [round($score, 2), $reason];
    }

    private function resolveCompetenceLevel(array $trainer, array $module, ?int $mappedLevel = null): int
    {
        if ($mappedLevel !== null) {
            return max(1, min(5, $mappedLevel));
        }

        $cacheKey = intval($trainer['id']) . ':' . intval($module['id']);
        if (array_key_exists($cacheKey, $this->competenceLevelCache)) {
            return $this->competenceLevelCache[$cacheKey];
        }

        $mapped = $this->smart->getCompetenceLevel(intval($trainer['id']), intval($module['id']));
        if ($mapped !== null) {
            $resolved = max(1, min(5, $mapped));
            $this->competenceLevelCache[$cacheKey] = $resolved;

            return $resolved;
        }

        $specialite = mb_strtolower(trim((string) ($trainer['specialite'] ?? '')));
        $haystack = mb_strtolower(trim(implode(' ', [
            $module['intitule'] ?? '',
            $module['filiere'] ?? '',
            $module['code'] ?? '',
        ])));

        if ($specialite !== '' && str_contains($haystack, $specialite)) {
            $this->competenceLevelCache[$cacheKey] = 4;

            return 4;
        }

        $tokens = preg_split('/\s+/', preg_replace('/[^[:alnum:]\s]+/u', ' ', $specialite)) ?: [];
        $tokens = array_values(array_filter($tokens, static fn(string $token): bool => mb_strlen($token) >= 3));

        foreach ($tokens as $token) {
            if (str_contains($haystack, $token)) {
                return 3;
            }
        }

        if (str_contains($haystack, 'qa') && str_contains($specialite, 'qa')) {
            $this->competenceLevelCache[$cacheKey] = 4;

            return 4;
        }

        $this->competenceLevelCache[$cacheKey] = 2;

        return 2;
    }

    private function remainingHours(array $trainer): float
    {
        return $this->buildAvailabilitySnapshot($trainer)['remaining_hours'];
    }

    private function isEligibleTrainer(
        array $trainer,
        array $module,
        ?int $competenceLevel = null,
        ?array $availability = null,
        ?int $academicYear = null
    ): bool
    {
        $trainerId = intval($trainer['id']);
        $moduleId = intval($module['id']);
        $resolvedCompetenceLevel = $this->resolveCompetenceLevel($trainer, $module, $competenceLevel);
        $resolvedAvailability = $availability ?? $this->buildAvailabilitySnapshot($trainer, $module);

        if ($resolvedCompetenceLevel < 2) {
            return false;
        }

        if ($resolvedAvailability['remaining_hours'] < floatval($module['volume_horaire'])) {
            return false;
        }

        if ($resolvedAvailability['weekly_headroom_after_assignment'] < 0) {
            return false;
        }

        try {
            $this->validation->validateAssignment($trainerId, $moduleId, $academicYear ?? currentAcademicYear());

            return true;
        } catch (HttpException $exception) {
            return false;
        }
    }

    private function buildAvailabilitySnapshot(array $trainer, ?array $module = null): array
    {
        $trainerId = intval($trainer['id'] ?? 0);
        $moduleId = intval($module['id'] ?? 0);
        $cacheKey = $trainerId . ':' . $moduleId;

        if (array_key_exists($cacheKey, $this->availabilityCache)) {
            return $this->availabilityCache[$cacheKey];
        }

        $maxHours = max(1.0, $this->normalizeFloat($trainer['max_heures'] ?? 910, 910.0));
        $currentHours = array_key_exists('current_hours', $trainer)
            ? $this->normalizeFloat($trainer['current_hours'])
            : $this->normalizeFloat($this->affectations->getTrainerAnnualHours($trainerId, currentAcademicYear()));
        $remainingHours = max(0.0, round($maxHours - $currentHours, 2));
        $moduleHours = max(0.0, $this->normalizeFloat($module['volume_horaire'] ?? 0));
        $projectedWeeklyHours = $moduleHours > 0
            ? round($moduleHours / max(1, ACADEMIC_WEEKS), 2)
            : 0.0;
        $currentWeekHours = max(0.0, round($this->normalizeFloat($trainer['current_week_hours'] ?? 0), 2));
        $configuredWeeklyTargetHours = max(0.0, round($this->normalizeFloat($trainer['weekly_hours_target'] ?? 0), 2));
        $weeklyCapacityHours = $configuredWeeklyTargetHours > 0
            ? min(self::MAX_WEEKLY_HOURS, $configuredWeeklyTargetHours)
            : self::MAX_WEEKLY_HOURS;
        $annualRemainingAfterAssignment = max(0.0, round($remainingHours - $moduleHours, 2));
        $annualAvailabilityScore = max(0.0, min(100.0, ($annualRemainingAfterAssignment / $maxHours) * 100));
        $weeklyHeadroomAfterAssignment = round($weeklyCapacityHours - $currentWeekHours - $projectedWeeklyHours, 2);
        $weeklyAvailabilityScore = $weeklyCapacityHours > 0
            ? max(0.0, min(100.0, (max(0.0, $weeklyHeadroomAfterAssignment) / $weeklyCapacityHours) * 100))
            : 0.0;

        $snapshot = [
            'remaining_hours' => $remainingHours,
            'current_hours' => round($currentHours, 2),
            'module_hours' => round($moduleHours, 2),
            'current_week_hours' => $currentWeekHours,
            'projected_weekly_hours' => $projectedWeeklyHours,
            'configured_weekly_target_hours' => $configuredWeeklyTargetHours,
            'weekly_capacity_hours' => round($weeklyCapacityHours, 2),
            'annual_remaining_after_assignment' => $annualRemainingAfterAssignment,
            'weekly_headroom_after_assignment' => $weeklyHeadroomAfterAssignment,
            'annual_availability_score' => round($annualAvailabilityScore, 2),
            'weekly_availability_score' => round($weeklyAvailabilityScore, 2),
            'availability_score' => round(($annualAvailabilityScore * 0.7) + ($weeklyAvailabilityScore * 0.3), 2),
        ];

        $this->availabilityCache[$cacheKey] = $snapshot;

        return $snapshot;
    }

    private function resolveExperienceCount(int $trainerId, string $filiere): int
    {
        $cacheKey = $trainerId . ':' . strtolower(trim($filiere));
        if (array_key_exists($cacheKey, $this->experienceCountCache)) {
            return $this->experienceCountCache[$cacheKey];
        }

        $count = $this->smart->countExperienceForTrainer($trainerId, $filiere);
        $this->experienceCountCache[$cacheKey] = $count;

        return $count;
    }

    private function normalizeFloat($value, float $default = 0.0): float
    {
        if ($value === null || $value === '') {
            return $default;
        }

        return floatval($value);
    }
}
