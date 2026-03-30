<?php

require_once __DIR__ . '/../core/helpers.php';

class PlanningRepository
{
    private const MAX_WEEKLY_VALIDATION_HOURS = 44.0;
    private const VALIDATION_WEEK_START = VALIDATION_START_WEEK;
    private const VALIDATION_WEEK_END = SYSTEM_WEEK_MAX;
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function normalizeRow(array $row): array
    {
        $row['id'] = intval($row['id'] ?? 0);
        $row['formateur_id'] = intval($row['formateur_id'] ?? 0);
        $row['module_id'] = intval($row['module_id'] ?? 0);
        $row['semaine'] = intval($row['semaine'] ?? 0);
        $row['heures'] = round(floatval($row['heures'] ?? 0), 2);

        return $row;
    }

    private function normalizeSubmissionRow(array $row): array
    {
        return [
            'id' => intval($row['id'] ?? 0),
            'formateur_id' => intval($row['formateur_id'] ?? 0),
            'formateur_nom' => $row['formateur_nom'] ?? '',
            'specialite' => $row['specialite'] ?? '',
            'telephone' => $row['telephone'] ?? '',
            'email' => $row['email'] ?? '',
            'max_heures' => intval($row['max_heures'] ?? 910),
            'semaine' => intval($row['semaine'] ?? 0),
            'academic_year' => intval($row['academic_year'] ?? 0),
            'submitted_hours' => round(floatval($row['submitted_hours'] ?? 0), 2),
            'status' => $row['status'] ?? 'pending',
            'submitted_at' => $row['submitted_at'] ?? null,
            'processed_at' => $row['processed_at'] ?? null,
            'decision_note' => $row['decision_note'] ?? null,
            'annual_hours' => round(floatval($row['annual_hours'] ?? 0), 2),
            'week_hours' => round(floatval($row['week_hours'] ?? $row['submitted_hours'] ?? 0), 2),
            'module_count' => intval($row['module_count'] ?? 0),
            'module_codes' => ($row['module_codes'] ?? '') !== '' ? explode(',', $row['module_codes']) : [],
            'module_titles' => ($row['module_titles'] ?? '') !== '' ? explode(' | ', $row['module_titles']) : [],
            'overload' => !empty($row['overload']),
            'incomplete' => !empty($row['incomplete']),
            'source_status' => $row['source_status'] ?? ($row['status'] ?? 'pending'),
            'status_reason' => $row['status_reason'] ?? null,
            'overload_weeks' => is_array($row['overload_weeks'] ?? null) ? $row['overload_weeks'] : [],
            'incomplete_range' => $row['incomplete_range'] ?? '',
            'weeks' => is_array($row['weeks'] ?? null) ? $row['weeks'] : [],
        ];
    }

    private function buildInClause(array $values): array
    {
        $placeholders = implode(', ', array_fill(0, count($values), '?'));

        return [$placeholders, array_values($values)];
    }

    private function hasSubmissionSnapshot(array $row): bool
    {
        return !empty($row['snapshot_captured_at'])
            || ($row['snapshot_total_hours'] ?? null) !== null
            || trim((string) ($row['snapshot_entries'] ?? '')) !== '';
    }

    private function decodeSubmissionSnapshotEntries(?string $snapshotEntries): array
    {
        if ($snapshotEntries === null || trim($snapshotEntries) === '') {
            return [];
        }

        $decoded = json_decode($snapshotEntries, true);
        if (!is_array($decoded)) {
            return [];
        }

        $entries = [];
        foreach ($decoded as $row) {
            if (!is_array($row)) {
                continue;
            }

            $entries[] = $this->normalizeRow($row);
        }

        return $entries;
    }

