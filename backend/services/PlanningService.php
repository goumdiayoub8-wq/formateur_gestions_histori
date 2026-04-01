<?php

require_once __DIR__ . '/../repositories/PlanningRepository.php';
require_once __DIR__ . '/../repositories/AffectationRepository.php';
require_once __DIR__ . '/../repositories/DashboardRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../repositories/AcademicConfigRepository.php';
require_once __DIR__ . '/../services/ValidationService.php';
require_once __DIR__ . '/../services/PlanningAlertService.php';
require_once __DIR__ . '/../core/HttpException.php';
require_once __DIR__ . '/../core/helpers.php';

class PlanningService
{
    private const DAY_LABELS = [
        1 => 'Lundi',
        2 => 'Mardi',
        3 => 'Mercredi',
        4 => 'Jeudi',
        5 => 'Vendredi',
        6 => 'Samedi',
        7 => 'Dimanche',
    ];
    private const DERIVED_DAY_ORDER = [1, 2, 3, 4, 5];
    private const GRID_START_HOUR = 8;
    private const GRID_END_HOUR = 18;
    private const GRID_SLOT_MINUTES = 30;
    private const MAX_WEEKLY_HOURS = 44.0;
    private const CHEF_WEEKLY_CAPACITY = 44;
    private const ACCENT_COLORS = ['#2c5a91', '#8b3dff', '#1f8f6b', '#d97706', '#db2777', '#2563eb'];
    private const DEMANDE_STATUS_PENDING = 'pending';
    private const DEMANDE_STATUS_VALIDATED = 'validated';
    private const DEMANDE_STATUS_PLANNED = 'planned';
    private const DEMANDE_STATUS_REJECTED = 'rejected';

