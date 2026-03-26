<?php

require_once __DIR__ . '/../repositories/PlanningRepository.php';
require_once __DIR__ . '/../repositories/AffectationRepository.php';
require_once __DIR__ . '/../repositories/DashboardRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../repositories/AcademicConfigRepository.php';
require_once __DIR__ . '/../services/ValidationService.php';
require_once __DIR__ . '/../core/HttpException.php';

class PlanningService
{
    private const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    private const SLOT_TEMPLATES = [
        ['time_range' => '08:30h-13:00h', 'duration' => 5.0, 'room_code' => 'SN-12'],
        ['time_range' => '14:00h-16:30h', 'duration' => 2.5, 'room_code' => 'SN-12'],
        ['time_range' => '10:45h-13:00h', 'duration' => 2.5, 'room_code' => 'SN-12'],
        ['time_range' => '14:00h-19:00h', 'duration' => 5.0, 'room_code' => 'SN-12'],
    ];
    private const CHEF_WEEKLY_CAPACITY = 40;

    private PlanningRepository $planning;
    private AffectationRepository $affectations;
    private DashboardRepository $dashboard;
    private FormateurRepository $formateurs;
    private AcademicConfigRepository $academicConfig;
    private ValidationService $validation;

    public function __construct(PDO $db)
    {
        $this->planning = new PlanningRepository($db);
        $this->affectations = new AffectationRepository($db);
        $this->dashboard = new DashboardRepository($db);
        $this->formateurs = new FormateurRepository($db);
        $this->academicConfig = new AcademicConfigRepository($db);
        $this->validation = new ValidationService($db);
    }

    private function safeFloat($value): float
    {
        return round(floatval($value ?? 0), 2);
    }

    private function trimHour(float $value): float|int
    {
        return floor($value) == $value ? intval($value) : round($value, 1);
    }

    private function formatHour(float $value): string
    {
        $normalized = $this->trimHour($value);

        return $normalized . 'h';
    }

    private function startOfDay(?string $value): ?DateTimeImmutable
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $date = DateTimeImmutable::createFromFormat('Y-m-d', trim($value));
        if (!$date || $date->format('Y-m-d') !== trim($value)) {
            return null;
        }

