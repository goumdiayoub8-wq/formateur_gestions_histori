<?php

require_once __DIR__ . '/../core/helpers.php';

class DashboardRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function buildInClause(array $values): array
    {
        $placeholders = implode(', ', array_fill(0, count($values), '?'));

        return [$placeholders, array_values($values)];
    }

    public function getOverview(): array
    {
        $stmt = $this->db->query(
            'SELECT
                (SELECT COUNT(*) FROM formateurs) AS total_formateurs,
                (SELECT COUNT(*) FROM modules) AS total_modules,
                (SELECT COUNT(*) FROM affectations) AS total_affectations,
                (SELECT COUNT(*) FROM planning_sessions) AS total_planning_rows,
                (SELECT COALESCE(SUM(volume_horaire), 0) FROM modules) AS total_module_hours'
        );

        return $stmt->fetch() ?: [];
    }

    public function getTrainerRows(): array
    {
        $plannedHoursExpression = planningSessionHoursExpression('planned_sessions');
        $completedHoursExpression = completedPlanningSessionHoursExpression('completed_sessions');
        $questionnairePercentageExpression = resolvedTrainerQuestionnairePercentageExpression('f.id');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('planned_sessions', 'planned_submissions', currentAcademicYear());
        $currentWeekHoursExpression = planningSessionHoursExpression('current_week_sessions');
        $currentWeekValidatedCondition = validatedPlanningSessionExistsCondition('current_week_sessions', 'current_week_submissions', currentAcademicYear());
        $maxWeekHoursExpression = planningSessionHoursExpression('weekly_sessions');
        $maxWeekValidatedCondition = validatedPlanningSessionExistsCondition('weekly_sessions', 'weekly_submissions', currentAcademicYear());
        $plannedS1HoursExpression = planningSessionHoursExpression('planned_s1_sessions');
        $plannedS1ValidatedCondition = validatedPlanningSessionExistsCondition('planned_s1_sessions', 'planned_s1_submissions', currentAcademicYear());
        $plannedS2HoursExpression = planningSessionHoursExpression('planned_s2_sessions');
        $plannedS2ValidatedCondition = validatedPlanningSessionExistsCondition('planned_s2_sessions', 'planned_s2_submissions', currentAcademicYear());
        $completedSessionsCondition = completedPlanningSessionCondition('completed_sessions');
        $currentWeek = currentAcademicWeek();
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
                COALESCE((
                    SELECT ' . $plannedHoursExpression . '
                    FROM planning_sessions planned_sessions
                    WHERE planned_sessions.formateur_id = f.id
                      AND ' . $validatedPlanningCondition . '
                ), 0) AS planned_hours,
                COALESCE((
                    SELECT ' . $completedHoursExpression . '
                    FROM planning_sessions completed_sessions
                    WHERE completed_sessions.formateur_id = f.id
                      AND ' . $completedSessionsCondition . '
                ), 0) AS completed_hours,
                COALESCE((
                    SELECT ' . $plannedS1HoursExpression . '
                    FROM planning_sessions planned_s1_sessions
                    INNER JOIN modules planned_s1_modules ON planned_s1_modules.id = planned_s1_sessions.module_id
                    WHERE planned_s1_sessions.formateur_id = f.id
                      AND planned_s1_modules.semestre = "S1"
                      AND ' . $plannedS1ValidatedCondition . '
                ), 0) AS planned_s1_hours,
                COALESCE((
                    SELECT ' . $plannedS2HoursExpression . '
                    FROM planning_sessions planned_s2_sessions
                    INNER JOIN modules planned_s2_modules ON planned_s2_modules.id = planned_s2_sessions.module_id
                    WHERE planned_s2_sessions.formateur_id = f.id
                      AND planned_s2_modules.semestre = "S2"
                      AND ' . $plannedS2ValidatedCondition . '
                ), 0) AS planned_s2_hours,
                COALESCE((
                    SELECT ' . $currentWeekHoursExpression . '
                    FROM planning_sessions current_week_sessions
                    WHERE current_week_sessions.formateur_id = f.id
                      AND current_week_sessions.week_number = ' . $currentWeek . '
                      AND ' . $currentWeekValidatedCondition . '
                ), 0) AS current_week_hours,
                COALESCE((
                    SELECT MAX(weekly_hours)
                    FROM (
                        SELECT ' . $maxWeekHoursExpression . ' AS weekly_hours
                        FROM planning_sessions weekly_sessions
                        WHERE weekly_sessions.formateur_id = f.id
                          AND ' . $maxWeekValidatedCondition . '
                        GROUP BY weekly_sessions.week_number
                    ) AS trainer_weekly_totals
                ), 0) AS max_week_hours,
                CASE WHEN ' . $questionnairePercentageExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnairePercentageExpression . ', 2) END AS questionnaire_percentage
             FROM formateurs f
             LEFT JOIN affectations a ON a.formateur_id = f.id
             LEFT JOIN modules m ON m.id = a.module_id
             GROUP BY f.id, f.nom, f.email, f.specialite, f.max_heures
             ORDER BY f.nom'
        );

        return $stmt->fetchAll();
    }

    public function getWeeklyOverloads(): array
    {
        $plannedHoursExpression = planningSessionHoursExpression('s');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('s', 'ps', currentAcademicYear());
        $stmt = $this->db->query(
            'SELECT
                s.formateur_id,
                f.nom,
                s.week_number AS semaine,
                ' . $plannedHoursExpression . ' AS weekly_hours
             FROM planning_sessions s
             INNER JOIN formateurs f ON f.id = s.formateur_id
             WHERE s.week_number BETWEEN ' . SYSTEM_WEEK_MIN . ' AND ' . SYSTEM_WEEK_MAX . '
               AND ' . $validatedPlanningCondition . '
             GROUP BY s.formateur_id, f.nom, s.week_number
             HAVING ' . $plannedHoursExpression . ' > 44
             ORDER BY weekly_hours DESC, s.week_number ASC'
        );

        return $stmt->fetchAll();
    }

    public function getDirectorKpis(): array
    {
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');
        $stmt = $this->db->query(
            'SELECT
                (SELECT COUNT(*) FROM planning_submissions WHERE status = "pending") AS pending_validations,
                (SELECT COUNT(*) FROM planning_submissions) AS total_submissions,
                (SELECT COUNT(*) FROM planning_submissions WHERE status = "approved") AS approved_validations,
                (SELECT COUNT(*) FROM planning_submissions WHERE status = "approved" AND YEARWEEK(processed_at, 1) = YEARWEEK(CURDATE(), 1)) AS approved_this_week,
                (SELECT COUNT(*) FROM modules m
                    WHERE COALESCE((
                        SELECT ' . $completedHoursExpression . '
                        FROM planning_sessions s
                        WHERE s.module_id = m.id
                          AND ' . $completedSessionsCondition . '
                    ), 0) > 0
                      AND COALESCE((
                        SELECT ' . $completedHoursExpression . '
                        FROM planning_sessions s
                        WHERE s.module_id = m.id
                          AND ' . $completedSessionsCondition . '
                    ), 0) < m.volume_horaire) AS modules_in_progress,
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
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');
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
                SELECT module_id, ' . $completedHoursExpression . ' AS hours_done
                FROM planning_sessions s
                WHERE ' . $completedSessionsCondition . '
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

    public function getModulePerformanceRows(int $annee, int $limit = 8): array
    {
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');
        $stmt = $this->db->prepare(
            'SELECT
                m.id AS module_id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule,
                m.filiere,
                m.volume_horaire,
                f.id AS formateur_id,
                f.nom AS formateur_nom,
                COALESCE(progress.completed_hours, 0) AS completed_hours,
                CASE
                    WHEN score.percentage IS NULL THEN NULL
                    ELSE ROUND(score.percentage, 2)
                END AS questionnaire_percentage,
                ROUND(
                    LEAST(
                        100,
                        CASE
                            WHEN m.volume_horaire = 0 THEN 0
                            ELSE (COALESCE(progress.completed_hours, 0) / m.volume_horaire) * 100
                        END
                    ),
                    0
                ) AS completion_percent
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             INNER JOIN formateurs f ON f.id = a.formateur_id
             LEFT JOIN (
                SELECT
                    s.formateur_id,
                    s.module_id,
                    ' . $completedHoursExpression . ' AS completed_hours
                FROM planning_sessions s
                WHERE ' . $completedSessionsCondition . '
                GROUP BY s.formateur_id, s.module_id
             ) progress ON progress.formateur_id = a.formateur_id
                AND progress.module_id = a.module_id
             LEFT JOIN (
                SELECT
                    es.formateur_id,
                    es.module_id,
                    MAX(es.percentage) AS percentage
                FROM evaluation_scores es
                WHERE es.module_id IS NOT NULL
                GROUP BY es.formateur_id, es.module_id
             ) score ON score.formateur_id = a.formateur_id
                AND score.module_id = a.module_id
             WHERE a.annee = :annee
             ORDER BY completion_percent DESC, questionnaire_percentage DESC, m.intitule ASC
             LIMIT :limit'
        );
        $stmt->bindValue(':annee', $annee, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'module_id' => intval($row['module_id'] ?? 0),
                'code' => $row['code'],
                'intitule' => $row['intitule'],
                'filiere' => $row['filiere'],
                'volume_horaire' => intval($row['volume_horaire'] ?? 0),
                'formateur_id' => intval($row['formateur_id'] ?? 0),
                'formateur_nom' => $row['formateur_nom'],
                'completed_hours' => round(floatval($row['completed_hours'] ?? 0), 2),
                'questionnaire_percentage' => $row['questionnaire_percentage'] !== null
                    ? round(floatval($row['questionnaire_percentage']), 2)
                    : null,
                'completion_percent' => intval($row['completion_percent'] ?? 0),
            ];
        }, $stmt->fetchAll());
    }

    public function getModuleCompletionRows(int $limit = 8, string $direction = 'DESC'): array
    {
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');
        $normalizedDirection = strtoupper($direction) === 'ASC' ? 'ASC' : 'DESC';
        $stmt = $this->db->prepare(
            'SELECT
                m.id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule,
                m.filiere,
                m.volume_horaire,
                COALESCE(progress.completed_hours, 0) AS completed_hours,
                COALESCE(assignments.formateur_nom, "Non affecte") AS formateur_nom,
                ROUND(
                    LEAST(
                        100,
                        CASE
                            WHEN m.volume_horaire = 0 THEN 0
                            ELSE (COALESCE(progress.completed_hours, 0) / m.volume_horaire) * 100
                        END
                    ),
                    0
                ) AS progress_percent
             FROM modules m
             LEFT JOIN (
                SELECT
                    s.module_id,
                    ' . $completedHoursExpression . ' AS completed_hours
                FROM planning_sessions s
                WHERE ' . $completedSessionsCondition . '
                GROUP BY s.module_id
             ) progress ON progress.module_id = m.id
             LEFT JOIN (
                SELECT
                    a.module_id,
                    GROUP_CONCAT(DISTINCT f.nom ORDER BY f.nom SEPARATOR ", ") AS formateur_nom
                FROM affectations a
                INNER JOIN formateurs f ON f.id = a.formateur_id
                WHERE a.annee = :annee
                GROUP BY a.module_id
             ) assignments ON assignments.module_id = m.id
             ORDER BY progress_percent ' . $normalizedDirection . ', m.intitule ASC
             LIMIT :limit'
        );
        $stmt->bindValue(':annee', currentAcademicYear(), PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'id' => intval($row['id'] ?? 0),
                'code' => $row['code'],
                'intitule' => $row['intitule'],
                'filiere' => $row['filiere'],
                'volume_horaire' => intval($row['volume_horaire'] ?? 0),
                'completed_hours' => round(floatval($row['completed_hours'] ?? 0), 2),
                'formateur_nom' => $row['formateur_nom'],
                'progress_percent' => intval($row['progress_percent'] ?? 0),
            ];
        }, $stmt->fetchAll());
    }

    public function getTeachingLoadTimeline(int $weekCount = 8, int $monthCount = 6): array
    {
        $plannedHoursExpression = planningSessionHoursExpression('s');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('s', 'ps', currentAcademicYear());
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');

        $weeklyStmt = $this->db->prepare(
            'SELECT
                s.week_number,
                ROUND(' . $plannedHoursExpression . ', 2) AS hours
             FROM planning_sessions s
             WHERE s.week_number BETWEEN ' . SYSTEM_WEEK_MIN . ' AND ' . SYSTEM_WEEK_MAX . '
               AND ' . $validatedPlanningCondition . '
             GROUP BY s.week_number
             ORDER BY s.week_number DESC
             LIMIT :limit'
        );
        $weeklyStmt->bindValue(':limit', $weekCount, PDO::PARAM_INT);
        $weeklyStmt->execute();

        $monthlyStmt = $this->db->prepare(
            'SELECT
                DATE_FORMAT(COALESCE(s.session_date, s.week_start_date), "%Y-%m") AS month_key,
                ROUND(' . $completedHoursExpression . ', 2) AS hours
             FROM planning_sessions s
             WHERE ' . $completedSessionsCondition . '
             GROUP BY month_key
             ORDER BY month_key DESC
             LIMIT :limit'
        );
        $monthlyStmt->bindValue(':limit', $monthCount, PDO::PARAM_INT);
        $monthlyStmt->execute();

        $weekly = array_reverse(array_map(static function (array $row): array {
            return [
                'label' => 'S' . intval($row['week_number'] ?? 0),
                'week_number' => intval($row['week_number'] ?? 0),
                'hours' => round(floatval($row['hours'] ?? 0), 2),
            ];
        }, $weeklyStmt->fetchAll()));

        $monthly = array_reverse(array_map(static function (array $row): array {
            $monthKey = (string) ($row['month_key'] ?? '');
            $label = $monthKey;

            if (preg_match('/^(\d{4})-(\d{2})$/', $monthKey, $matches)) {
                $monthNames = [
                    '01' => 'Jan',
                    '02' => 'Fev',
                    '03' => 'Mar',
                    '04' => 'Avr',
                    '05' => 'Mai',
                    '06' => 'Juin',
                    '07' => 'Juil',
                    '08' => 'Aout',
                    '09' => 'Sep',
                    '10' => 'Oct',
                    '11' => 'Nov',
                    '12' => 'Dec',
                ];
                $label = ($monthNames[$matches[2]] ?? $matches[2]) . ' ' . $matches[1];
            }

            return [
                'label' => $label,
                'month_key' => $monthKey,
                'hours' => round(floatval($row['hours'] ?? 0), 2),
            ];
        }, $monthlyStmt->fetchAll()));

        return [
            'weekly' => $weekly,
            'monthly' => $monthly,
        ];
    }

    public function getHoursByFiliere(): array
    {
        $plannedHoursExpression = planningSessionHoursExpression('s');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('s', 'ps', currentAcademicYear());
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');

        $stmt = $this->db->query(
            'SELECT
                m.filiere,
                COUNT(*) AS module_count,
                SUM(CASE WHEN m.has_efm = 1 THEN 1 ELSE 0 END) AS efm_count,
                COALESCE(SUM(m.volume_horaire), 0) AS total_module_hours,
                COALESCE(SUM(planned.hours), 0) AS planned_hours,
                COALESCE(SUM(completed.hours), 0) AS completed_hours
             FROM modules m
             LEFT JOIN (
                SELECT
                    s.module_id,
                    ' . $plannedHoursExpression . ' AS hours
                FROM planning_sessions s
                WHERE ' . $validatedPlanningCondition . '
                GROUP BY s.module_id
             ) planned ON planned.module_id = m.id
             LEFT JOIN (
                SELECT
                    s.module_id,
                    ' . $completedHoursExpression . ' AS hours
                FROM planning_sessions s
                WHERE ' . $completedSessionsCondition . '
                GROUP BY s.module_id
             ) completed ON completed.module_id = m.id
             GROUP BY m.filiere
             ORDER BY completed_hours DESC, m.filiere ASC'
        );

        return array_map(static function (array $row): array {
            $plannedHours = round(floatval($row['planned_hours'] ?? 0), 2);
            $completedHours = round(floatval($row['completed_hours'] ?? 0), 2);
            $totalModuleHours = round(floatval($row['total_module_hours'] ?? 0), 2);

            return [
                'filiere' => $row['filiere'] ?: 'Sans filiere',
                'module_count' => intval($row['module_count'] ?? 0),
                'efm_count' => intval($row['efm_count'] ?? 0),
                'total_module_hours' => $totalModuleHours,
                'planned_hours' => $plannedHours,
                'completed_hours' => $completedHours,
                'completion_percent' => $totalModuleHours > 0
                    ? intval(round(min(100, ($completedHours / $totalModuleHours) * 100)))
                    : 0,
            ];
        }, $stmt->fetchAll());
    }

    public function getQuestionnaireAnalytics(int $annee): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                COUNT(*) AS assigned_questionnaires,
                SUM(CASE WHEN es.id IS NOT NULL THEN 1 ELSE 0 END) AS completed_questionnaires,
                ROUND(AVG(es.percentage), 2) AS average_percentage
             FROM affectations a
             INNER JOIN module_questionnaires mq ON mq.module_id = a.module_id
             LEFT JOIN evaluation_scores es ON es.formateur_id = a.formateur_id
                AND es.module_id = a.module_id
             WHERE a.annee = :annee'
        );
        $stmt->execute(['annee' => $annee]);
        $row = $stmt->fetch() ?: [];

        return [
            'assigned_questionnaires' => intval($row['assigned_questionnaires'] ?? 0),
            'completed_questionnaires' => intval($row['completed_questionnaires'] ?? 0),
            'average_percentage' => $row['average_percentage'] !== null
                ? round(floatval($row['average_percentage']), 2)
                : null,
        ];
    }

    public function getQuestionnaireModuleInsights(int $limit = 4, string $direction = 'DESC'): array
    {
        $normalizedDirection = strtoupper($direction) === 'ASC' ? 'ASC' : 'DESC';
        $stmt = $this->db->prepare(
            'SELECT
                m.id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule,
                m.filiere,
                COUNT(es.id) AS response_count,
                ROUND(AVG(es.percentage), 2) AS average_percentage
             FROM modules m
             INNER JOIN module_questionnaires mq ON mq.module_id = m.id
             LEFT JOIN evaluation_scores es ON es.module_id = m.id
             GROUP BY m.id, m.code, m.intitule, m.filiere
             HAVING response_count > 0
             ORDER BY average_percentage ' . $normalizedDirection . ', response_count DESC, m.intitule ASC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'id' => intval($row['id'] ?? 0),
                'code' => $row['code'],
                'intitule' => $row['intitule'],
                'filiere' => $row['filiere'],
                'response_count' => intval($row['response_count'] ?? 0),
                'average_percentage' => round(floatval($row['average_percentage'] ?? 0), 2),
            ];
        }, $stmt->fetchAll());
    }

    public function getTrainerKpis(int $formateurId, int $week, int $annee): array
    {
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');
        $plannedHoursExpression = planningSessionHoursExpression('ps');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('ps', 'vs', $annee);
        $stmt = $this->db->prepare(
            'SELECT
                f.id,
                f.nom,
                f.email,
                COALESCE(f.telephone, "") AS telephone,
                f.specialite,
                f.max_heures,
                COALESCE((
                    SELECT ' . $completedHoursExpression . '
                    FROM planning_sessions s
                    WHERE s.formateur_id = f.id
                      AND ' . $completedSessionsCondition . '
                ), 0) AS annual_completed_hours,
                COALESCE((
                    SELECT ' . $plannedHoursExpression . '
                    FROM planning_sessions ps
                    WHERE ps.formateur_id = f.id
                      AND ps.week_number = :week
                      AND ' . $validatedPlanningCondition . '
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
        $completedSessionsCondition = completedPlanningSessionCondition('s');
        $completedHoursExpression = completedPlanningSessionHoursExpression('s');
        $plannedHoursExpression = planningSessionHoursExpression('ps');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('ps', 'vs', $annee);
        $stmt = $this->db->prepare(
            'SELECT
                m.id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule,
                m.filiere,
                m.semestre,
                m.volume_horaire,
                m.has_efm,
                COALESCE(executed.completed_hours, 0) AS completed_hours,
                COALESCE(planned.weekly_hours, 0) AS weekly_hours,
                COALESCE(GROUP_CONCAT(DISTINCT g.code ORDER BY g.code SEPARATOR " • "), "") AS groupes,
                COALESCE(
                    GROUP_CONCAT(
                        DISTINCT CONCAT(
                            g.code,
                            "::",
                            REPLACE(REPLACE(COALESCE(g.nom, g.code), "|", "/"), "::", " - "),
                            "::",
                            COALESCE(g.effectif, 20)
                        )
                        ORDER BY g.code
                        SEPARATOR "|"
                    ),
                    ""
                ) AS groupes_payload
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             LEFT JOIN (
                    SELECT
                    s.formateur_id,
                    s.module_id,
                    ' . $completedHoursExpression . ' AS completed_hours
                FROM planning_sessions s
                WHERE ' . $completedSessionsCondition . '
                GROUP BY s.formateur_id, s.module_id
             ) executed ON executed.module_id = m.id AND executed.formateur_id = a.formateur_id
             LEFT JOIN (
                SELECT
                    ps.formateur_id,
                    ps.module_id,
                    ps.week_number,
                    ' . $plannedHoursExpression . ' AS weekly_hours
                FROM planning_sessions ps
                WHERE ps.week_number = :week_filter
                  AND ' . $validatedPlanningCondition . '
                GROUP BY ps.formateur_id, ps.module_id, ps.week_number
             ) planned ON planned.module_id = m.id
                AND planned.formateur_id = a.formateur_id
                AND planned.week_number = :week_join
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
                m.has_efm,
                executed.completed_hours,
                planned.weekly_hours
             ORDER BY
                CASE m.semestre WHEN "S1" THEN 1 ELSE 2 END,
                m.intitule ASC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'annee' => $annee,
            'week_filter' => $week,
            'week_join' => $week,
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
                    [$code, $groupName, $effectif] = array_pad(explode('::', $chunk, 3), 3, null);
                    if (!$code) {
                        continue;
                    }

                    $groups[] = [
                        'code' => $code,
                        'nom' => $groupName ?: $code,
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
             ORDER BY created_at DESC, id DESC
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
                SUM(CASE WHEN status IN ("validated", "planned") THEN 1 ELSE 0 END) AS approved_count,
                SUM(CASE WHEN status = "validated" THEN 1 ELSE 0 END) AS validated_count,
                SUM(CASE WHEN status = "planned" THEN 1 ELSE 0 END) AS planned_count,
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
            'validated_count' => intval($row['validated_count'] ?? 0),
            'planned_count' => intval($row['planned_count'] ?? 0),
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
                r.updated_at,
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
                'updated_at' => $row['updated_at'],
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
            'groupe_code' => $payload['groupe_code'] ?? '',
            'semaine' => $payload['semaine'] ?? '',
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

    public function findDuplicatePendingTrainerChangeRequest(array $payload): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT
                id,
                formateur_id,
                module_id,
                groupe_code,
                semaine,
                request_week,
                academic_year,
                reason,
                status,
                created_at,
                updated_at,
                processed_at
             FROM planning_change_requests
             WHERE formateur_id = :formateur_id
               AND module_id = :module_id
               AND academic_year = :academic_year
               AND status = "pending"
               AND COALESCE(request_week, 0) = :request_week
               AND COALESCE(TRIM(groupe_code), "") = :groupe_code
               AND COALESCE(TRIM(semaine), "") = :semaine
               AND COALESCE(TRIM(reason), "") = :reason
             ORDER BY created_at DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([
            'formateur_id' => intval($payload['formateur_id'] ?? 0),
            'module_id' => intval($payload['module_id'] ?? 0),
            'academic_year' => intval($payload['academic_year'] ?? 0),
            'request_week' => intval($payload['request_week'] ?? 0),
            'groupe_code' => trim((string) ($payload['groupe_code'] ?? '')),
            'semaine' => trim((string) ($payload['semaine'] ?? '')),
            'reason' => trim((string) ($payload['reason'] ?? '')),
        ]);

        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        return [
            'id' => intval($row['id']),
            'formateur_id' => intval($row['formateur_id']),
            'module_id' => intval($row['module_id']),
            'groupe_code' => $row['groupe_code'],
            'semaine' => $row['semaine'],
            'request_week' => $row['request_week'] !== null ? intval($row['request_week']) : null,
            'academic_year' => intval($row['academic_year']),
            'reason' => $row['reason'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'processed_at' => $row['processed_at'],
        ];
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
                r.updated_at,
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
                    WHEN "validated" THEN 1
                    WHEN "planned" THEN 2
                    WHEN "rejected" THEN 1
                    ELSE 3
                END,
                COALESCE(r.processed_at, r.created_at) DESC'
        );

        $notifications = array_map(static function (array $row): array {
            $reason = (string) ($row['reason'] ?? '');
            $isAccept = stripos($reason, 'Confirmation du creneau') === 0;
            $isReject = stripos($reason, 'Refus du creneau') === 0;
            $status = (string) ($row['status'] ?? 'pending');

            return [
                'id' => 'planning-change-' . intval($row['id']),
                'title' => $status === 'pending'
                    ? ($isAccept ? 'Acceptation de creneau en attente' : ($isReject ? 'Refus de creneau en attente' : 'Action planning en attente'))
                    : ($status === 'validated'
                        ? 'Demande validee'
                        : ($status === 'planned' ? 'Demande planifiee' : 'Action planning refusee')),
                'message' => sprintf('%s · %s · %s', $row['trainer_name'], $row['module_code'], $row['semaine']),
                'details' => $reason,
                'severity' => $status === 'rejected' ? 'danger' : ($status === 'planned' ? 'info' : 'warning'),
                'alert_type' => 'planning_change',
                'notification_type' => 'planning_change',
                'created_at' => $row['updated_at'] ?: ($row['processed_at'] ?: $row['created_at']),
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

        $alertStmt = $this->db->prepare(
            'SELECT id, action_label, action_tone, action_description, created_at
             FROM recent_activities
             WHERE formateur_id IS NULL
               AND action_label = :action_label
             ORDER BY created_at DESC
             LIMIT 10'
        );
        $alertStmt->execute([
            'action_label' => 'Alerte planning equipe',
        ]);

        $alerts = array_map(static function (array $row): array {
            return [
                'id' => 'planning-alert-' . intval($row['id']),
                'title' => $row['action_label'],
                'message' => $row['action_description'],
                'details' => $row['action_description'],
                'severity' => $row['action_tone'] ?? 'warning',
                'alert_type' => 'planning_alert',
                'notification_type' => 'planning_alert',
                'created_at' => $row['created_at'],
                'target_path' => '/directeur/validation',
                'metadata' => [
                    'status' => 'planning_alert',
                ],
            ];
        }, $alertStmt->fetchAll());

        $notifications = array_merge($alerts, $notifications);
        usort($notifications, static function (array $left, array $right): int {
            return strcmp((string) ($right['created_at'] ?? ''), (string) ($left['created_at'] ?? ''));
        });

        return $notifications;
    }

    public function findTrainerChangeRequestById(int $requestId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT
                r.id,
                r.formateur_id,
                r.module_id,
                r.groupe_code,
                r.semaine,
                r.request_week,
                r.academic_year,
                r.reason,
                r.status,
                r.created_at,
                r.updated_at,
                r.processed_at,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.intitule AS module_intitule
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

        return [
            'id' => intval($row['id']),
            'formateur_id' => intval($row['formateur_id']),
            'module_id' => intval($row['module_id']),
            'groupe_code' => $row['groupe_code'],
            'semaine' => $row['semaine'],
            'request_week' => $row['request_week'] !== null ? intval($row['request_week']) : null,
            'academic_year' => intval($row['academic_year']),
            'reason' => $row['reason'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'processed_at' => $row['processed_at'],
            'module_code' => $row['module_code'],
            'module_intitule' => $row['module_intitule'],
        ];
    }

    public function findTrainerChangeRequestIdsByPlanningContext(int $formateurId, int $moduleId, int $weekNumber, array $statuses = ['validated', 'planned']): array
    {
        if ($statuses === []) {
            return [];
        }

        [$placeholders, $params] = $this->buildInClause($statuses);
        $sql = sprintf(
            'SELECT id
             FROM planning_change_requests
             WHERE formateur_id = ?
               AND module_id = ?
               AND status IN (%s)
               AND (request_week IS NULL OR request_week = ?)
             ORDER BY created_at ASC, id ASC',
            $placeholders
        );

        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_merge([$formateurId, $moduleId], $params, [$weekNumber]));

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function getLatestTrainerChangeRequestsForWeek(int $formateurId, int $weekNumber, int $academicYear): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                id,
                module_id,
                groupe_code,
                request_week,
                reason,
                status,
                created_at,
                updated_at,
                processed_at
             FROM planning_change_requests
             WHERE formateur_id = :formateur_id
               AND academic_year = :academic_year
               AND request_week = :week_number
             ORDER BY created_at DESC, id DESC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'academic_year' => $academicYear,
            'week_number' => $weekNumber,
        ]);

        return array_map(static function (array $row): array {
            $reason = (string) ($row['reason'] ?? '');
            $decision = 'change';

            if (stripos($reason, 'Confirmation du creneau') === 0) {
                $decision = 'accept';
            } elseif (stripos($reason, 'Refus du creneau') === 0) {
                $decision = 'reject';
            }

            return [
                'id' => intval($row['id']),
                'module_id' => intval($row['module_id']),
                'groupe_code' => trim((string) ($row['groupe_code'] ?? '')),
                'request_week' => $row['request_week'] !== null ? intval($row['request_week']) : null,
                'reason' => $reason,
                'status' => (string) ($row['status'] ?? 'pending'),
                'decision' => $decision,
                'created_at' => $row['created_at'] ?? null,
                'updated_at' => $row['updated_at'] ?? null,
                'processed_at' => $row['processed_at'] ?? null,
            ];
        }, $stmt->fetchAll());
    }

    public function countPlanningSessionsForContext(int $formateurId, int $moduleId, int $weekNumber, ?string $groupCode = null): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM planning_sessions s
             LEFT JOIN groupes g ON g.id = s.groupe_id
             WHERE s.formateur_id = :formateur_id
               AND s.module_id = :module_id
               AND s.week_number = :week_number
               AND s.status <> "cancelled"
               AND (:group_code_any = "" OR COALESCE(g.code, "") = :group_code_exact)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'week_number' => $weekNumber,
            'group_code_any' => trim((string) ($groupCode ?? '')),
            'group_code_exact' => trim((string) ($groupCode ?? '')),
        ]);

        return intval($stmt->fetchColumn() ?? 0);
    }

    public function updateTrainerChangeRequestStatus(int $requestId, string $status, array $options = []): void
    {
        $weekNumber = isset($options['week_number']) ? intval($options['week_number']) : null;
        $weekLabel = $options['week_label'] ?? ($weekNumber !== null ? 'Semaine ' . $weekNumber : '');
        $groupCode = trim((string) ($options['group_code'] ?? ''));
        $touchProcessedAt = !empty($options['touch_processed_at']);

        $stmt = $this->db->prepare(
            'UPDATE planning_change_requests
             SET status = :status,
                 request_week = CASE
                    WHEN :request_week_value IS NOT NULL AND request_week IS NULL THEN :request_week_target
                    ELSE request_week
                 END,
                 semaine = CASE
                    WHEN :week_label_check <> "" AND COALESCE(semaine, "") IN ("", "A definir") THEN :week_label_value
                    ELSE semaine
                 END,
                 groupe_code = CASE
                    WHEN :group_code_check <> "" AND COALESCE(groupe_code, "") = "" THEN :group_code_value
                    ELSE groupe_code
                 END,
                 updated_at = CURRENT_TIMESTAMP,
                 processed_at = CASE
                    WHEN :touch_processed_flag = 1 THEN NOW()
                    ELSE processed_at
                 END
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $requestId,
            'status' => $status,
            'request_week_value' => $weekNumber,
            'request_week_target' => $weekNumber,
            'week_label_check' => $weekLabel,
            'week_label_value' => $weekLabel,
            'group_code_check' => $groupCode,
            'group_code_value' => $groupCode,
            'touch_processed_flag' => $touchProcessedAt ? 1 : 0,
        ]);
    }

    public function logTrainerChangeRequestActivity(array $request, string $status, ?string $note = null): void
    {
        $activityInsert = $this->db->prepare(
            'INSERT INTO recent_activities (formateur_id, module_id, action_label, action_tone, action_description)
             VALUES (:formateur_id, :module_id, :action_label, :action_tone, :action_description)'
        );
        $activityInsert->execute([
            'formateur_id' => intval($request['formateur_id']),
            'module_id' => intval($request['module_id']),
            'action_label' => $status === 'validated' ? 'Demande planning validee' : 'Demande planning refusee',
            'action_tone' => $status === 'validated' ? 'success' : 'danger',
            'action_description' => $note && trim($note) !== ''
                ? trim($note)
                : sprintf(
                    'La demande concernant %s pour %s a ete %s.',
                    $request['module_code'],
                    $request['semaine'],
                    $status === 'validated' ? 'validee' : 'refusee'
                ),
        ]);
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
            $tone = $row['status'] === 'planned'
                ? 'info'
                : ($row['status'] === 'validated'
                    ? 'success'
                    : ($row['status'] === 'rejected' ? 'danger' : 'warning'));
            $events[] = [
                'id' => 'request-' . intval($row['id']),
                'type' => 'request',
                'tone' => $tone,
                'title' => sprintf(
                    'Demande %s pour %s',
                    $row['status'] === 'planned'
                        ? 'planifiee'
                        : ($row['status'] === 'validated'
                            ? 'validee'
                            : ($row['status'] === 'rejected' ? 'refusee' : 'en attente')),
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
             WHERE ra.formateur_id = :formateur_id
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
