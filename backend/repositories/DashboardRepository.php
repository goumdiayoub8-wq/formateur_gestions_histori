<?php

class DashboardRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getOverview(): array
    {
        $stmt = $this->db->query(
            'SELECT
                (SELECT COUNT(*) FROM formateurs) AS total_formateurs,
                (SELECT COUNT(*) FROM modules) AS total_modules,
                (SELECT COUNT(*) FROM affectations) AS total_affectations,
                (SELECT COUNT(*) FROM planning) AS total_planning_rows,
                (SELECT COALESCE(SUM(volume_horaire), 0) FROM modules) AS total_module_hours'
        );

        return $stmt->fetch() ?: [];
    }

    public function getTrainerRows(): array
    {
        $stmt = $this->db->query(
            'SELECT
                f.id,
                f.nom,
                f.email,
                f.specialite,
                f.max_heures,
                COALESCE(SUM(m.volume_horaire), 0) AS annual_hours,
                COALESCE(SUM(CASE WHEN m.semestre = "S1" THEN m.volume_horaire ELSE 0 END), 0) AS s1_hours,
                COALESCE(SUM(CASE WHEN m.semestre = "S2" THEN m.volume_horaire ELSE 0 END), 0) AS s2_hours,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.percentage, 2) END AS questionnaire_percentage
             FROM formateurs f
             LEFT JOIN affectations a ON a.formateur_id = f.id
             LEFT JOIN modules m ON m.id = a.module_id
             LEFT JOIN evaluation_scores s ON s.formateur_id = f.id
             GROUP BY f.id, f.nom, f.email, f.specialite, f.max_heures, s.id, s.percentage
             ORDER BY f.nom'
        );

        return $stmt->fetchAll();
    }

    public function getWeeklyOverloads(): array
    {
        $stmt = $this->db->query(
            'SELECT
                p.formateur_id,
                f.nom,
                p.semaine,
                SUM(p.heures) AS weekly_hours
             FROM planning p
             INNER JOIN formateurs f ON f.id = p.formateur_id
             GROUP BY p.formateur_id, f.nom, p.semaine
             HAVING SUM(p.heures) > 26
             ORDER BY weekly_hours DESC, p.semaine ASC'
        );

        return $stmt->fetchAll();
    }

    public function getDirectorKpis(): array
    {
        $stmt = $this->db->query(
            'SELECT
                (SELECT COUNT(*) FROM planning_submissions WHERE status = "pending") AS pending_validations,
                (SELECT COUNT(*) FROM planning_submissions) AS total_submissions,
                (SELECT COUNT(*) FROM planning_submissions WHERE status = "approved") AS approved_validations,
                (SELECT COUNT(*) FROM planning_submissions WHERE status = "approved" AND YEARWEEK(processed_at, 1) = YEARWEEK(CURDATE(), 1)) AS approved_this_week,
                (SELECT COUNT(*) FROM modules m
                    WHERE COALESCE((SELECT SUM(p.heures) FROM planning p WHERE p.module_id = m.id), 0) > 0
                      AND COALESCE((SELECT SUM(p.heures) FROM planning p WHERE p.module_id = m.id), 0) < m.volume_horaire) AS modules_in_progress,
                (SELECT COUNT(*) FROM groupes WHERE actif = 1) AS active_groups'
        );

        return $stmt->fetch() ?: [];
    }

    public function getValidationStatusBreakdown(): array
    {
        $stmt = $this->db->query(
            'SELECT
                SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) AS validated,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status IN ("rejected", "revision") THEN 1 ELSE 0 END) AS revision
             FROM planning_submissions'
        );

        return $stmt->fetch() ?: [];
    }

    public function getFiliereProgress(): array
    {
        $stmt = $this->db->query(
            'SELECT
                m.filiere,
                ROUND(AVG(
                    LEAST(
                        100,
                        CASE
                            WHEN m.volume_horaire = 0 THEN 0
                            ELSE (COALESCE(pl.hours_done, 0) / m.volume_horaire) * 100
                        END
                    )
                ), 0) AS validated_percent
             FROM modules m
             LEFT JOIN (
                SELECT module_id, SUM(heures) AS hours_done
                FROM planning
                GROUP BY module_id
             ) pl ON pl.module_id = m.id
             GROUP BY m.filiere
             ORDER BY validated_percent DESC, m.filiere ASC'
        );

        return array_map(static function (array $row): array {
            $validated = intval($row['validated_percent'] ?? 0);

            return [
                'filiere' => $row['filiere'],
                'validated_percent' => $validated,
                'pending_percent' => max(0, 100 - $validated),
            ];
        }, $stmt->fetchAll());
    }

    public function getRecentActivities(int $limit = 6): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                ra.id,
                ra.action_label,
                ra.action_tone,
                ra.action_description,
                ra.created_at,
                f.nom AS formateur_nom,
                m.intitule AS module_intitule
             FROM recent_activities ra
             LEFT JOIN formateurs f ON f.id = ra.formateur_id
             LEFT JOIN modules m ON m.id = ra.module_id
             ORDER BY ra.created_at DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getTrainerKpis(int $formateurId, int $week, int $annee): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                f.id,
                f.nom,
                f.email,
                COALESCE(f.telephone, "") AS telephone,
                f.specialite,
                f.max_heures,
                COALESCE((
                    SELECT SUM(p.heures)
                    FROM planning p
                    WHERE p.formateur_id = f.id
                ), 0) AS annual_completed_hours,
                COALESCE((
                    SELECT SUM(p.heures)
                    FROM planning p
                    WHERE p.formateur_id = f.id
                      AND p.semaine = :week
                ), 0) AS weekly_hours,
                COALESCE((
                    SELECT COUNT(*)
                    FROM affectations a
                    WHERE a.formateur_id = f.id
                      AND a.annee = :annee_assignments
                ), 0) AS assigned_modules,
                COALESCE((
                    SELECT COUNT(DISTINCT mg.groupe_id)
                    FROM affectations a2
                    INNER JOIN module_groupes mg ON mg.module_id = a2.module_id
                    WHERE a2.formateur_id = f.id
                      AND a2.annee = :annee_groups
                ), 0) AS groups_count,
                COALESCE((
                    SELECT COUNT(*)
                    FROM planning_change_requests r
                    WHERE r.formateur_id = f.id
                      AND r.academic_year = :annee_requests
                      AND r.status = "pending"
                ), 0) AS pending_requests
             FROM formateurs f
             WHERE f.id = :formateur_id
             LIMIT 1'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'week' => $week,
            'annee_assignments' => $annee,
            'annee_groups' => $annee,
            'annee_requests' => $annee,
        ]);

        return $stmt->fetch() ?: [];
    }

    public function getTrainerAssignedModules(int $formateurId, int $annee, int $week): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                m.id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule,
                m.filiere,
                m.semestre,
                m.volume_horaire,
                m.has_efm,
                COALESCE(SUM(p.heures), 0) AS completed_hours,
                COALESCE(SUM(CASE WHEN p.semaine = :week THEN p.heures ELSE 0 END), 0) AS weekly_hours,
                COALESCE(GROUP_CONCAT(DISTINCT g.code ORDER BY g.code SEPARATOR " • "), "") AS groupes,
                COALESCE(GROUP_CONCAT(DISTINCT CONCAT(g.code, "::", COALESCE(g.effectif, 20)) ORDER BY g.code SEPARATOR "|"), "") AS groupes_payload
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             LEFT JOIN planning p ON p.module_id = m.id AND p.formateur_id = a.formateur_id
             LEFT JOIN module_groupes mg ON mg.module_id = m.id
             LEFT JOIN groupes g ON g.id = mg.groupe_id
             WHERE a.formateur_id = :formateur_id
               AND a.annee = :annee
             GROUP BY
                m.id,
                m.code,
                m.intitule,
                m.filiere,
                m.semestre,
                m.volume_horaire,
                m.has_efm
             ORDER BY
                CASE m.semestre WHEN "S1" THEN 1 ELSE 2 END,
                m.intitule ASC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
            'week' => $week,
        ]);

        return array_map(static function (array $row): array {
            $completedHours = round(floatval($row['completed_hours'] ?? 0), 2);
            $totalHours = intval($row['volume_horaire'] ?? 0);
            $progressPercent = $totalHours > 0
                ? min(100, intval(round(($completedHours / $totalHours) * 100)))
                : 0;

            $groups = [];
            if (!empty($row['groupes_payload'])) {
                foreach (explode('|', $row['groupes_payload']) as $chunk) {
                    [$code, $effectif] = array_pad(explode('::', $chunk, 2), 2, null);
                    if (!$code) {
                        continue;
                    }

                    $groups[] = [
                        'code' => $code,
                        'student_count' => intval($effectif ?: 20),
                    ];
                }
            }

            return [
                'id' => intval($row['id']),
                'code' => $row['code'],
                'intitule' => $row['intitule'],
                'filiere' => $row['filiere'],
                'semestre' => $row['semestre'],
                'volume_horaire' => $totalHours,
                'has_efm' => boolval($row['has_efm']),
                'completed_hours' => $completedHours,
                'weekly_hours' => round(floatval($row['weekly_hours'] ?? 0), 2),
                'progress_percent' => $progressPercent,
                'group_codes' => $row['groupes'] !== '' ? explode(' • ', $row['groupes']) : [],
                'groups' => $groups,
            ];
        }, $stmt->fetchAll());
    }

    public function getTrainerGroups(int $formateurId, int $annee): array
    {
        $stmt = $this->db->prepare(
            'SELECT DISTINCT
                g.id,
                g.code,
                g.nom,
                g.filiere,
                COALESCE(g.effectif, 20) AS effectif
             FROM affectations a
             INNER JOIN module_groupes mg ON mg.module_id = a.module_id
             INNER JOIN groupes g ON g.id = mg.groupe_id
             WHERE a.formateur_id = :formateur_id
               AND a.annee = :annee
             ORDER BY g.code ASC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);

        return array_map(static function (array $row): array {
            return [
                'id' => intval($row['id']),
                'code' => $row['code'],
                'nom' => $row['nom'],
                'filiere' => $row['filiere'],
                'student_count' => intval($row['effectif'] ?? 20),
            ];
        }, $stmt->fetchAll());
    }

    public function getTrainerQuestionnaireScore(int $formateurId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT
                id,
                formateur_id,
                total_score,
                max_score,
                percentage,
                created_at
             FROM evaluation_scores
             WHERE formateur_id = :formateur_id
             LIMIT 1'
        );
        $stmt->execute(['formateur_id' => $formateurId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function getTrainerChangeRequestSummary(int $formateurId, int $annee): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                SUM(
                    CASE
                        WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN 1
                        ELSE 0
                    END
                ) AS total_this_month,
                SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) AS approved_count,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) AS pending_count
             FROM planning_change_requests
             WHERE formateur_id = :formateur_id
               AND academic_year = :annee'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);
        $row = $stmt->fetch() ?: [];

        return [
            'total_this_month' => intval($row['total_this_month'] ?? 0),
            'approved_count' => intval($row['approved_count'] ?? 0),
            'pending_count' => intval($row['pending_count'] ?? 0),
        ];
    }

    public function getTrainerChangeRequests(int $formateurId, int $annee): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                r.id,
                r.groupe_code,
                r.semaine,
                r.request_week,
                r.reason,
                r.status,
                r.created_at,
                r.processed_at,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.intitule AS module_intitule
             FROM planning_change_requests r
             INNER JOIN modules m ON m.id = r.module_id
             WHERE r.formateur_id = :formateur_id
               AND r.academic_year = :annee
             ORDER BY r.created_at DESC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);

        return array_map(static function (array $row): array {
            return [
                'id' => intval($row['id']),
                'module_code' => $row['module_code'],
                'module_intitule' => $row['module_intitule'],
                'groupe_code' => $row['groupe_code'],
                'semaine' => $row['semaine'],
                'request_week' => $row['request_week'] !== null ? intval($row['request_week']) : null,
                'reason' => $row['reason'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'processed_at' => $row['processed_at'],
            ];
        }, $stmt->fetchAll());
    }

    public function createTrainerChangeRequest(array $payload): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO planning_change_requests (
                formateur_id,
                module_id,
                groupe_code,
                semaine,
                request_week,
                academic_year,
                reason,
                status
             ) VALUES (
                :formateur_id,
                :module_id,
                :groupe_code,
                :semaine,
                :request_week,
                :academic_year,
                :reason,
                "pending"
             )'
        );
        $stmt->execute([
            'formateur_id' => $payload['formateur_id'],
            'module_id' => $payload['module_id'],
            'groupe_code' => $payload['groupe_code'],
            'semaine' => $payload['semaine'],
            'request_week' => $payload['request_week'],
            'academic_year' => $payload['academic_year'],
            'reason' => $payload['reason'],
        ]);

        $id = intval($this->db->lastInsertId());
        $rows = $this->getTrainerChangeRequests(intval($payload['formateur_id']), intval($payload['academic_year']));

        foreach ($rows as $row) {
            if ($row['id'] === $id) {
                return $row;
            }
        }

        return [];
    }

    public function getChefNotifications(): array
    {
        $stmt = $this->db->query(
            'SELECT
                r.id,
                r.formateur_id,
                r.module_id,
                r.groupe_code,
                r.semaine,
                r.request_week,
                r.reason,
                r.status,
                r.created_at,
                r.processed_at,
                f.nom AS trainer_name,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.intitule AS module_title
             FROM planning_change_requests r
             INNER JOIN formateurs f ON f.id = r.formateur_id
             INNER JOIN modules m ON m.id = r.module_id
             ORDER BY
                CASE r.status
                    WHEN "pending" THEN 0
                    WHEN "rejected" THEN 1
                    ELSE 2
                END,
                COALESCE(r.processed_at, r.created_at) DESC'
        );

        return array_map(static function (array $row): array {
            $reason = (string) ($row['reason'] ?? '');
            $isAccept = stripos($reason, 'Confirmation du creneau') === 0;
            $isReject = stripos($reason, 'Refus du creneau') === 0;
            $status = (string) ($row['status'] ?? 'pending');

            return [
                'id' => 'planning-change-' . intval($row['id']),
                'title' => $status === 'pending'
                    ? ($isAccept ? 'Acceptation de creneau en attente' : ($isReject ? 'Refus de creneau en attente' : 'Action planning en attente'))
                    : ($status === 'approved' ? 'Action planning approuvee' : 'Action planning refusee'),
                'message' => sprintf('%s · %s · %s', $row['trainer_name'], $row['module_code'], $row['semaine']),
                'details' => $reason,
                'severity' => $status === 'rejected' ? 'danger' : ($status === 'approved' ? 'info' : 'warning'),
                'alert_type' => 'planning_change',
                'notification_type' => 'planning_change',
                'created_at' => $row['processed_at'] ?: $row['created_at'],
                'target_path' => '/chef/notifications',
                'metadata' => [
                    'entry_id' => intval($row['id']),
                    'formateur_id' => intval($row['formateur_id']),
                    'module_id' => intval($row['module_id']),
                    'trainer_name' => $row['trainer_name'],
                    'module_code' => $row['module_code'],
                    'module_title' => $row['module_title'],
                    'week_number' => $row['request_week'] !== null ? intval($row['request_week']) : null,
                    'status' => $status === 'pending' ? 'pending_change' : $status,
                    'decision' => $isAccept ? 'accept' : ($isReject ? 'reject' : 'change'),
                ],
            ];
        }, $stmt->fetchAll());
    }

    public function reviewTrainerChangeRequest(int $requestId, string $status, ?string $note = null): ?array
    {
        $update = $this->db->prepare(
            'UPDATE planning_change_requests
             SET status = :status,
                 updated_at = CURRENT_TIMESTAMP,
                 processed_at = NOW()
             WHERE id = :id'
        );
        $update->execute([
            'id' => $requestId,
            'status' => $status,
        ]);

        $stmt = $this->db->prepare(
            'SELECT
                r.id,
                r.formateur_id,
                r.module_id,
                r.semaine,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code
             FROM planning_change_requests r
             INNER JOIN modules m ON m.id = r.module_id
             WHERE r.id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $requestId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $activityInsert = $this->db->prepare(
            'INSERT INTO recent_activities (formateur_id, module_id, action_label, action_tone, action_description)
             VALUES (:formateur_id, :module_id, :action_label, :action_tone, :action_description)'
        );
        $activityInsert->execute([
            'formateur_id' => intval($row['formateur_id']),
            'module_id' => intval($row['module_id']),
            'action_label' => $status === 'approved' ? 'Demande planning approuvee' : 'Demande planning refusee',
            'action_tone' => $status === 'approved' ? 'success' : 'danger',
            'action_description' => $note && trim($note) !== ''
                ? trim($note)
                : sprintf(
                    'La demande concernant %s pour %s a ete %s.',
                    $row['module_code'],
                    $row['semaine'],
                    $status === 'approved' ? 'approuvee' : 'refusee'
                ),
        ]);

        return [
            'id' => intval($row['id']),
            'status' => $status,
        ];
    }

    public function getTrainerTimelineEvents(int $formateurId, int $annee): array
    {
        $events = [];

        $validationStmt = $this->db->prepare(
            'SELECT
                id,
                semaine,
                submitted_hours,
                status,
                submitted_at,
                processed_at,
                decision_note
             FROM planning_submissions
             WHERE formateur_id = :formateur_id
               AND academic_year = :annee
             ORDER BY COALESCE(processed_at, submitted_at) DESC
             LIMIT 8'
        );
        $validationStmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);

        foreach ($validationStmt->fetchAll() as $row) {
            $status = $row['status'];
            $events[] = [
                'id' => 'submission-' . intval($row['id']),
                'type' => 'validation',
                'tone' => $status === 'approved' ? 'success' : ($status === 'rejected' ? 'danger' : 'info'),
                'title' => $status === 'approved'
                    ? sprintf('Planning valide : votre planning pour la semaine S%s a ete valide', intval($row['semaine']))
                    : sprintf('Planning %s : semaine S%s', $status === 'rejected' ? 'refuse' : 'envoye', intval($row['semaine'])),
                'message' => $row['decision_note'] ?: sprintf('Volume soumis : %sh', round(floatval($row['submitted_hours']), 2)),
                'date' => $row['processed_at'] ?: $row['submitted_at'],
                'target_path' => '/formateur/planning',
            ];
        }

        $requestStmt = $this->db->prepare(
            'SELECT
                r.id,
                r.status,
                r.created_at,
                r.processed_at,
                r.groupe_code,
                r.semaine,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.intitule
             FROM planning_change_requests r
             INNER JOIN modules m ON m.id = r.module_id
             WHERE r.formateur_id = :formateur_id
               AND r.academic_year = :annee
             ORDER BY COALESCE(r.processed_at, r.created_at) DESC
             LIMIT 8'
        );
        $requestStmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ]);

        foreach ($requestStmt->fetchAll() as $row) {
            $tone = $row['status'] === 'approved' ? 'success' : ($row['status'] === 'rejected' ? 'danger' : 'warning');
            $events[] = [
                'id' => 'request-' . intval($row['id']),
                'type' => 'request',
                'tone' => $tone,
                'title' => sprintf(
                    'Demande %s pour %s',
                    $row['status'] === 'approved' ? 'approuvee' : ($row['status'] === 'rejected' ? 'refusee' : 'en attente'),
                    $row['module_code']
                ),
                'message' => sprintf('%s · %s', $row['intitule'], $row['semaine']),
                'date' => $row['processed_at'] ?: $row['created_at'],
                'target_path' => '/formateur/demande',
            ];
        }

        $activityStmt = $this->db->prepare(
            'SELECT
                ra.id,
                ra.action_label,
                ra.action_tone,
                ra.action_description,
                ra.created_at,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code
             FROM recent_activities ra
             LEFT JOIN modules m ON m.id = ra.module_id
             WHERE ra.formateur_id = :formateur_id OR ra.formateur_id IS NULL
             ORDER BY ra.created_at DESC
             LIMIT 8'
        );
        $activityStmt->execute(['formateur_id' => $formateurId]);

        foreach ($activityStmt->fetchAll() as $row) {
            $events[] = [
                'id' => 'activity-' . intval($row['id']),
                'type' => 'activity',
                'tone' => $row['action_tone'] === 'warning' ? 'warning' : ($row['action_tone'] === 'danger' ? 'danger' : ($row['action_tone'] === 'success' ? 'success' : 'info')),
                'title' => $row['action_label'],
                'message' => $row['action_description'],
                'date' => $row['created_at'],
                'target_path' => '/formateur/notifications',
            ];
        }

        usort($events, static function (array $left, array $right): int {
            return strcmp((string) ($right['date'] ?? ''), (string) ($left['date'] ?? ''));
        });

        return array_slice($events, 0, 12);
    }
}