        return $date->setTime(0, 0, 0);
    }

    private function normalizeTime(?string $value): string
    {
        $normalized = trim((string) $value);
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $normalized)) {
            throw new ValidationException('Le format horaire doit etre HH:MM.');
        }

        return strlen($normalized) === 5 ? $normalized . ':00' : $normalized;
    }

    private function buildSessionDate(int $week, int $dayOfWeek): ?string
    {
        $range = $this->getWeekRange($this->academicConfig->current(), $week);
        if (empty($range['start'])) {
            return null;
        }

        $start = $this->startOfDay($range['start']);
        if ($start === null) {
            return null;
        }

        return $start->modify('+' . max(0, $dayOfWeek - 1) . ' days')->format('Y-m-d');
    }

    private function buildSessionPayload(array $data): array
    {
        $weekNumber = intval($data['week_number']);
        $dayOfWeek = intval($data['day_of_week']);
        $startTime = $this->normalizeTime($data['start_time'] ?? null);

        if (!empty($data['duration_minutes'])) {
            $durationMinutes = intval($data['duration_minutes']);
            if ($durationMinutes <= 0) {
                throw new ValidationException('La duree doit etre superieure a zero.');
            }

            $endTimestamp = strtotime('1970-01-01 ' . $startTime) + ($durationMinutes * 60);
            $endTime = date('H:i:s', $endTimestamp);
        } else {
            $endTime = $this->normalizeTime($data['end_time'] ?? null);
        }

        $durationHours = round((strtotime('1970-01-01 ' . $endTime) - strtotime('1970-01-01 ' . $startTime)) / 3600, 2);
        $weekRange = $this->getWeekRange($this->academicConfig->current(), $weekNumber);

        return [
            'id' => !empty($data['id']) ? intval($data['id']) : null,
            'formateur_id' => intval($data['formateur_id']),
            'module_id' => intval($data['module_id']),
            'groupe_id' => !empty($data['groupe_id']) ? intval($data['groupe_id']) : null,
            'salle_id' => !empty($data['salle_id']) ? intval($data['salle_id']) : null,
            'week_number' => $weekNumber,
            'week_start_date' => $weekRange['start'] ?? null,
            'week_end_date' => $weekRange['end'] ?? null,
            'day_of_week' => $dayOfWeek,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration_hours' => $durationHours,
            'session_date' => $this->buildSessionDate($weekNumber, $dayOfWeek),
            'status' => 'scheduled',
            'task_title' => trim((string) ($data['task_title'] ?? 'Cours')),
            'task_description' => trim((string) ($data['task_description'] ?? '')),
        ];
    }

    private function getWeekRange(?array $config, int $week): array
    {
        $monthNames = [
            1 => 'janvier',
            2 => 'fevrier',
            3 => 'mars',
            4 => 'avril',
            5 => 'mai',
            6 => 'juin',
            7 => 'juillet',
            8 => 'aout',
            9 => 'septembre',
            10 => 'octobre',
            11 => 'novembre',
            12 => 'decembre',
        ];
        $startDate = $this->startOfDay($config['start_date'] ?? null);
        if ($startDate === null || $week < 1) {
            return [
                'start' => null,
                'end' => null,
                'label' => 'Calendrier academique non configure',
            ];
        }

        $rangeStart = $startDate->modify('+' . (($week - 1) * 7) . ' days');
        $rangeEnd = $rangeStart->modify('+6 days');

        return [
            'start' => $rangeStart->format('Y-m-d'),
            'end' => $rangeEnd->format('Y-m-d'),
            'label' => sprintf(
                '%s - %s %s %s',
                $rangeStart->format('j'),
                $rangeEnd->format('j'),
                $monthNames[intval($rangeEnd->format('n'))] ?? strtolower($rangeEnd->format('F')),
                $rangeEnd->format('Y')
            ),
        ];
    }

    private function buildTaskLabel(array $module, array $periods): string
    {
        if (!empty($periods['in_exam']) && !empty($module['has_efm'])) {
            return 'Preparation EFM';
        }

        if (!empty($periods['in_stage'])) {
            return 'Suivi pedagogique stage';
        }

        return 'Cours planifie';
    }

    private function buildScheduleEntries(array $modules, int $week, array $periods): array
    {
        $entries = [];
        $dayCursor = 0;
        $slotCursor = 0;

        foreach ($modules as $moduleIndex => $module) {
            $baseWeeklyHours = $this->safeFloat($module['weekly_hours'] ?? 0);
            $derivedWeeklyHours = $baseWeeklyHours > 0
                ? $baseWeeklyHours
                : max(2.5, min(10.0, round(($this->safeFloat($module['volume_horaire'] ?? 0) / 12) * 2) / 2));
            $remaining = $derivedWeeklyHours;
            $groupCodes = is_array($module['group_codes'] ?? null) ? $module['group_codes'] : [];

            while ($remaining > 0.01) {
                $template = self::SLOT_TEMPLATES[$slotCursor % count(self::SLOT_TEMPLATES)];
                $sessionDuration = $remaining >= 5
                    ? 5.0
                    : ($remaining >= 2.5 ? 2.5 : round($remaining, 2));
                $dayLabel = self::DAY_LABELS[$dayCursor % count(self::DAY_LABELS)];
                $groupCode = $groupCodes !== []
                    ? $groupCodes[count($entries) % count($groupCodes)]
                    : 'Aucun groupe';

                $entries[] = [
                    'id' => sprintf('%s-%s-%s-%s', $module['id'] ?? 'm', $week, $dayCursor, $slotCursor),
                    'module_id' => intval($module['id'] ?? 0),
                    'module_code' => $module['code'] ?? '',
                    'module_name' => $module['intitule'] ?? '',
                    'group_code' => $groupCode,
                    'day_label' => $dayLabel,
                    'day_index' => $dayCursor % count(self::DAY_LABELS),
                    'time_range' => $template['time_range'],
                    'duration_hours' => round($sessionDuration, 2),
                    'duration_label' => $this->formatHour($sessionDuration),
                    'room_code' => $template['room_code'],
                    'task_label' => $this->buildTaskLabel($module, $periods),
                    'status_label' => 'Planifie',
                    'accent' => $moduleIndex % 2 === 0 ? '#2c5a91' : '#8b3dff',
                ];

                $remaining = round(max(0, $remaining - $sessionDuration), 2);
                $dayCursor++;
                $slotCursor++;
            }
        }

        return $entries;
    }

    private function buildDailyTotals(array $entries): array
    {
        $totals = [];

        foreach (self::DAY_LABELS as $label) {
            $totals[$label] = 0.0;
        }

        foreach ($entries as $entry) {
            $label = $entry['day_label'] ?? '';
            if (!array_key_exists($label, $totals)) {
                continue;
            }

            $totals[$label] += $this->safeFloat($entry['duration_hours'] ?? 0);
        }

        return array_map(function (string $label) use ($totals): array {
            return [
                'label' => $label,
                'hours' => round($totals[$label] ?? 0, 2),
                'display_hours' => $this->formatHour(round($totals[$label] ?? 0, 2)),
            ];
        }, self::DAY_LABELS);
    }

    public function checkWeeklyHours(array $formateur): ?array
    {
        $weeklyHours = $this->safeFloat($formateur['weekly_hours'] ?? 0);

        if ($weeklyHours <= 26) {
            return null;
        }

        return [
            'type' => 'warning',
            'tone' => 'warning',
            'code' => 'weekly_overload',
            'message' => 'Charge hebdomadaire elevee',
            'details' => 'Le volume planifie depasse 26h cette semaine.',
        ];
    }

    public function detectConflicts(array $formateur): array
    {
        $entries = is_array($formateur['schedule'] ?? null) ? $formateur['schedule'] : [];
        $seenSlots = [];
        $conflicts = [];

        foreach ($entries as $entry) {
            $slotKey = ($entry['day_label'] ?? '') . '|' . ($entry['time_range'] ?? '');
            if ($slotKey === '|') {
                continue;
            }

            if (isset($seenSlots[$slotKey])) {
                $conflicts[] = [
                    'type' => 'error',
                    'tone' => 'danger',
                    'code' => 'schedule_conflict',
                    'message' => 'Conflit d horaire detecte',
                    'details' => sprintf(
                        '%s partage le creneau %s.',
                        $entry['day_label'] ?? 'Jour inconnu',
                        $entry['time_range'] ?? 'Horaire inconnu'
                    ),
                ];
                continue;
            }

            $seenSlots[$slotKey] = true;
        }

        return $conflicts;
    }

    public function checkEmptyPlanning(array $formateur): ?array
    {
        $entries = is_array($formateur['schedule'] ?? null) ? $formateur['schedule'] : [];

        if ($entries !== []) {
            return null;
        }

        return [
            'type' => 'warning',
            'tone' => 'warning',
            'code' => 'planning_missing',
            'message' => 'Planning non defini',
            'details' => 'Aucune seance n est planifiee pour cette semaine.',
        ];
    }

    public function checkAcademicPeriods(?string $date = null): array
    {
        $config = $this->academicConfig->current();
        $targetDate = $date !== null
            ? $this->startOfDay($date)
            : (new DateTimeImmutable('today'))->setTime(0, 0, 0);

        if ($config === null || $targetDate === null) {
            return [
                'semester' => null,
                'in_stage' => false,
                'in_exam' => false,
                'badges' => [],
            ];
        }

        $s2Start = $this->startOfDay($config['s2_start_date'] ?? null);
        $stageStart = $this->startOfDay($config['stage_start_date'] ?? null);
        $stageEnd = $this->startOfDay($config['stage_end_date'] ?? null);
        $examDate = $this->startOfDay($config['exam_regional_date'] ?? null);
        $inStage = $stageStart !== null && $stageEnd !== null && $targetDate >= $stageStart && $targetDate <= $stageEnd;
        $inExam = $examDate !== null && $targetDate->format('Y-m-d') === $examDate->format('Y-m-d');

        $badges = [];
        if ($inStage) {
            $badges[] = ['label' => 'Stage', 'tone' => 'success'];
        }
        if ($inExam) {
            $badges[] = ['label' => 'Exam', 'tone' => 'warning'];
        }

        return [
            'semester' => $s2Start !== null && $targetDate >= $s2Start ? 'S2' : 'S1',
            'in_stage' => $inStage,
            'in_exam' => $inExam,
            'badges' => $badges,
        ];
    }

    private function buildTrainerAlerts(array $context): array
    {
        $alerts = [];
        $weeklyAlert = $this->checkWeeklyHours($context);
        if ($weeklyAlert !== null) {
            $alerts[] = $weeklyAlert;
        }

        $emptyAlert = $this->checkEmptyPlanning($context);
        if ($emptyAlert !== null) {
            $alerts[] = $emptyAlert;
        }

        foreach ($this->detectConflicts($context) as $conflict) {
            $alerts[] = $conflict;
        }

        if (!empty($context['periods']['in_stage'])) {
            $alerts[] = [
                'type' => 'info',
                'tone' => 'info',
                'code' => 'stage_period',
                'message' => 'Periode de stage active',
                'details' => 'Le planning est interprete dans le contexte stage.',
            ];
        }

        if (!empty($context['periods']['in_exam'])) {
            $alerts[] = [
                'type' => 'info',
                'tone' => 'info',
                'code' => 'exam_period',
                'message' => 'Journee d examen',
                'details' => 'Un badge Exam est affiche sur votre planning.',
            ];
        }

        return $alerts;
    }

    public function trainerVisibility(int $formateurId, ?int $week = null, ?int $annee = null): array
    {
        $resolvedWeek = $week ?? currentAcademicWeek();
        $resolvedYear = $annee ?? currentAcademicYear();
        $trainer = $this->dashboard->getTrainerKpis($formateurId, $resolvedWeek, $resolvedYear);
        if (!$trainer) {
            throw new NotFoundException('Formateur introuvable.');
        }

        $modules = $this->dashboard->getTrainerAssignedModules($formateurId, $resolvedYear, $resolvedWeek);
        $periods = $this->checkAcademicPeriods();
        $schedule = $this->buildScheduleEntries($modules, $resolvedWeek, $periods);
        $dailyTotals = $this->buildDailyTotals($schedule);
        $weeklyHours = array_reduce($dailyTotals, function (float $sum, array $day): float {
            return $sum + $this->safeFloat($day['hours'] ?? 0);
        }, 0.0);
        $groupCodes = [];
        foreach ($schedule as $entry) {
            if (!empty($entry['group_code'])) {
                $groupCodes[$entry['group_code']] = true;
            }
        }

        $context = [
            'id' => intval($trainer['id'] ?? 0),
            'nom' => $trainer['nom'] ?? '',
            'weekly_hours' => $weeklyHours,
            'schedule' => $schedule,
            'periods' => $periods,
        ];
        $alerts = $this->buildTrainerAlerts($context);
        $weekRange = $this->getWeekRange($this->academicConfig->current(), $resolvedWeek);

        return [
            'profile' => [
                'id' => intval($trainer['id'] ?? 0),
                'nom' => $trainer['nom'] ?? '',
                'email' => $trainer['email'] ?? '',
                'telephone' => $trainer['telephone'] ?? '',
                'specialite' => $trainer['specialite'] ?? '',
                'max_heures' => intval($trainer['max_heures'] ?? 910),
            ],
            'summary' => [
                'week' => $resolvedWeek,
                'weekly_hours' => round($weeklyHours, 2),
                'entries_count' => count($schedule),
                'modules_count' => count($modules),
                'groups_count' => count($groupCodes),
                'alerts_count' => count($alerts),
            ],
            'periods' => $periods,
            'week_range' => $weekRange,
            'modules' => $modules,
            'schedule' => $schedule,
            'daily_totals' => $dailyTotals,
            'alerts' => $alerts,
        ];
    }

    public function teamVisibility(?int $week = null, ?int $annee = null): array
    {
        $resolvedWeek = $week ?? currentAcademicWeek();
        $resolvedYear = $annee ?? currentAcademicYear();
        $rows = [];
        $totalEntries = 0;
        $totalHours = 0.0;
        $activeGroups = [];

        foreach ($this->formateurs->all() as $formateur) {
            $visibility = $this->trainerVisibility(intval($formateur['id']), $resolvedWeek, $resolvedYear);
            $rows[] = [
                'id' => intval($formateur['id']),
                'nom' => $formateur['nom'] ?? '',
                'specialite' => $formateur['specialite'] ?? '',
                'daily_hours' => $visibility['daily_totals'],
                'total_weekly_hours' => round($visibility['summary']['weekly_hours'], 2),
                'display_capacity_hours' => self::CHEF_WEEKLY_CAPACITY,
                'schedule_count' => intval($visibility['summary']['entries_count']),
                'modules_count' => intval($visibility['summary']['modules_count']),
                'groups_count' => intval($visibility['summary']['groups_count']),
                'alerts' => $visibility['alerts'],
                'periods' => $visibility['periods'],
                'schedule' => $visibility['schedule'],
            ];

            $totalEntries += intval($visibility['summary']['entries_count']);
            $totalHours += $this->safeFloat($visibility['summary']['weekly_hours']);

            foreach ($visibility['schedule'] as $entry) {
                if (!empty($entry['group_code'])) {
                    $activeGroups[$entry['group_code']] = true;
                }
            }
        }

        usort($rows, static function (array $left, array $right): int {
            return strcmp((string) ($left['nom'] ?? ''), (string) ($right['nom'] ?? ''));
        });

        return [
            'summary' => [
                'planned_courses' => $totalEntries,
                'programmed_hours' => round($totalHours, 2),
                'active_groups' => count($activeGroups),
                'active_formateurs' => count($rows),
            ],
            'week' => [
                'number' => $resolvedWeek,
                'range' => $this->getWeekRange($this->academicConfig->current(), $resolvedWeek),
            ],
            'rows' => $rows,
        ];
    }

    public function all(array $filters = []): array
    {
        return $this->planning->all($filters);
    }

    public function sessionOptions(int $formateurId, ?int $annee = null): array
    {
        return $this->planning->getSessionOptionsForTrainer($formateurId, $annee ?? currentAcademicYear());
    }

    public function sessions(?int $week = null, ?int $formateurId = null): array
    {
        return $this->planning->listSessions([
            'week_number' => $week ?? currentAcademicWeek(),
            'formateur_id' => $formateurId,
        ]);
    }

    public function find(int $id): array
    {
        $row = $this->planning->find($id);
        if (!$row) {
            throw new NotFoundException('L entree de planning est introuvable.');
        }

        return $row;
    }

    public function create(array $data): array
    {
        $this->validation->validatePlanning(
            intval($data['formateur_id']),
            intval($data['module_id']),
            intval($data['semaine']),
            floatval($data['heures'])
        );

        $id = $this->planning->create($data);

        return $this->find($id);
    }

    public function update(int $id, array $data): array
    {
        $this->find($id);

        $this->validation->validatePlanning(
            intval($data['formateur_id']),
            intval($data['module_id']),
            intval($data['semaine']),
            floatval($data['heures']),
            $id
        );

        $this->planning->update($id, $data);

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $this->find($id);
        $this->planning->delete($id);
    }

    public function saveSession(array $data): array
    {
        $payload = $this->buildSessionPayload($data);

        $this->validation->validatePlanningSession(
            $payload['formateur_id'],
            $payload['module_id'],
            $payload['week_number'],
            $payload['day_of_week'],
            $payload['start_time'],
            $payload['end_time'],
            $payload['duration_hours'],
            $payload['id']
        );

        if ($payload['id'] !== null) {
            $existing = $this->planning->findSession($payload['id']);
            if (!$existing) {
                throw new NotFoundException('Le creneau de planning est introuvable.');
            }

            $this->planning->updateSession($payload['id'], $payload);
            $this->planning->syncPlanningHoursFromSessions(
                intval($existing['formateur_id']),
                intval($existing['module_id']),
                intval($existing['week_number'])
            );
            $this->planning->syncPlanningHoursFromSessions(
                $payload['formateur_id'],
                $payload['module_id'],
                $payload['week_number']
            );

            $updated = $this->planning->findSession($payload['id']);
            if (!$updated) {
                throw new RuntimeException('Le creneau mis a jour est introuvable.');
            }

            return $updated;
        }

        $id = $this->planning->createSession($payload);
        $this->planning->syncPlanningHoursFromSessions(
            $payload['formateur_id'],
            $payload['module_id'],
            $payload['week_number']
        );

        $created = $this->planning->findSession($id);
        if (!$created) {
            throw new RuntimeException('Le creneau cree est introuvable.');
        }

        return $created;
    }

    public function deleteSession(int $id): void
    {
        $existing = $this->planning->findSession($id);
        if (!$existing) {
            throw new NotFoundException('Le creneau de planning est introuvable.');
        }

        $this->planning->deleteSession($id);
        $this->planning->syncPlanningHoursFromSessions(
            intval($existing['formateur_id']),
            intval($existing['module_id']),
            intval($existing['week_number'])
        );
    }

    public function weeklyStats(int $formateurId, ?int $week = null): array
    {
        return [
            'weekly_limit' => 26,
            'stats' => $this->planning->getWeeklyStatsForTrainer($formateurId, $week),
        ];
    }

    public function assignedModules(int $formateurId, ?int $annee = null): array
    {
        return $this->affectations->all([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);
    }

    public function validationDashboard(array $filters = []): array
    {
        return [
            'summary' => $this->planning->getValidationSummary(),
            'history' => $this->planning->getValidationHistory(5),
            'queue' => $this->planning->getValidationQueue($filters),
        ];
    }

    public function validationSummary(): array
    {
        return $this->planning->getValidationSummary();
    }

    public function validationHistory(int $limit = 5): array
    {
        return $this->planning->getValidationHistory($limit);
    }

    public function validationQueue(array $filters = []): array
    {
        return $this->planning->getValidationQueue($filters);
    }

    public function submissionDetail(int $submissionId): array
    {
        $submission = $this->planning->findSubmission($submissionId);
        if (!$submission) {
            throw new NotFoundException('La soumission de planning est introuvable.');
        }

        return [
            'submission' => $submission,
            'entries' => $this->planning->getSubmissionPlanningEntries(
                intval($submission['formateur_id']),
                intval($submission['semaine'])
            ),
        ];
    }

    public function updateValidationStatus(int $submissionId, string $status, ?string $note, int $processedBy): array
    {
        $submission = $this->planning->findSubmission($submissionId);
        if (!$submission) {
            throw new NotFoundException('La soumission de planning est introuvable.');
        }

        $this->planning->updateSubmissionStatusByIds([$submissionId], $status, $processedBy, $note);
        $this->planning->logSubmissionActivities([$submissionId], $status);

        $updated = $this->planning->findSubmission($submissionId);

        if (!$updated) {
            throw new NotFoundException('La soumission de planning est introuvable apres mise a jour.');
        }

        return $updated;
    }

    public function bulkUpdateValidationStatus(array $submissionIds, string $status, ?string $note, int $processedBy): array
    {
        $updatedCount = $this->planning->updateSubmissionStatusByIds($submissionIds, $status, $processedBy, $note);
        $this->planning->logSubmissionActivities($submissionIds, $status);

        return [
            'updated_count' => $updatedCount,
            'status' => $status,
        ];
    }
}