    private PDO $db;
    private PlanningRepository $planning;
    private AffectationRepository $affectations;
    private DashboardRepository $dashboard;
    private FormateurRepository $formateurs;
    private AcademicConfigRepository $academicConfig;
    private ValidationService $validation;
    private PlanningAlertService $alerts;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->planning = new PlanningRepository($db);
        $this->affectations = new AffectationRepository($db);
        $this->dashboard = new DashboardRepository($db);
        $this->formateurs = new FormateurRepository($db);
        $this->academicConfig = new AcademicConfigRepository($db);
        $this->validation = new ValidationService($db);
        $this->alerts = new PlanningAlertService($db);
    }

    private function inTransaction(callable $callback)
    {
        $ownsTransaction = !$this->db->inTransaction();

        if ($ownsTransaction) {
            $this->db->beginTransaction();
        }

        try {
            $result = $callback();

            if ($ownsTransaction && $this->db->inTransaction()) {
                $this->db->commit();
            }

            return $result;
        } catch (Throwable $exception) {
            if ($ownsTransaction && $this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }

    private function safeFloat($value): float
    {
        return round(floatval($value ?? 0), 2);
    }

    private function validateSystemWeekNumber(int $week): int
    {
        if ($week < SYSTEM_WEEK_MIN || $week > SYSTEM_WEEK_MAX) {
            throw new ValidationException(sprintf(
                'La semaine doit etre comprise entre %d et %d.',
                SYSTEM_WEEK_MIN,
                SYSTEM_WEEK_MAX
            ));
        }

        return $week;
    }

    private function resolveSystemWeek(?int $week = null): int
    {
        return $this->validateSystemWeekNumber($week ?? currentAcademicWeek());
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
        $weekNumber = $this->validateSystemWeekNumber(intval($data['week_number']));
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
        if ($startDate === null || $week < SYSTEM_WEEK_MIN) {
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

    private function buildPlanningContextKey(int $moduleId, ?string $groupCode = null): string
    {
        return $moduleId . '|' . trim((string) ($groupCode ?? ''));
    }

    private function mapChangeRequestsByPlanningContext(array $requests): array
    {
        $map = [];

        foreach ($requests as $request) {
            $key = $this->buildPlanningContextKey(
                intval($request['module_id'] ?? 0),
                $request['groupe_code'] ?? ''
            );

            if (!isset($map[$key])) {
                $map[$key] = $request;
            }
        }

        return $map;
    }

    private function roundHalfHour(float $value): float
    {
        return round($value * 2) / 2;
    }

    private function clampWeeklyHours(float $value): float
    {
        return round(max(0, min(self::MAX_WEEKLY_HOURS, $value)), 2);
    }

    private function minutesToTime(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;

        return sprintf('%02d:%02d:00', $hours, $mins);
    }

    private function buildTimeRange(string $startTime, string $endTime): string
    {
        return substr($startTime, 0, 5) . 'h-' . substr($endTime, 0, 5) . 'h';
    }

    private function slotsPerDay(): int
    {
        return intval(((self::GRID_END_HOUR - self::GRID_START_HOUR) * 60) / self::GRID_SLOT_MINUTES);
    }

    private function resolveDayLabel(int $dayOfWeek): string
    {
        return self::DAY_LABELS[$dayOfWeek] ?? ('Jour ' . $dayOfWeek);
    }

    private function buildAccent(int $moduleId, int $fallbackIndex = 0): string
    {
        $index = $moduleId > 0 ? $moduleId : $fallbackIndex;

        return self::ACCENT_COLORS[$index % count(self::ACCENT_COLORS)];
    }

    private function sumModuleHours(array $modules): float
    {
        return round(array_reduce($modules, function (float $sum, array $module): float {
            return $sum + $this->safeFloat($module['volume_horaire'] ?? 0);
        }, 0.0), 2);
    }

    private function resolveTrainerWeeklyTarget(array $trainer, array $modules): float
    {
        $configured = $this->safeFloat($trainer['weekly_hours'] ?? $trainer['weekly_hours_target'] ?? 0);
        if ($configured > 0) {
            return $this->clampWeeklyHours($configured);
        }

        $assignedHours = $this->sumModuleHours($modules);
        if ($assignedHours <= 0) {
            return 0.0;
        }

        return $this->clampWeeklyHours($assignedHours / ACADEMIC_WEEKS);
    }

    private function buildModuleDistribution(array $modules, float $weeklyTarget): array
    {
        $assignedHours = $this->sumModuleHours($modules);
        $plannedWeeklyHours = round(array_reduce($modules, function (float $sum, array $module): float {
            return $sum + $this->safeFloat($module['weekly_hours'] ?? 0);
        }, 0.0), 2);

        if ($plannedWeeklyHours > 0) {
            return array_map(function (array $module): array {
                $moduleHours = $this->safeFloat($module['volume_horaire'] ?? 0);
                $moduleWeeklyHours = $this->safeFloat($module['weekly_hours'] ?? 0);

                return array_merge($module, [
                    'weekly_target_hours' => $moduleWeeklyHours,
                    'total_hours' => $moduleHours,
                    'distribution_weeks' => ACADEMIC_WEEKS,
                    'completion_ratio' => $moduleHours > 0
                        ? round(min(100, ($moduleWeeklyHours * ACADEMIC_WEEKS / $moduleHours) * 100), 2)
                        : 0.0,
                ]);
            }, $modules);
        }

        if ($assignedHours <= 0 || $weeklyTarget <= 0) {
            return array_map(function (array $module): array {
                return array_merge($module, [
                    'weekly_target_hours' => 0.0,
                    'total_hours' => $this->safeFloat($module['volume_horaire'] ?? 0),
                    'distribution_weeks' => ACADEMIC_WEEKS,
                    'completion_ratio' => 0.0,
                ]);
            }, $modules);
        }

        $rows = [];
        $baseSum = 0.0;

        foreach ($modules as $index => $module) {
            $moduleHours = $this->safeFloat($module['volume_horaire'] ?? 0);
            $raw = $assignedHours > 0 ? ($weeklyTarget * $moduleHours) / $assignedHours : 0.0;
            $base = floor(($raw * 2) + 0.0001) / 2;
            $rows[] = [
                'index' => $index,
                'module' => $module,
                'weekly_target_hours' => $base,
                'remainder' => $raw - $base,
            ];
            $baseSum += $base;
        }

        $remaining = round(max(0, $weeklyTarget - $baseSum), 2);
        usort($rows, static function (array $left, array $right): int {
            if ($left['remainder'] === $right['remainder']) {
                return $left['index'] <=> $right['index'];
            }

            return $right['remainder'] <=> $left['remainder'];
        });

        while ($remaining >= 0.5 && count($rows) > 0) {
            foreach ($rows as &$row) {
                if ($remaining < 0.5) {
                    break;
                }

                $row['weekly_target_hours'] = round($row['weekly_target_hours'] + 0.5, 2);
                $remaining = round($remaining - 0.5, 2);
            }
            unset($row);
        }

        usort($rows, static fn(array $left, array $right): int => $left['index'] <=> $right['index']);

        return array_map(function (array $row): array {
            $module = $row['module'];
            $moduleHours = $this->safeFloat($module['volume_horaire'] ?? 0);
            $weeklyHours = round($row['weekly_target_hours'], 2);

            return [
                ...$module,
                'weekly_target_hours' => $weeklyHours,
                'total_hours' => $moduleHours,
                'distribution_weeks' => ACADEMIC_WEEKS,
                'completion_ratio' => $moduleHours > 0
                    ? round(min(100, ($weeklyHours * ACADEMIC_WEEKS / $moduleHours) * 100), 2)
                    : 0.0,
            ];
        }, $rows);
    }

    private function buildDerivedScheduleEntries(array $distribution, int $week, array $periods): array
    {
        $entries = [];
        $occupied = [];
        $slotCount = $this->slotsPerDay();

        foreach ($distribution as $index => $module) {
            $remaining = $this->safeFloat($module['weekly_target_hours'] ?? 0);
            if ($remaining <= 0) {
                continue;
            }

            $groupCodes = is_array($module['group_codes'] ?? null) ? array_values($module['group_codes']) : [];
            $groupIndex = 0;

            while ($remaining > 0.01) {
                $chunk = $remaining >= 2 ? 2.0 : $this->roundHalfHour($remaining);
                $requiredSlots = max(1, intval(round(($chunk * 60) / self::GRID_SLOT_MINUTES)));
                $placed = false;

                foreach (self::DERIVED_DAY_ORDER as $dayOfWeek) {
                    $occupied[$dayOfWeek] = $occupied[$dayOfWeek] ?? array_fill(0, $slotCount, false);

                    for ($slot = 0; $slot <= $slotCount - $requiredSlots; $slot++) {
                        $available = true;

                        for ($cursor = 0; $cursor < $requiredSlots; $cursor++) {
                            if (!empty($occupied[$dayOfWeek][$slot + $cursor])) {
                                $available = false;
                                break;
                            }
                        }

                        if (!$available) {
                            continue;
                        }

                        for ($cursor = 0; $cursor < $requiredSlots; $cursor++) {
                            $occupied[$dayOfWeek][$slot + $cursor] = true;
                        }

                        $startMinutes = (self::GRID_START_HOUR * 60) + ($slot * self::GRID_SLOT_MINUTES);
                        $endMinutes = $startMinutes + ($requiredSlots * self::GRID_SLOT_MINUTES);
                        $startTime = $this->minutesToTime($startMinutes);
                        $endTime = $this->minutesToTime($endMinutes);
                        $groupCode = $groupCodes !== []
                            ? $groupCodes[$groupIndex % count($groupCodes)]
                            : 'Aucun groupe';

                        $entries[] = [
                            'id' => sprintf('derived-%s-%s-%s-%s', $module['id'] ?? 'm', $week, $dayOfWeek, $slot),
                            'formateur_id' => intval($module['formateur_id'] ?? 0),
                            'module_id' => intval($module['id'] ?? 0),
                            'is_session' => false,
                            'status' => 'derived',
                            'session_date' => null,
                            'module_code' => $module['code'] ?? '',
                            'module_name' => $module['intitule'] ?? '',
                            'group_code' => $groupCode,
                            'day_of_week' => $dayOfWeek,
                            'day_label' => $this->resolveDayLabel($dayOfWeek),
                            'day_index' => $dayOfWeek - 1,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'time_range' => $this->buildTimeRange($startTime, $endTime),
                            'duration_hours' => round($requiredSlots * self::GRID_SLOT_MINUTES / 60, 2),
                            'duration_label' => $this->formatHour(round($requiredSlots * self::GRID_SLOT_MINUTES / 60, 2)),
                            'room_code' => 'SN-12',
                            'task_label' => $this->buildTaskLabel($module, $periods),
                            'status_label' => 'Distribue',
                            'accent' => $this->buildAccent(intval($module['id'] ?? 0), $index),
                        ];

                        $groupIndex++;
                        $remaining = round(max(0, $remaining - $chunk), 2);
                        $placed = true;
                        break 2;
                    }
                }

                if (!$placed) {
                    break;
                }
            }
        }

        return $entries;
    }

    private function buildScheduleFromSessions(array $sessions, array $modules, array $periods, array $requestMap = []): array
    {
        $moduleMap = [];
        foreach ($modules as $index => $module) {
            $moduleMap[intval($module['id'] ?? 0)] = [
                'module' => $module,
                'accent' => $this->buildAccent(intval($module['id'] ?? 0), $index),
            ];
        }

        return array_map(function (array $session) use ($moduleMap, $periods, $requestMap): array {
            $moduleMeta = $moduleMap[intval($session['module_id'] ?? 0)] ?? null;
            $module = $moduleMeta['module'] ?? [];
            $startTime = $session['start_time'] ?? '08:00:00';
            $endTime = $session['end_time'] ?? '08:00:00';
            $request = $requestMap[$this->buildPlanningContextKey(
                intval($session['module_id'] ?? 0),
                $session['groupe_code'] ?? ''
            )] ?? null;

            return [
                'id' => intval($session['id'] ?? 0),
                'formateur_id' => intval($session['formateur_id'] ?? 0),
                'module_id' => intval($session['module_id'] ?? 0),
                'is_session' => true,
                'status' => $session['status'] ?? 'scheduled',
                'session_date' => $session['session_date'] ?? null,
                'module_code' => $session['module_code'] ?? ($module['code'] ?? ''),
                'module_name' => $session['module_nom'] ?? ($module['intitule'] ?? ''),
                'group_code' => $session['groupe_code'] ?: 'Aucun groupe',
                'day_of_week' => intval($session['day_of_week'] ?? 0),
                'day_label' => $this->resolveDayLabel(intval($session['day_of_week'] ?? 0)),
                'day_index' => max(0, intval($session['day_of_week'] ?? 1) - 1),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'time_range' => $this->buildTimeRange($startTime, $endTime),
                'duration_hours' => round(floatval($session['duration_hours'] ?? 0), 2),
                'duration_label' => $this->formatHour(round(floatval($session['duration_hours'] ?? 0), 2)),
                'room_code' => $session['salle_code'] ?: 'Sans salle',
                'task_label' => $session['task_title'] ?: $this->buildTaskLabel($module, $periods),
                'status_label' => in_array(strtolower((string) ($session['status'] ?? 'scheduled')), ['completed', 'done'], true)
                    ? 'Realise'
                    : ($session['status'] ?: 'Planifie'),
                'change_request' => $request ? [
                    'id' => intval($request['id'] ?? 0),
                    'status' => (string) ($request['status'] ?? 'pending'),
                    'decision' => (string) ($request['decision'] ?? 'change'),
                    'reason' => (string) ($request['reason'] ?? ''),
                ] : null,
                'accent' => $moduleMeta['accent'] ?? $this->buildAccent(intval($session['module_id'] ?? 0)),
            ];
        }, $sessions);
    }

    private function buildPlanningGrid(array $entries): array
    {
        $slots = [];
        $cells = [];
        $slotCount = $this->slotsPerDay();

        foreach (self::DERIVED_DAY_ORDER as $dayOfWeek) {
            $cells[$dayOfWeek] = array_fill(0, $slotCount, []);
        }

        for ($slot = 0; $slot < $slotCount; $slot++) {
            $startMinutes = (self::GRID_START_HOUR * 60) + ($slot * self::GRID_SLOT_MINUTES);
            $endMinutes = $startMinutes + self::GRID_SLOT_MINUTES;
            $slots[] = [
                'index' => $slot,
                'start_time' => $this->minutesToTime($startMinutes),
                'end_time' => $this->minutesToTime($endMinutes),
                'label' => $this->buildTimeRange($this->minutesToTime($startMinutes), $this->minutesToTime($endMinutes)),
            ];
        }

        foreach ($entries as $entry) {
            $dayOfWeek = intval($entry['day_of_week'] ?? 0);
            if (!array_key_exists($dayOfWeek, $cells)) {
                continue;
            }

            $startTime = $entry['start_time'] ?? null;
            $endTime = $entry['end_time'] ?? null;
            if (!$startTime || !$endTime) {
                continue;
            }

            $startMinutes = intval(date('H', strtotime('1970-01-01 ' . $startTime))) * 60 + intval(date('i', strtotime('1970-01-01 ' . $startTime)));
            $endMinutes = intval(date('H', strtotime('1970-01-01 ' . $endTime))) * 60 + intval(date('i', strtotime('1970-01-01 ' . $endTime)));
            $startSlot = max(0, intval(floor(($startMinutes - (self::GRID_START_HOUR * 60)) / self::GRID_SLOT_MINUTES)));
            $endSlot = min($slotCount, intval(ceil(($endMinutes - (self::GRID_START_HOUR * 60)) / self::GRID_SLOT_MINUTES)));

            for ($slot = $startSlot; $slot < $endSlot; $slot++) {
                $cells[$dayOfWeek][$slot][] = $entry['id'];
            }
        }

        return [
            'days' => array_map(function (int $dayOfWeek): array {
                return [
                    'value' => $dayOfWeek,
                    'label' => $this->resolveDayLabel($dayOfWeek),
                ];
            }, self::DERIVED_DAY_ORDER),
            'slots' => $slots,
            'cells' => $cells,
        ];
    }

    private function buildDailyTotals(array $entries): array
    {
        $totals = [];

        foreach (self::DERIVED_DAY_ORDER as $dayOfWeek) {
            $totals[$this->resolveDayLabel($dayOfWeek)] = 0.0;
        }

        foreach ($entries as $entry) {
            $label = $entry['day_label'] ?? '';
            if ($label === '') {
                continue;
            }

            if (!array_key_exists($label, $totals)) {
                $totals[$label] = 0.0;
            }

            $totals[$label] += $this->safeFloat($entry['duration_hours'] ?? 0);
        }

        return array_map(function (string $label) use ($totals): array {
            $hours = round($totals[$label] ?? 0, 2);

            return [
                'label' => $label,
                'hours' => $hours,
                'display_hours' => $this->formatHour($hours),
            ];
        }, array_keys($totals));
    }

    public function checkWeeklyHours(array $formateur): ?array
    {
        $weeklyHours = $this->safeFloat($formateur['weekly_hours'] ?? 0);

        if ($weeklyHours <= self::MAX_WEEKLY_HOURS) {
            return null;
        }

        return [
            'type' => 'warning',
            'tone' => 'warning',
            'code' => 'weekly_overload',
            'message' => 'Charge hebdomadaire elevee',
            'details' => 'Le volume planifie depasse 44h cette semaine.',
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

    private function buildVisibilityContext(array $trainer, array $modules, int $week, int $annee): array
    {
        $sessions = $this->planning->listSessions([
            'week_number' => $week,
            'formateur_id' => intval($trainer['id'] ?? 0),
        ]);
        $weekRange = $this->getWeekRange($this->academicConfig->current(), $week);
        $periods = $this->checkAcademicPeriods($weekRange['start'] ?? null);
        $weeklyTarget = $this->resolveTrainerWeeklyTarget($trainer, $modules);
        $distribution = $this->buildModuleDistribution($modules, $weeklyTarget);
        $requestMap = $this->mapChangeRequestsByPlanningContext(
            $this->dashboard->getLatestTrainerChangeRequestsForWeek(
                intval($trainer['id'] ?? 0),
                $week,
                $annee
            )
        );
        $schedule = $sessions !== []
            ? $this->buildScheduleFromSessions($sessions, $modules, $periods, $requestMap)
            : [];
        $dailyTotals = $this->buildDailyTotals($schedule);
        $weeklyHours = round(array_reduce($schedule, function (float $sum, array $entry): float {
            return $sum + $this->safeFloat($entry['duration_hours'] ?? 0);
        }, 0.0), 2);
        $groupCodes = [];

        foreach ($schedule as $entry) {
            if (!empty($entry['group_code']) && ($entry['group_code'] ?? '') !== 'Aucun groupe') {
                $groupCodes[$entry['group_code']] = true;
            }
        }

        return [
            'sessions' => $sessions,
            'periods' => $periods,
            'week_range' => $weekRange,
            'distribution' => $distribution,
            'grid' => $this->buildPlanningGrid($schedule),
            'schedule' => $schedule,
            'daily_totals' => $dailyTotals,
            'weekly_hours' => $weeklyHours,
            'weekly_target_hours' => $weeklyTarget,
            'weekly_limit_hours' => self::MAX_WEEKLY_HOURS,
            'total_assigned_hours' => $this->sumModuleHours($modules),
            'group_codes' => array_keys($groupCodes),
            'year' => $annee,
        ];
    }

    public function trainerVisibility(int $formateurId, ?int $week = null, ?int $annee = null): array
    {
        $resolvedWeek = $this->resolveSystemWeek($week);
        $resolvedYear = $annee ?? currentAcademicYear();
        $trainerStats = $this->dashboard->getTrainerKpis($formateurId, $resolvedWeek, $resolvedYear);
        if (!$trainerStats) {
            throw new NotFoundException('Formateur introuvable.');
        }
        $trainer = $this->formateurs->find($formateurId);

        $modules = $this->dashboard->getTrainerAssignedModules($formateurId, $resolvedYear, $resolvedWeek);
        $context = $this->buildVisibilityContext(array_merge($trainerStats, $trainer), $modules, $resolvedWeek, $resolvedYear);

        $alertContext = [
            'id' => intval($trainer['id'] ?? 0),
            'nom' => $trainer['nom'] ?? '',
            'weekly_hours' => $context['weekly_hours'],
            'schedule' => $context['schedule'],
            'periods' => $context['periods'],
        ];
        $alerts = $this->buildTrainerAlerts($alertContext);

        return [
            'profile' => [
                'id' => intval($trainer['id'] ?? 0),
                'nom' => $trainer['nom'] ?? '',
                'email' => $trainer['email'] ?? ($trainerStats['email'] ?? ''),
                'telephone' => $trainer['telephone'] ?? ($trainerStats['telephone'] ?? ''),
                'specialite' => $trainer['specialite'] ?? '',
                'max_heures' => intval($trainer['max_heures'] ?? 910),
                'weekly_hours' => round($this->safeFloat($trainer['weekly_hours'] ?? 0), 2),
            ],
            'summary' => [
                'week' => $resolvedWeek,
                'weekly_hours' => $context['weekly_hours'],
                'weekly_target_hours' => $context['weekly_target_hours'],
                'weekly_limit_hours' => $context['weekly_limit_hours'],
                'total_assigned_hours' => $context['total_assigned_hours'],
                'entries_count' => count($context['schedule']),
                'modules_count' => count($modules),
                'groups_count' => count($context['group_codes']),
                'alerts_count' => count($alerts),
                'distribution_weeks' => ACADEMIC_WEEKS,
                'has_manual_sessions' => $context['sessions'] !== [],
            ],
            'periods' => $context['periods'],
            'week_range' => $context['week_range'],
            'modules' => $modules,
            'sessions' => $context['sessions'],
            'distribution' => $context['distribution'],
            'grid' => $context['grid'],
            'schedule' => $context['schedule'],
            'daily_totals' => $context['daily_totals'],
            'alerts' => $alerts,
        ];
    }

    public function teamVisibility(?int $week = null, ?int $annee = null): array
    {
        $resolvedWeek = $this->resolveSystemWeek($week);
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
                'weekly_target_hours' => round($visibility['summary']['weekly_target_hours'], 2),
                'weekly_limit_hours' => round($visibility['summary']['weekly_limit_hours'], 2),
                'total_assigned_hours' => round($visibility['summary']['total_assigned_hours'], 2),
                'display_capacity_hours' => self::CHEF_WEEKLY_CAPACITY,
                'schedule_count' => intval($visibility['summary']['entries_count']),
                'modules_count' => intval($visibility['summary']['modules_count']),
                'groups_count' => intval($visibility['summary']['groups_count']),
                'alerts' => $visibility['alerts'],
                'periods' => $visibility['periods'],
                'distribution' => $visibility['distribution'],
                'grid' => $visibility['grid'],
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

    private function resolveDemandeAutoStatus(array $demande, ?array $planningContext = null): string
    {
        $currentStatus = (string) ($demande['status'] ?? self::DEMANDE_STATUS_PENDING);
        if ($currentStatus === self::DEMANDE_STATUS_REJECTED || $currentStatus === self::DEMANDE_STATUS_PENDING) {
            return $currentStatus;
        }

        $weekNumber = isset($planningContext['week_number'])
            ? $this->validateSystemWeekNumber(intval($planningContext['week_number']))
            : ($demande['request_week'] !== null ? $this->validateSystemWeekNumber(intval($demande['request_week'])) : null);

        if ($weekNumber === null) {
            return $currentStatus === self::DEMANDE_STATUS_PLANNED
                ? self::DEMANDE_STATUS_VALIDATED
                : self::DEMANDE_STATUS_VALIDATED;
        }

        $linkedSessions = $this->dashboard->countPlanningSessionsForContext(
            intval($demande['formateur_id']),
            intval($demande['module_id']),
            $weekNumber,
            $demande['groupe_code'] ?? null
        );

        if ($linkedSessions > 0) {
            return self::DEMANDE_STATUS_PLANNED;
        }

        return self::DEMANDE_STATUS_VALIDATED;
    }

    public function updateDemandeStatus(int $demandeId, ?string $requestedStatus = null, ?string $note = null, ?array $planningContext = null): array
    {
        return $this->inTransaction(function () use ($demandeId, $requestedStatus, $note, $planningContext): array {
            $demande = $this->dashboard->findTrainerChangeRequestById($demandeId);
            if (!$demande) {
                throw new NotFoundException('La demande de planning est introuvable.');
            }

            $currentStatus = (string) ($demande['status'] ?? self::DEMANDE_STATUS_PENDING);

            if ($requestedStatus !== null) {
                if (!in_array($requestedStatus, [self::DEMANDE_STATUS_VALIDATED, self::DEMANDE_STATUS_REJECTED], true)) {
                    throw new ValidationException('Le statut de revue est invalide.');
                }

                if ($currentStatus === self::DEMANDE_STATUS_REJECTED && $requestedStatus !== self::DEMANDE_STATUS_REJECTED) {
                    throw new ValidationException('Une demande refusee ne peut plus etre modifiee.');
                }

                if ($currentStatus !== self::DEMANDE_STATUS_PENDING && $currentStatus !== $requestedStatus) {
                    throw new ValidationException('Seules les demandes en attente peuvent etre validees ou refusees.');
                }

                if ($currentStatus !== $requestedStatus) {
                    $this->dashboard->updateTrainerChangeRequestStatus($demandeId, $requestedStatus, [
                        'touch_processed_at' => true,
                    ]);
                    $demande['status'] = $requestedStatus;
                    $demande['updated_at'] = date('Y-m-d H:i:s');
                    $demande['processed_at'] = date('Y-m-d H:i:s');
                    $this->dashboard->logTrainerChangeRequestActivity($demande, $requestedStatus, $note);
                }

                return [
                    'id' => intval($demande['id']),
                    'status' => $demande['status'],
                ];
            }

            if ($currentStatus === self::DEMANDE_STATUS_REJECTED) {
                return [
                    'id' => intval($demande['id']),
                    'status' => $currentStatus,
                ];
            }

            $targetStatus = $this->resolveDemandeAutoStatus($demande, $planningContext);
            if ($targetStatus === self::DEMANDE_STATUS_PLANNED) {
                $weekNumber = isset($planningContext['week_number'])
                    ? $this->validateSystemWeekNumber(intval($planningContext['week_number']))
                    : ($demande['request_week'] !== null ? $this->validateSystemWeekNumber(intval($demande['request_week'])) : null);

                if ($weekNumber === null) {
                    throw new ValidationException('Une demande ne peut pas etre planifiee sans semaine assignee.');
                }

                $linkedSessions = $this->dashboard->countPlanningSessionsForContext(
                    intval($demande['formateur_id']),
                    intval($demande['module_id']),
                    $weekNumber,
                    $demande['groupe_code'] ?? null
                );
                if ($linkedSessions <= 0) {
                    throw new ValidationException('Une demande ne peut pas etre planifiee sans creneaux de planning.');
                }
            }

            if ($targetStatus !== $currentStatus) {
                $statusWeekNumber = null;
                if (isset($planningContext['week_number'])) {
                    $statusWeekNumber = $this->validateSystemWeekNumber(intval($planningContext['week_number']));
                } elseif ($demande['request_week'] !== null) {
                    $statusWeekNumber = $this->validateSystemWeekNumber(intval($demande['request_week']));
                }

                $this->dashboard->updateTrainerChangeRequestStatus($demandeId, $targetStatus, [
                    'week_number' => $statusWeekNumber,
                    'group_code' => $planningContext['group_code'] ?? ($demande['groupe_code'] ?? ''),
                ]);
            }

            return [
                'id' => intval($demande['id']),
                'status' => $targetStatus,
            ];
        });
    }

    private function syncDemandeStatusesForPlanningContext(int $formateurId, int $moduleId, int $weekNumber, ?string $groupCode = null): void
    {
        $requestIds = $this->dashboard->findTrainerChangeRequestIdsByPlanningContext(
            $formateurId,
            $moduleId,
            $weekNumber,
            [self::DEMANDE_STATUS_VALIDATED, self::DEMANDE_STATUS_PLANNED]
        );

        foreach ($requestIds as $requestId) {
            $this->updateDemandeStatus($requestId, null, null, [
                'week_number' => $weekNumber,
                'group_code' => $groupCode,
            ]);
        }
    }

    public function reviewDemandeRequest(int $requestId, string $status, ?string $note = null): array
    {
        return $this->updateDemandeStatus($requestId, $status, $note);
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
            'week_number' => $this->resolveSystemWeek($week),
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
        $data['semaine'] = $this->validateSystemWeekNumber(intval($data['semaine']));

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
        $data['semaine'] = $this->validateSystemWeekNumber(intval($data['semaine']));

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
        $this->inTransaction(function () use ($id): void {
            $existing = $this->find($id);
            $this->planning->delete($id);
            $this->syncDemandeStatusesForPlanningContext(
                intval($existing['formateur_id']),
                intval($existing['module_id']),
                intval($existing['semaine'])
            );
        });
    }

    public function saveSession(array $data): array
    {
        return $this->inTransaction(function () use ($data): array {
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
                $this->syncDemandeStatusesForPlanningContext(
                    intval($existing['formateur_id']),
                    intval($existing['module_id']),
                    intval($existing['week_number'])
                );

                $updated = $this->planning->findSession($payload['id']);
                if (!$updated) {
                    throw new RuntimeException('Le creneau mis a jour est introuvable.');
                }

                $this->syncDemandeStatusesForPlanningContext(
                    intval($updated['formateur_id']),
                    intval($updated['module_id']),
                    intval($updated['week_number']),
                    $updated['groupe_code'] ?? null
                );

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

            $this->syncDemandeStatusesForPlanningContext(
                intval($created['formateur_id']),
                intval($created['module_id']),
                intval($created['week_number']),
                $created['groupe_code'] ?? null
            );

            return $created;
        });
    }

    public function deleteSession(int $id): void
    {
        $this->inTransaction(function () use ($id): void {
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
            $this->syncDemandeStatusesForPlanningContext(
                intval($existing['formateur_id']),
                intval($existing['module_id']),
                intval($existing['week_number'])
            );
        });
    }

    public function completeSession(int $id, ?int $actorFormateurId = null, ?int $actorRoleId = null): array
    {
        return $this->inTransaction(function () use ($id, $actorFormateurId, $actorRoleId): array {
            $existing = $this->planning->findSession($id);
            if (!$existing) {
                throw new NotFoundException('Le creneau de planning est introuvable.');
            }

            $resolvedRoleId = $actorRoleId ?? currentUserRoleId();
            if ($resolvedRoleId !== null && !in_array($resolvedRoleId, [1, 2, 3], true)) {
                throw new ForbiddenException();
            }

            if ($resolvedRoleId === 3) {
                if ($actorFormateurId === null || $actorFormateurId <= 0) {
                    throw new ForbiddenException();
                }

                if (intval($existing['formateur_id']) !== $actorFormateurId) {
                    throw new ForbiddenException('Vous ne pouvez marquer comme realisees que vos propres seances.');
                }
            }

            $currentStatus = strtolower(trim((string) ($existing['status'] ?? 'scheduled')));
            if ($currentStatus === 'completed' || $currentStatus === 'done') {
                return $existing;
            }

            if ($currentStatus !== 'scheduled') {
                throw new ValidationException('Seules les seances planifiees peuvent etre marquees comme realisees.');
            }

            $sessionDate = $this->startOfDay($existing['session_date'] ?? null);
            if ($sessionDate === null) {
                throw new ValidationException('La date de la seance est requise pour la marquer comme realisee.');
            }

            $today = new DateTimeImmutable('today');
            if ($sessionDate > $today) {
                throw new ValidationException('Une seance future ne peut pas etre marquee comme realisee.');
            }

            $this->planning->updateSessionStatus($id, 'done');

            $updated = $this->planning->findSession($id);
            if (!$updated) {
                throw new RuntimeException('Le creneau mis a jour est introuvable.');
            }

            return $updated;
        });
    }

    public function weeklyStats(int $formateurId, ?int $week = null): array
    {
        return [
            'weekly_limit' => self::MAX_WEEKLY_HOURS,
            'stats' => $this->planning->getWeeklyStatsForTrainer(
                $formateurId,
                $week !== null ? $this->validateSystemWeekNumber($week) : null
            ),
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
        $matrix = $this->planning->getValidationMatrix($filters);
        $incompleteFormateurs = $this->alerts->detectIncompleteFormateurs($matrix);

        $this->inTransaction(function () use ($incompleteFormateurs): void {
            $this->alerts->notifyFormateurs($incompleteFormateurs);
            $this->alerts->notifyChefPole($incompleteFormateurs);
        });

        return [
            'summary' => $this->planning->getValidationSummary(),
            'history' => $this->planning->getValidationHistory(5),
            'queue' => $this->planning->getValidationQueue($filters),
            'matrix' => $matrix,
            'incomplete_formateurs' => $incompleteFormateurs,
            'has_alerts' => $incompleteFormateurs !== [],
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
            'entries' => $this->planning->getSubmissionPlanningEntriesBySubmissionId($submissionId),
        ];
    }

    public function updateValidationStatus(int $submissionId, string $status, ?string $note, int $processedBy): array
    {
        return $this->inTransaction(function () use ($submissionId, $status, $note, $processedBy): array {
            $submission = $this->planning->findSubmission($submissionId);
            if (!$submission) {
                throw new NotFoundException('La soumission de planning est introuvable.');
            }

            $this->planning->captureSubmissionSnapshotsByIds([$submissionId]);
            $this->planning->updateSubmissionStatusByIds([$submissionId], $status, $processedBy, $note);
            $this->planning->logSubmissionActivities([$submissionId], $status);

            $updated = $this->planning->findSubmission($submissionId);

            if (!$updated) {
                throw new NotFoundException('La soumission de planning est introuvable apres mise a jour.');
            }

            return $updated;
        });
    }

    public function bulkUpdateValidationStatus(array $submissionIds, string $status, ?string $note, int $processedBy): array
    {
        return $this->inTransaction(function () use ($submissionIds, $status, $note, $processedBy): array {
            $this->planning->captureSubmissionSnapshotsByIds($submissionIds);
            $updatedCount = $this->planning->updateSubmissionStatusByIds($submissionIds, $status, $processedBy, $note);
            $this->planning->logSubmissionActivities($submissionIds, $status);

            return [
                'updated_count' => $updatedCount,
                'status' => $status,
            ];
        });
    }
}