    public function all(array $filters = []): array
    {
        $sql = 'SELECT
                    p.id,
                    p.formateur_id,
                    p.module_id,
                    p.semaine,
                    p.heures,
                    p.created_at,
                    p.updated_at,
                    f.nom AS formateur_nom,
                    m.intitule AS module_intitule,
                    m.semestre
                FROM planning p
                INNER JOIN formateurs f ON f.id = p.formateur_id
                INNER JOIN modules m ON m.id = p.module_id
                WHERE 1 = 1';
        $params = [];

        if (!empty($filters['formateur_id'])) {
            $sql .= ' AND p.formateur_id = :formateur_id';
            $params['formateur_id'] = intval($filters['formateur_id']);
        }

        if (!empty($filters['module_id'])) {
            $sql .= ' AND p.module_id = :module_id';
            $params['module_id'] = intval($filters['module_id']);
        }

        if (!empty($filters['semaine'])) {
            $sql .= ' AND p.semaine = :semaine';
            $params['semaine'] = intval($filters['semaine']);
        }

        $sql .= ' ORDER BY p.semaine, f.nom, m.intitule';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row): array => $this->normalizeRow($row), $stmt->fetchAll());
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM planning WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? $this->normalizeRow($row) : null;
    }

    public function findByTrainerModuleWeek(int $formateurId, int $moduleId, int $semaine, ?int $ignoreId = null): ?array
    {
        $sql = 'SELECT * FROM planning WHERE formateur_id = :formateur_id AND module_id = :module_id AND semaine = :semaine';
        $params = [
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'semaine' => $semaine,
        ];

        if ($ignoreId !== null) {
            $sql .= ' AND id <> :ignore_id';
            $params['ignore_id'] = $ignoreId;
        }

        $sql .= ' LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();

        return $row ? $this->normalizeRow($row) : null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO planning (formateur_id, module_id, semaine, heures)
             VALUES (:formateur_id, :module_id, :semaine, :heures)'
        );
        $stmt->execute([
            'formateur_id' => $data['formateur_id'],
            'module_id' => $data['module_id'],
            'semaine' => $data['semaine'],
            'heures' => $data['heures'],
        ]);

        return intval($this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE planning
             SET formateur_id = :formateur_id,
                 module_id = :module_id,
                 semaine = :semaine,
                 heures = :heures,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'formateur_id' => $data['formateur_id'],
            'module_id' => $data['module_id'],
            'semaine' => $data['semaine'],
            'heures' => $data['heures'],
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM planning WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function getTrainerWeekHours(int $formateurId, int $semaine, ?int $excludePlanningId = null): float
    {
        $sql = 'SELECT COALESCE(SUM(heures), 0) FROM planning WHERE formateur_id = :formateur_id AND semaine = :semaine';
        $params = [
            'formateur_id' => $formateurId,
            'semaine' => $semaine,
        ];

        if ($excludePlanningId !== null) {
            $sql .= ' AND id <> :exclude_id';
            $params['exclude_id'] = $excludePlanningId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return round(floatval($stmt->fetchColumn()), 2);
    }

    public function getWeeklyStatsForTrainer(int $formateurId, ?int $semaine = null): array
    {
        if ($semaine !== null) {
            $stmt = $this->db->prepare(
                'SELECT
                    COALESCE(SUM(heures), 0) AS weekly_hours,
                    COUNT(*) AS entries
                 FROM planning
                 WHERE formateur_id = :formateur_id
                   AND semaine = :semaine'
            );
            $stmt->execute([
                'formateur_id' => $formateurId,
                'semaine' => $semaine,
            ]);

            $row = $stmt->fetch() ?: [];

            return [
                'weekly_hours' => round(floatval($row['weekly_hours'] ?? 0), 2),
                'entries' => intval($row['entries'] ?? 0),
            ];
        }

        $stmt = $this->db->prepare(
            'SELECT semaine, SUM(heures) AS weekly_hours
             FROM planning
             WHERE formateur_id = :formateur_id
             GROUP BY semaine
             ORDER BY semaine'
        );
        $stmt->execute(['formateur_id' => $formateurId]);

        return array_map(static function (array $row): array {
            return [
                'semaine' => intval($row['semaine'] ?? 0),
                'weekly_hours' => round(floatval($row['weekly_hours'] ?? 0), 2),
            ];
        }, $stmt->fetchAll());
    }

    private function validationAcademicYear(): int
    {
        return function_exists('currentAcademicYear') ? currentAcademicYear() : intval(date('Y'));
    }

    private function validationWeeks(): array
    {
        return range(self::VALIDATION_WEEK_START, self::VALIDATION_WEEK_END);
    }

    private function getValidationTrainerRows(array $filters, int $annee): array
    {
        $sql = 'SELECT
                    f.id AS formateur_id,
                    f.nom AS formateur_nom,
                    f.specialite,
                    COALESCE(f.telephone, "") AS telephone,
                    f.email,
                    f.max_heures,
                    COALESCE(f.weekly_hours, 0) AS weekly_target_hours,
                    COALESCE((
                        SELECT SUM(TIMESTAMPDIFF(MINUTE, s2.start_time, s2.end_time)) / 60
                        FROM planning_sessions s2
                        WHERE s2.formateur_id = f.id
                          AND s2.week_number BETWEEN :week_start_total AND :week_end_total
                    ), 0) AS annual_hours,
                    COALESCE((
                        SELECT GROUP_CONCAT(DISTINCT COALESCE(m2.code, CONCAT("M", LPAD(m2.id, 3, "0"))) ORDER BY m2.id SEPARATOR ",")
                        FROM affectations a2
                        INNER JOIN modules m2 ON m2.id = a2.module_id
                        WHERE a2.formateur_id = f.id
                          AND a2.annee = :annee_module_codes
                    ), "") AS module_codes,
                    COALESCE((
                        SELECT GROUP_CONCAT(DISTINCT m2.intitule ORDER BY m2.intitule SEPARATOR " | ")
                        FROM affectations a2
                        INNER JOIN modules m2 ON m2.id = a2.module_id
                        WHERE a2.formateur_id = f.id
                          AND a2.annee = :annee_module_titles
                    ), "") AS module_titles,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM affectations a2
                        WHERE a2.formateur_id = f.id
                          AND a2.annee = :annee_module_count
                    ), 0) AS module_count
                FROM formateurs f
                WHERE EXISTS (
                    SELECT 1
                    FROM affectations a
                    WHERE a.formateur_id = f.id
                      AND a.annee = :annee_filter
                )';
        $params = [
            'annee_module_codes' => $annee,
            'annee_module_titles' => $annee,
            'annee_module_count' => $annee,
            'annee_filter' => $annee,
            'week_start_total' => self::VALIDATION_WEEK_START,
            'week_end_total' => self::VALIDATION_WEEK_END,
        ];

        if (!empty($filters['q'])) {
            $sql .= ' AND (
                f.nom LIKE :q
                OR f.specialite LIKE :q
                OR f.email LIKE :q
                OR EXISTS (
                    SELECT 1
                    FROM affectations a3
                    INNER JOIN modules m3 ON m3.id = a3.module_id
                    WHERE a3.formateur_id = f.id
                      AND a3.annee = :annee_query
                      AND (
                        m3.intitule LIKE :q
                        OR COALESCE(m3.code, "") LIKE :q
                      )
                )
            )';
            $params['q'] = '%' . trim((string) $filters['q']) . '%';
            $params['annee_query'] = $annee;
        }

        $sql .= ' ORDER BY f.nom ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    private function getValidationWeeklyHours(array $formateurIds): array
    {
        if ($formateurIds === []) {
            return [];
        }

        [$placeholders, $params] = $this->buildInClause($formateurIds);
        $stmt = $this->db->prepare(
            sprintf(
                'SELECT
                    formateur_id,
                    week_number AS semaine,
                    COUNT(*) AS sessions_count,
                    COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) / 60 AS weekly_hours
                 FROM planning_sessions
                 WHERE formateur_id IN (%s)
                   AND week_number BETWEEN ? AND ?
                 GROUP BY formateur_id, week_number
                 ORDER BY formateur_id ASC, week_number ASC',
                $placeholders
            )
        );
        $stmt->execute(array_merge($params, [self::VALIDATION_WEEK_START, self::VALIDATION_WEEK_END]));

        return $stmt->fetchAll();
    }

    private function getValidationSubmissionMap(array $formateurIds, int $annee): array
    {
        if ($formateurIds === []) {
            return [];
        }

        [$placeholders, $params] = $this->buildInClause($formateurIds);
        $stmt = $this->db->prepare(
            sprintf(
                'SELECT *
                 FROM planning_submissions
                 WHERE academic_year = ?
                   AND formateur_id IN (%s)
                 ORDER BY id ASC',
                $placeholders
            )
        );
        $stmt->execute(array_merge([$annee], $params));

        $map = [];
        foreach ($stmt->fetchAll() as $row) {
            $map[intval($row['formateur_id'])][intval($row['semaine'])] = $row;
        }

        return $map;
    }

    private function syncValidationSubmissions(array $matrixRows, int $annee): void
    {
        if ($matrixRows === []) {
            return;
        }

        $formateurIds = array_map(static fn (array $row): int => intval($row['formateur_id']), $matrixRows);
        $existingMap = $this->getValidationSubmissionMap($formateurIds, $annee);
        $insert = $this->db->prepare(
            'INSERT INTO planning_submissions (formateur_id, semaine, academic_year, submitted_hours, status)
             VALUES (:formateur_id, :semaine, :academic_year, :submitted_hours, "pending")'
        );
        $update = $this->db->prepare(
            'UPDATE planning_submissions
             SET submitted_hours = :submitted_hours,
                 status = :status,
                 processed_at = :processed_at,
                 processed_by = :processed_by,
                 decision_note = :decision_note
             WHERE id = :id'
        );

        foreach ($matrixRows as $row) {
            foreach (($row['weeks'] ?? []) as $weekNumber => $hours) {
                $normalizedHours = round(floatval($hours ?? 0), 2);
                $existing = $existingMap[intval($row['formateur_id'])][intval($weekNumber)] ?? null;
                if ($existing === null) {
                    $insert->execute([
                        'formateur_id' => intval($row['formateur_id']),
                        'semaine' => intval($weekNumber),
                        'academic_year' => $annee,
                        'submitted_hours' => $normalizedHours,
                    ]);
                    continue;
                }

                $currentHours = round(floatval($existing['submitted_hours'] ?? 0), 2);
                $currentStatus = (string) ($existing['status'] ?? 'pending');
                $hoursChanged = abs($currentHours - $normalizedHours) > 0.01;

                if ($currentStatus === 'pending') {
                    $update->execute([
                        'id' => intval($existing['id']),
                        'submitted_hours' => $normalizedHours,
                        'status' => 'pending',
                        'processed_at' => null,
                        'processed_by' => null,
                        'decision_note' => null,
                    ]);
                    continue;
                }

                if ($hoursChanged) {
                    $insert->execute([
                        'formateur_id' => intval($row['formateur_id']),
                        'semaine' => intval($weekNumber),
                        'academic_year' => $annee,
                        'submitted_hours' => $normalizedHours,
                    ]);
                }
            }
        }
    }

    private function buildValidationDataset(array $filters = []): array
    {
        $annee = $this->validationAcademicYear();
        $weeks = $this->validationWeeks();
        $trainerRows = $this->getValidationTrainerRows($filters, $annee);

        if ($trainerRows === []) {
            return [
                'weeks' => $weeks,
                'rows' => [],
                'queue' => [],
            ];
        }

        $matrixByTrainer = [];
        foreach ($trainerRows as $row) {
            $weekMap = [];
            foreach ($weeks as $weekNumber) {
                $weekMap[$weekNumber] = 0.0;
            }

            $matrixByTrainer[intval($row['formateur_id'])] = [
                'id' => intval($row['formateur_id']),
                'formateur_id' => intval($row['formateur_id']),
                'formateur_nom' => $row['formateur_nom'],
                'specialite' => $row['specialite'],
                'telephone' => $row['telephone'],
                'email' => $row['email'],
                'max_heures' => intval($row['max_heures'] ?? 910),
                'annual_hours' => round(floatval($row['annual_hours'] ?? 0), 2),
                'module_count' => intval($row['module_count'] ?? 0),
                'module_codes' => ($row['module_codes'] ?? '') !== '' ? explode(',', $row['module_codes']) : [],
                'module_titles' => ($row['module_titles'] ?? '') !== '' ? explode(' | ', $row['module_titles']) : [],
                'weeks' => $weekMap,
                'session_counts' => $weekMap,
                'total_hours' => round(floatval($row['annual_hours'] ?? 0), 2),
                'annual_hours' => round(floatval($row['annual_hours'] ?? 0), 2),
                'weekly_target_hours' => round(floatval($row['weekly_target_hours'] ?? 0), 2),
                'overload_weeks' => [],
                'incomplete_weeks' => [],
                'incomplete_range' => '',
            ];
        }

        $weeklyRows = $this->getValidationWeeklyHours(array_keys($matrixByTrainer));
        foreach ($weeklyRows as $row) {
            $formateurId = intval($row['formateur_id'] ?? 0);
            $weekNumber = intval($row['semaine'] ?? 0);
            if (!isset($matrixByTrainer[$formateurId]['weeks'][$weekNumber])) {
                continue;
            }

            $hours = round(floatval($row['weekly_hours'] ?? 0), 2);
            $matrixByTrainer[$formateurId]['weeks'][$weekNumber] = $hours;
            $matrixByTrainer[$formateurId]['session_counts'][$weekNumber] = intval($row['sessions_count'] ?? 0);
            if ($hours > self::MAX_WEEKLY_VALIDATION_HOURS) {
                $matrixByTrainer[$formateurId]['overload_weeks'][] = $weekNumber;
            }
        }

        foreach ($matrixByTrainer as &$trainerRow) {
            $trainerRow['total_hours'] = round(array_sum($trainerRow['weeks']), 2);
            $trainerRow['annual_hours'] = $trainerRow['total_hours'];

            foreach ($weeks as $weekNumber) {
                $hours = round(floatval($trainerRow['weeks'][$weekNumber] ?? 0), 2);
                $sessionCount = intval($trainerRow['session_counts'][$weekNumber] ?? 0);
                if ($hours <= 0 || $sessionCount <= 0) {
                    $trainerRow['incomplete_weeks'][] = $weekNumber;
                }
            }

            $trainerRow['incomplete_range'] = formatWeekRangeLabel($trainerRow['incomplete_weeks']);
        }
        unset($trainerRow);

        $matrixRows = array_values($matrixByTrainer);
        $this->syncValidationSubmissions($matrixRows, $annee);
        $submissionMap = $this->getValidationSubmissionMap(array_keys($matrixByTrainer), $annee);

        $queue = [];
        foreach ($matrixRows as $row) {
            foreach ($weeks as $weekNumber) {
                $hours = round(floatval($row['weeks'][$weekNumber] ?? 0), 2);
                $submission = $submissionMap[intval($row['formateur_id'])][intval($weekNumber)] ?? null;
                if ($submission === null) {
                    continue;
                }

                $status = (string) ($submission['status'] ?? 'pending');
                $hasSnapshot = $status !== 'pending' && $this->hasSubmissionSnapshot($submission);
                if ($hasSnapshot) {
                    $snapshotEntries = $this->decodeSubmissionSnapshotEntries($submission['snapshot_entries'] ?? null);
                    $hours = round(floatval($submission['snapshot_total_hours'] ?? 0), 2);
                    $incomplete = $hours <= 0 || $snapshotEntries === [];
                    $overload = $hours > self::MAX_WEEKLY_VALIDATION_HOURS;
                } else {
                    $incomplete = in_array($weekNumber, $row['incomplete_weeks'], true);
                    $overload = $hours > self::MAX_WEEKLY_VALIDATION_HOURS;
                }
                $displayStatus = $status;
                $statusReason = null;

                if ($status === 'pending' && ($overload || $incomplete)) {
                    $displayStatus = 'revision';
                    $statusReason = $incomplete ? 'incomplete' : 'overload';
                }

                if (!empty($filters['status']) && $filters['status'] !== $displayStatus) {
                    continue;
                }

                $queue[] = $this->normalizeSubmissionRow([
                    'id' => intval($submission['id']),
                    'formateur_id' => intval($row['formateur_id']),
                    'formateur_nom' => $row['formateur_nom'],
                    'specialite' => $row['specialite'],
                    'telephone' => $row['telephone'],
                    'email' => $row['email'],
                    'max_heures' => $row['max_heures'],
                    'semaine' => $weekNumber,
                    'academic_year' => $annee,
                    'submitted_hours' => $hours,
                    'week_hours' => $hours,
                    'status' => $displayStatus,
                    'source_status' => $status,
                    'status_reason' => $statusReason,
                    'submitted_at' => $submission['submitted_at'] ?? null,
                    'processed_at' => $submission['processed_at'] ?? null,
                    'decision_note' => $submission['decision_note'] ?? null,
                    'annual_hours' => $row['annual_hours'],
                    'module_count' => $row['module_count'],
                    'module_codes' => implode(',', $row['module_codes']),
                    'module_titles' => implode(' | ', $row['module_titles']),
                    'overload' => $overload,
                    'incomplete' => $incomplete,
                    'overload_weeks' => $row['overload_weeks'],
                    'incomplete_range' => $row['incomplete_range'],
                    'weeks' => $row['weeks'],
                ]);
            }
        }

        usort($queue, static function (array $left, array $right): int {
            $priority = [
                'pending' => 0,
                'revision' => 1,
                'rejected' => 2,
                'approved' => 3,
            ];
            $leftPriority = $priority[$left['status']] ?? 4;
            $rightPriority = $priority[$right['status']] ?? 4;

            if ($leftPriority !== $rightPriority) {
                return $leftPriority <=> $rightPriority;
            }

            if (intval($left['semaine'] ?? 0) !== intval($right['semaine'] ?? 0)) {
                return intval($right['semaine'] ?? 0) <=> intval($left['semaine'] ?? 0);
            }

            return strcmp((string) ($left['formateur_nom'] ?? ''), (string) ($right['formateur_nom'] ?? ''));
        });

        return [
            'weeks' => $weeks,
            'rows' => $matrixRows,
            'queue' => $queue,
        ];
    }

    public function getValidationSummary(): array
    {
        $dataset = $this->buildValidationDataset();
        $pendingCount = 0;
        $overloadCount = 0;

        foreach ($dataset['queue'] as $row) {
            if (in_array((string) ($row['status'] ?? ''), ['pending', 'revision'], true)) {
                $pendingCount++;
            }
            if (!empty($row['overload'])) {
                $overloadCount++;
            }
        }

        $stmt = $this->db->query(
            'SELECT
                SUM(CASE WHEN status = "approved" AND YEARWEEK(processed_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) AS approved_this_week,
                SUM(CASE WHEN status = "rejected" AND YEARWEEK(processed_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) AS rejected_this_week
             FROM planning_submissions'
        );
        $row = $stmt->fetch() ?: [];

        return [
            'pending_count' => $pendingCount,
            'approved_this_week' => intval($row['approved_this_week'] ?? 0),
            'rejected_this_week' => intval($row['rejected_this_week'] ?? 0),
            'overload_count' => $overloadCount,
        ];
    }

    public function getValidationHistory(int $limit = 5): array
    {
        $this->buildValidationDataset();

        $stmt = $this->db->prepare(
            'SELECT
                s.id,
                f.nom AS formateur_nom,
                COALESCE(s.snapshot_total_hours, s.submitted_hours) AS submitted_hours,
                s.status,
                s.processed_at
             FROM planning_submissions s
             INNER JOIN formateurs f ON f.id = s.formateur_id
             WHERE s.status <> "pending"
             ORDER BY s.processed_at DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'id' => intval($row['id']),
                'formateur_nom' => $row['formateur_nom'],
                'submitted_hours' => round(floatval($row['submitted_hours']), 2),
                'status' => $row['status'],
                'processed_at' => $row['processed_at'],
            ];
        }, $stmt->fetchAll());
    }

    public function getValidationQueue(array $filters = []): array
    {
        $dataset = $this->buildValidationDataset($filters);

        return $dataset['queue'];
    }

    public function getValidationMatrix(array $filters = []): array
    {
        $dataset = $this->buildValidationDataset($filters);

        return [
            'weeks' => $dataset['weeks'],
            'rows' => $dataset['rows'],
        ];
    }

    public function findSubmission(int $id): ?array
    {
        $this->buildValidationDataset();

        $stmt = $this->db->prepare(
            'SELECT
                s.id,
                s.formateur_id,
                s.semaine,
                s.academic_year,
                s.submitted_hours,
                s.status,
                s.submitted_at,
                s.processed_at,
                s.decision_note,
                s.snapshot_entries,
                s.snapshot_total_hours,
                s.snapshot_captured_at,
                f.nom AS formateur_nom,
                f.specialite,
                COALESCE(f.telephone, "") AS telephone,
                f.email,
                COALESCE((
                    SELECT GROUP_CONCAT(DISTINCT COALESCE(m2.code, CONCAT("M", LPAD(m2.id, 3, "0"))) ORDER BY m2.id SEPARATOR ",")
                    FROM affectations a2
                    INNER JOIN modules m2 ON m2.id = a2.module_id
                    WHERE a2.formateur_id = s.formateur_id
                      AND a2.annee = s.academic_year
                ), "") AS module_codes,
                COALESCE((
                    SELECT GROUP_CONCAT(DISTINCT m2.intitule ORDER BY m2.intitule SEPARATOR " | ")
                    FROM affectations a2
                    INNER JOIN modules m2 ON m2.id = a2.module_id
                    WHERE a2.formateur_id = s.formateur_id
                      AND a2.annee = s.academic_year
                ), "") AS module_titles,
                COALESCE((
                    SELECT COUNT(*)
                    FROM affectations a2
                    WHERE a2.formateur_id = s.formateur_id
                      AND a2.annee = s.academic_year
                ), 0) AS module_count,
                COALESCE((
                    SELECT SUM(m2.volume_horaire)
                    FROM affectations a2
                    INNER JOIN modules m2 ON m2.id = a2.module_id
                    WHERE a2.formateur_id = s.formateur_id
                      AND a2.annee = s.academic_year
                ), 0) AS annual_hours
             FROM planning_submissions s
             INNER JOIN formateurs f ON f.id = s.formateur_id
             WHERE s.id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $storedStatus = (string) ($row['status'] ?? 'pending');
        if ($storedStatus !== 'pending' && $this->hasSubmissionSnapshot($row)) {
            $snapshotEntries = $this->decodeSubmissionSnapshotEntries($row['snapshot_entries'] ?? null);
            $weeklyHours = round(floatval($row['snapshot_total_hours'] ?? 0), 2);
            $row['submitted_hours'] = $weeklyHours;
            $row['week_hours'] = $weeklyHours;
            $row['overload'] = $weeklyHours > self::MAX_WEEKLY_VALIDATION_HOURS;
            $row['incomplete'] = $weeklyHours <= 0 || $snapshotEntries === [];
            $row['status_reason'] = null;
            $row['incomplete_range'] = !empty($row['incomplete'])
                ? formatWeekRangeLabel([intval($row['semaine'])])
                : '';

            return $this->normalizeSubmissionRow($row);
        }

        $weekHoursStmt = $this->db->prepare(
            'SELECT
                COUNT(*) AS sessions_count,
                COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) / 60 AS weekly_hours
             FROM planning_sessions
             WHERE formateur_id = :formateur_id
               AND week_number = :week_number'
        );
        $weekHoursStmt->execute([
            'formateur_id' => intval($row['formateur_id']),
            'week_number' => intval($row['semaine']),
        ]);
        $weekMetrics = $weekHoursStmt->fetch() ?: [];
        $weeklyHours = round(floatval($weekMetrics['weekly_hours'] ?? 0), 2);
        $incomplete = $weeklyHours <= 0 || intval($weekMetrics['sessions_count'] ?? 0) <= 0;
        $row['submitted_hours'] = $weeklyHours;
        $row['week_hours'] = $weeklyHours;
        $row['overload'] = $weeklyHours > self::MAX_WEEKLY_VALIDATION_HOURS;
        $row['incomplete'] = $incomplete;
        $row['status_reason'] = null;
        $row['incomplete_range'] = $incomplete ? formatWeekRangeLabel([intval($row['semaine'])]) : '';
        if (($row['status'] ?? 'pending') === 'pending' && ($incomplete || !empty($row['overload']))) {
            $row['status'] = 'revision';
            $row['status_reason'] = $incomplete ? 'incomplete' : 'overload';
        }

        return $this->normalizeSubmissionRow($row);
    }

    private function getLiveSubmissionPlanningEntries(int $formateurId, int $semaine): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                MIN(s.id) AS id,
                s.formateur_id,
                s.module_id,
                s.week_number AS semaine,
                ROUND(COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time)), 0) / 60, 2) AS heures,
                MIN(s.created_at) AS created_at,
                MAX(s.updated_at) AS updated_at,
                m.intitule AS module_intitule,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.filiere,
                m.semestre
             FROM planning_sessions s
             INNER JOIN modules m ON m.id = s.module_id
             WHERE s.formateur_id = :formateur_id
               AND s.week_number = :semaine
             GROUP BY s.formateur_id, s.module_id, s.week_number, m.intitule, m.code, m.filiere, m.semestre
             ORDER BY m.intitule'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'semaine' => $semaine,
        ]);

        return array_map(fn (array $row): array => $this->normalizeRow($row), $stmt->fetchAll());
    }

    public function getSubmissionPlanningEntries(int $formateurId, int $semaine): array
    {
        return $this->getLiveSubmissionPlanningEntries($formateurId, $semaine);
    }

    public function getSubmissionPlanningEntriesBySubmissionId(int $submissionId): array
    {
        $stmt = $this->db->prepare(
            'SELECT formateur_id, semaine, status, snapshot_entries, snapshot_total_hours, snapshot_captured_at
             FROM planning_submissions
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $submissionId]);
        $row = $stmt->fetch();

        if (!$row) {
            return [];
        }

        if ((string) ($row['status'] ?? 'pending') !== 'pending' && $this->hasSubmissionSnapshot($row)) {
            return $this->decodeSubmissionSnapshotEntries($row['snapshot_entries'] ?? null);
        }

        return $this->getLiveSubmissionPlanningEntries(intval($row['formateur_id']), intval($row['semaine']));
    }

    public function captureSubmissionSnapshotsByIds(array $ids): void
    {
        if ($ids === []) {
            return;
        }

        [$placeholders, $params] = $this->buildInClause($ids);
        $select = $this->db->prepare(
            sprintf(
                'SELECT id, formateur_id, semaine
                 FROM planning_submissions
                 WHERE id IN (%s)',
                $placeholders
            )
        );
        $select->execute($params);
        $rows = $select->fetchAll();

        if ($rows === []) {
            return;
        }

        $update = $this->db->prepare(
            'UPDATE planning_submissions
             SET snapshot_entries = :snapshot_entries,
                 snapshot_total_hours = :snapshot_total_hours,
                 snapshot_captured_at = NOW()
             WHERE id = :id'
        );

        foreach ($rows as $row) {
            $entries = $this->getLiveSubmissionPlanningEntries(
                intval($row['formateur_id']),
                intval($row['semaine'])
            );
            $totalHours = round(array_reduce($entries, static function (float $sum, array $entry): float {
                return $sum + round(floatval($entry['heures'] ?? 0), 2);
            }, 0.0), 2);
            $snapshotEntries = json_encode($entries, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            if ($snapshotEntries === false) {
                throw new RuntimeException('Impossible de serialiser le snapshot de validation.');
            }

            $update->execute([
                'id' => intval($row['id']),
                'snapshot_entries' => $snapshotEntries,
                'snapshot_total_hours' => $totalHours,
            ]);
        }
    }

    public function updateSubmissionStatusByIds(array $ids, string $status, int $processedBy, ?string $note): int
    {
        [$placeholders, $params] = $this->buildInClause($ids);
        $sql = sprintf(
            'UPDATE planning_submissions
             SET status = ?,
                 processed_at = NOW(),
                 processed_by = ?,
                 decision_note = ?
             WHERE id IN (%s)',
            $placeholders
        );

        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_merge([$status, $processedBy, $note], $params));

        return $stmt->rowCount();
    }

    public function logSubmissionActivities(array $ids, string $status): void
    {
        [$placeholders, $params] = $this->buildInClause($ids);
        $sql = sprintf(
            'SELECT
                s.id,
                s.formateur_id,
                (
                    SELECT a.module_id
                    FROM affectations a
                    WHERE a.formateur_id = s.formateur_id
                      AND a.annee = s.academic_year
                    ORDER BY a.id ASC
                    LIMIT 1
                ) AS module_id,
                f.nom AS formateur_nom
             FROM planning_submissions s
             INNER JOIN formateurs f ON f.id = s.formateur_id
             WHERE s.id IN (%s)',
            $placeholders
        );
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $labelMap = [
            'approved' => 'Affectation validee',
            'rejected' => 'Planning refuse',
            'revision' => 'Planning a reviser',
        ];
        $toneMap = [
            'approved' => 'success',
            'rejected' => 'danger',
            'revision' => 'warning',
        ];

        $insert = $this->db->prepare(
            'INSERT INTO recent_activities (formateur_id, module_id, action_label, action_tone, action_description)
             VALUES (:formateur_id, :module_id, :action_label, :action_tone, :action_description)'
        );

        foreach ($rows as $row) {
            $insert->execute([
                'formateur_id' => intval($row['formateur_id']),
                'module_id' => $row['module_id'] !== null ? intval($row['module_id']) : null,
                'action_label' => $labelMap[$status] ?? 'Mise a jour planning',
                'action_tone' => $toneMap[$status] ?? 'info',
                'action_description' => sprintf(
                    '%s: statut mis a jour en %s.',
                    $row['formateur_nom'],
                    $status === 'approved' ? 'validation' : ($status === 'rejected' ? 'refus' : 'revision')
                ),
            ]);
        }
    }

    private function normalizeSessionRow(array $row): array
    {
        $startTime = $row['start_time'] ?? '00:00:00';
        $endTime = $row['end_time'] ?? '00:00:00';
        $durationMinutes = max(
            0,
            intval((strtotime('1970-01-01 ' . $endTime) - strtotime('1970-01-01 ' . $startTime)) / 60)
        );

        return [
            'id' => intval($row['id'] ?? 0),
            'formateur_id' => intval($row['formateur_id'] ?? 0),
            'formateur_nom' => $row['formateur_nom'] ?? '',
            'module_id' => intval($row['module_id'] ?? 0),
            'module_nom' => $row['module_nom'] ?? '',
            'module_code' => $row['module_code'] ?? '',
            'groupe_id' => $row['groupe_id'] !== null ? intval($row['groupe_id']) : null,
            'groupe_code' => $row['groupe_code'] ?? '',
            'groupe_nom' => $row['groupe_nom'] ?? '',
            'salle_id' => $row['salle_id'] !== null ? intval($row['salle_id']) : null,
            'salle_code' => $row['salle_code'] ?? '',
            'salle_nom' => $row['salle_nom'] ?? '',
            'week_number' => intval($row['week_number'] ?? 0),
            'day_of_week' => intval($row['day_of_week'] ?? 0),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration_minutes' => $durationMinutes,
            'duration_hours' => round($durationMinutes / 60, 2),
            'status' => $row['status'] ?? 'scheduled',
            'task_title' => $row['task_title'] ?? '',
            'task_description' => $row['task_description'] ?? '',
            'session_date' => $row['session_date'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }

    public function listSessions(array $filters = []): array
    {
        $sql = 'SELECT
                    s.id,
                    s.formateur_id,
                    f.nom AS formateur_nom,
                    s.module_id,
                    m.intitule AS module_nom,
                    COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                    s.groupe_id,
                    g.code AS groupe_code,
                    g.nom AS groupe_nom,
                    s.salle_id,
                    r.code AS salle_code,
                    COALESCE(r.nom, r.code) AS salle_nom,
                    s.week_number,
                    s.day_of_week,
                    s.start_time,
                    s.end_time,
                    s.session_date,
                    s.status,
                    s.task_title,
                    s.task_description,
                    s.created_at,
                    s.updated_at
                FROM planning_sessions s
                INNER JOIN formateurs f ON f.id = s.formateur_id
                INNER JOIN modules m ON m.id = s.module_id
                LEFT JOIN groupes g ON g.id = s.groupe_id
                LEFT JOIN salles r ON r.id = s.salle_id
                WHERE 1 = 1';
        $params = [];

        if (!empty($filters['formateur_id'])) {
            $sql .= ' AND s.formateur_id = :formateur_id';
            $params['formateur_id'] = intval($filters['formateur_id']);
        }

        if (!empty($filters['week_number'])) {
            $sql .= ' AND s.week_number = :week_number';
            $params['week_number'] = intval($filters['week_number']);
        }

        $sql .= ' ORDER BY s.day_of_week, s.start_time, f.nom, m.intitule';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row): array => $this->normalizeSessionRow($row), $stmt->fetchAll());
    }

    public function findSession(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT
                s.id,
                s.formateur_id,
                f.nom AS formateur_nom,
                s.module_id,
                m.intitule AS module_nom,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                s.groupe_id,
                g.code AS groupe_code,
                g.nom AS groupe_nom,
                s.salle_id,
                r.code AS salle_code,
                COALESCE(r.nom, r.code) AS salle_nom,
                s.week_number,
                s.day_of_week,
                s.start_time,
                s.end_time,
                s.session_date,
                s.status,
                s.task_title,
                s.task_description,
                s.created_at,
                s.updated_at
             FROM planning_sessions s
             INNER JOIN formateurs f ON f.id = s.formateur_id
             INNER JOIN modules m ON m.id = s.module_id
             LEFT JOIN groupes g ON g.id = s.groupe_id
             LEFT JOIN salles r ON r.id = s.salle_id
             WHERE s.id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? $this->normalizeSessionRow($row) : null;
    }

    public function getSessionOptionsForTrainer(int $formateurId, int $annee): array
    {
        $moduleStmt = $this->db->prepare(
            'SELECT
                m.id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             WHERE a.formateur_id = :formateur_id
               AND a.annee = :annee
             ORDER BY m.intitule'
        );
        $moduleStmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);
        $modules = array_map(static function (array $row): array {
            return [
                'id' => intval($row['id']),
                'label' => trim(($row['code'] ?? '') . ' · ' . ($row['intitule'] ?? '')),
                'code' => $row['code'] ?? '',
                'intitule' => $row['intitule'] ?? '',
            ];
        }, $moduleStmt->fetchAll());

        $groupStmt = $this->db->prepare(
            'SELECT DISTINCT
                g.id,
                g.code,
                g.nom,
                mg.module_id
             FROM affectations a
             INNER JOIN module_groupes mg ON mg.module_id = a.module_id
             INNER JOIN groupes g ON g.id = mg.groupe_id
             WHERE a.formateur_id = :formateur_id
               AND a.annee = :annee
             ORDER BY g.code'
        );
        $groupStmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);
        $groups = array_map(static function (array $row): array {
            return [
                'id' => intval($row['id']),
                'module_id' => intval($row['module_id']),
                'label' => trim(($row['code'] ?? '') . ' · ' . ($row['nom'] ?? '')),
                'code' => $row['code'] ?? '',
                'nom' => $row['nom'] ?? '',
            ];
        }, $groupStmt->fetchAll());

        $rooms = $this->db->query(
            'SELECT id, code, COALESCE(nom, code) AS nom
             FROM salles
             ORDER BY code'
        )->fetchAll();

        return [
            'modules' => $modules,
            'groups' => array_values($groups),
            'rooms' => array_map(static function (array $row): array {
                return [
                    'id' => intval($row['id']),
                    'label' => trim(($row['code'] ?? '') . ' · ' . ($row['nom'] ?? '')),
                    'code' => $row['code'] ?? '',
                    'nom' => $row['nom'] ?? '',
                ];
            }, $rooms),
        ];
    }

    public function hasSessionOverlap(int $formateurId, int $weekNumber, int $dayOfWeek, string $startTime, string $endTime, ?int $ignoreId = null): bool
    {
        $sql = 'SELECT id
                FROM planning_sessions
                WHERE formateur_id = :formateur_id
                  AND week_number = :week_number
                  AND day_of_week = :day_of_week
                  AND NOT (end_time <= :start_time OR start_time >= :end_time)';
        $params = [
            'formateur_id' => $formateurId,
            'week_number' => $weekNumber,
            'day_of_week' => $dayOfWeek,
            'start_time' => $startTime,
            'end_time' => $endTime,
        ];

        if ($ignoreId !== null) {
            $sql .= ' AND id <> :ignore_id';
            $params['ignore_id'] = $ignoreId;
        }

        $sql .= ' LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetch();
    }

    public function getTrainerScheduledHours(int $formateurId, int $weekNumber, ?int $ignoreId = null): float
    {
        $sql = 'SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) / 60
                FROM planning_sessions
                WHERE formateur_id = :formateur_id
                  AND week_number = :week_number';
        $params = [
            'formateur_id' => $formateurId,
            'week_number' => $weekNumber,
        ];

        if ($ignoreId !== null) {
            $sql .= ' AND id <> :ignore_id';
            $params['ignore_id'] = $ignoreId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return round(floatval($stmt->fetchColumn() ?? 0), 2);
    }

    public function createSession(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO planning_sessions (
                formateur_id,
                module_id,
                groupe_id,
                salle_id,
                week_number,
                week_start_date,
                week_end_date,
                day_of_week,
                start_time,
                end_time,
                session_date,
                status,
                task_title,
                task_description
             ) VALUES (
                :formateur_id,
                :module_id,
                :groupe_id,
                :salle_id,
                :week_number,
                :week_start_date,
                :week_end_date,
                :day_of_week,
                :start_time,
                :end_time,
                :session_date,
                :status,
                :task_title,
                :task_description
             )'
        );
        $stmt->execute([
            'formateur_id' => $data['formateur_id'],
            'module_id' => $data['module_id'],
            'groupe_id' => $data['groupe_id'],
            'salle_id' => $data['salle_id'],
            'week_number' => $data['week_number'],
            'week_start_date' => $data['week_start_date'],
            'week_end_date' => $data['week_end_date'],
            'day_of_week' => $data['day_of_week'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'session_date' => $data['session_date'],
            'status' => $data['status'] ?? 'scheduled',
            'task_title' => $data['task_title'],
            'task_description' => $data['task_description'],
        ]);

        return intval($this->db->lastInsertId());
    }

    public function updateSession(int $id, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE planning_sessions
             SET formateur_id = :formateur_id,
                 module_id = :module_id,
                 groupe_id = :groupe_id,
                 salle_id = :salle_id,
                 week_number = :week_number,
                 week_start_date = :week_start_date,
                 week_end_date = :week_end_date,
                 day_of_week = :day_of_week,
                 start_time = :start_time,
                 end_time = :end_time,
                 session_date = :session_date,
                 task_title = :task_title,
                 task_description = :task_description,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'formateur_id' => $data['formateur_id'],
            'module_id' => $data['module_id'],
            'groupe_id' => $data['groupe_id'],
            'salle_id' => $data['salle_id'],
            'week_number' => $data['week_number'],
            'week_start_date' => $data['week_start_date'],
            'week_end_date' => $data['week_end_date'],
            'day_of_week' => $data['day_of_week'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'session_date' => $data['session_date'],
            'task_title' => $data['task_title'],
            'task_description' => $data['task_description'],
        ]);
    }

    public function updateSessionStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare(
            'UPDATE planning_sessions
             SET status = :status,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'status' => $status,
        ]);
    }

    public function deleteSession(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM planning_sessions WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function syncPlanningHoursFromSessions(int $formateurId, int $moduleId, int $weekNumber): void
    {
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) / 60
             FROM planning_sessions
             WHERE formateur_id = :formateur_id
               AND module_id = :module_id
               AND week_number = :week_number'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'week_number' => $weekNumber,
        ]);
        $hours = round(floatval($stmt->fetchColumn() ?? 0), 2);
        $existing = $this->findByTrainerModuleWeek($formateurId, $moduleId, $weekNumber);

        if ($hours <= 0) {
            if ($existing) {
                $this->delete(intval($existing['id']));
            }
            return;
        }

        if ($existing) {
            $update = $this->db->prepare(
                'UPDATE planning
                 SET heures = :heures,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $update->execute([
                'id' => intval($existing['id']),
                'heures' => $hours,
            ]);
            return;
        }

        $insert = $this->db->prepare(
            'INSERT INTO planning (formateur_id, module_id, semaine, heures)
             VALUES (:formateur_id, :module_id, :week_number, :heures)'
        );
        $insert->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'week_number' => $weekNumber,
            'heures' => $hours,
        ]);
    }
}
