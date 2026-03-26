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
    private PDO $db;
    private SmartAssignmentRepository $smart;
    private AffectationRepository $affectations;
    private FormateurRepository $formateurs;
    private PlanningRepository $planning;
    private ModuleRepository $modules;
    private ValidationService $validation;

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

        $rows = [];
        foreach ($this->smart->listTrainersForSuggestions() as $trainer) {
            if (!$this->isEligibleTrainer($trainer, $module)) {
                continue;
            }

            [$score, $reason] = $this->resolveScore($trainer, $module);
            $rows[] = [
                'trainer' => $trainer,
                'score' => $score,
                'reason' => $reason,
            ];
        }

        usort($rows, static fn(array $left, array $right): int => $right['score'] <=> $left['score']);

        return array_map(function (array $row, int $index): array {
            $candidate = new SmartAssignmentCandidate(
                intval($row['trainer']['id']),
                $row['trainer']['nom'],
                $row['trainer']['specialite'],
                $this->smart->getAssignedModuleCodes(intval($row['trainer']['id'])),
                $this->remainingHours($row['trainer']),
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

            $this->smart->updateTrainerCurrentHours($formateurId);
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

    private function resolveScore(array $trainer, array $module): array
    {
        $trainerId = intval($trainer['id']);
        $moduleId = intval($module['id']);
        $cached = $this->smart->getCachedScore($trainerId, $moduleId);
        if ($cached) {
            return [floatval($cached['score']), $cached['reason']];
        }

        $competenceLevel = $this->resolveCompetenceLevel($trainer, $module);
        $competenceScore = ($competenceLevel / 5) * 100;

        $remainingHours = $this->remainingHours($trainer);
        $maxHours = max(1.0, floatval($trainer['max_heures']));
        $availabilityScore = max(0.0, min(100.0, ($remainingHours / $maxHours) * 100));

        $experienceCount = $this->smart->countExperienceForTrainer($trainerId, $module['filiere']);
        $experienceScore = min(100.0, $experienceCount * 25);
        if ($experienceScore < 40 && $competenceLevel >= 4) {
            $experienceScore = 40;
        }

        $score = ($competenceScore * 0.5) + ($availabilityScore * 0.3) + ($experienceScore * 0.2);
        $reason = (new SmartAssignmentReason(
            $competenceScore,
            $availabilityScore,
            $experienceScore,
            $competenceLevel,
            $remainingHours,
            $experienceCount
        ))->toArray();

        $this->smart->cacheScore($trainerId, $moduleId, $score, $reason);

        return [round($score, 2), $reason];
    }

    private function resolveCompetenceLevel(array $trainer, array $module): int
    {
        $mapped = $this->smart->getCompetenceLevel(intval($trainer['id']), intval($module['id']));
        if ($mapped !== null) {
            return max(1, min(5, $mapped));
        }

        $specialite = mb_strtolower(trim((string) ($trainer['specialite'] ?? '')));
        $haystack = mb_strtolower(trim(implode(' ', [
            $module['intitule'] ?? '',
            $module['filiere'] ?? '',
            $module['code'] ?? '',
        ])));

        if ($specialite !== '' && str_contains($haystack, $specialite)) {
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
            return 4;
        }

        return 2;
    }

    private function remainingHours(array $trainer): float
    {
        $max = floatval($trainer['max_heures'] ?? 910);
        $current = array_key_exists('current_hours', $trainer)
            ? floatval($trainer['current_hours'])
            : floatval($this->affectations->getTrainerAnnualHours(intval($trainer['id']), currentAcademicYear()));

        return max(0.0, round($max - $current, 2));
    }

    private function isEligibleTrainer(array $trainer, array $module): bool
    {
        $trainerId = intval($trainer['id']);
        $moduleId = intval($module['id']);

        if ($this->resolveCompetenceLevel($trainer, $module) < 2) {
            return false;
        }

        if ($this->remainingHours($trainer) < floatval($module['volume_horaire'])) {
            return false;
        }

        try {
            $this->validation->validateAssignment($trainerId, $moduleId, currentAcademicYear());

            return true;
        } catch (HttpException $exception) {
            return false;
        }
    }
}
