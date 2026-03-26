<?php

class PlanningRepository
{
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
            'semaine' => intval($row['semaine'] ?? 0),
            'academic_year' => intval($row['academic_year'] ?? 0),
            'submitted_hours' => round(floatval($row['submitted_hours'] ?? 0), 2),
            'status' => $row['status'] ?? 'pending',
            'submitted_at' => $row['submitted_at'] ?? null,
            'processed_at' => $row['processed_at'] ?? null,
            'decision_note' => $row['decision_note'] ?? null,
            'annual_hours' => round(floatval($row['annual_hours'] ?? 0), 2),
            'module_count' => intval($row['module_count'] ?? 0),
            'module_codes' => ($row['module_codes'] ?? '') !== '' ? explode(',', $row['module_codes']) : [],
            'module_titles' => ($row['module_titles'] ?? '') !== '' ? explode(' | ', $row['module_titles']) : [],
        ];
    }

    private function buildInClause(array $values): array
    {
        $placeholders = implode(', ', array_fill(0, count($values), '?'));

        return [$placeholders, array_values($values)];
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

    public function getValidationSummary(): array
    {
        $stmt = $this->db->query(
            'SELECT
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN status = "approved" AND YEARWEEK(processed_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) AS approved_this_week,
                SUM(CASE WHEN status = "rejected" AND YEARWEEK(processed_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) AS rejected_this_week
             FROM planning_submissions'
        );
        $row = $stmt->fetch() ?: [];

        return [
            'pending_count' => intval($row['pending_count'] ?? 0),
            'approved_this_week' => intval($row['approved_this_week'] ?? 0),
            'rejected_this_week' => intval($row['rejected_this_week'] ?? 0),
        ];
    }

    public function getValidationHistory(int $limit = 5): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                s.id,
                f.nom AS formateur_nom,
                s.submitted_hours,
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
        $sql = 'SELECT
                    s.id,
                    s.formateur_id,
                    s.semaine,
                    s.academic_year,
                    s.submitted_hours,
                    s.status,
                    s.submitted_at,
                    s.processed_at,
                    s.decision_note,
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
                WHERE 1 = 1';
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= ' AND s.status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['q'])) {
            $sql .= ' AND (
                f.nom LIKE :q
                OR f.specialite LIKE :q
                OR f.email LIKE :q
                OR EXISTS (
                    SELECT 1
                    FROM affectations a3
                    INNER JOIN modules m3 ON m3.id = a3.module_id
                    WHERE a3.formateur_id = s.formateur_id
                      AND a3.annee = s.academic_year
                      AND (
                        m3.intitule LIKE :q
                        OR COALESCE(m3.code, "") LIKE :q
                      )
                )
            )';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' ORDER BY
                    CASE s.status
                        WHEN "pending" THEN 0
                        WHEN "rejected" THEN 1
                        WHEN "revision" THEN 2
                        ELSE 3
                    END,
                    s.submitted_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row): array => $this->normalizeSubmissionRow($row), $stmt->fetchAll());
    }

    public function findSubmission(int $id): ?array
    {
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

        return $row ? $this->normalizeSubmissionRow($row) : null;
    }

    public function getSubmissionPlanningEntries(int $formateurId, int $semaine): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                p.id,
                p.formateur_id,
                p.module_id,
                p.semaine,
                p.heures,
                p.created_at,
                p.updated_at,
                m.intitule AS module_intitule,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.filiere,
                m.semestre
             FROM planning p
             INNER JOIN modules m ON m.id = p.module_id
             WHERE p.formateur_id = :formateur_id
               AND p.semaine = :semaine
             ORDER BY m.intitule'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'semaine' => $semaine,
        ]);

        return array_map(fn (array $row): array => $this->normalizeRow($row), $stmt->fetchAll());
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
