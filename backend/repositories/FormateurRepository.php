<?php

require_once __DIR__ . '/../core/helpers.php';

class FormateurRepository
{
    private const MAX_WEEKLY_HOURS = 44.0;

    private PDO $db;
    private ?bool $hasWeeklyHoursColumn = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function hasWeeklyHoursColumn(): bool
    {
        if ($this->hasWeeklyHoursColumn !== null) {
            return $this->hasWeeklyHoursColumn;
        }

        $stmt = $this->db->query("SHOW COLUMNS FROM formateurs LIKE 'weekly_hours'");
        $this->hasWeeklyHoursColumn = (bool) $stmt->fetch();

        return $this->hasWeeklyHoursColumn;
    }

    private function weeklyHoursSelect(string $alias = 'f'): string
    {
        if ($this->hasWeeklyHoursColumn()) {
            return "COALESCE({$alias}.weekly_hours, 0) AS weekly_hours,
                COALESCE({$alias}.weekly_hours, 0) AS weekly_hours_target,";
        }

        return '0 AS weekly_hours,
                0 AS weekly_hours_target,';
    }

    public function all(): array
    {
        $questionnairePercentageExpression = resolvedTrainerQuestionnairePercentageExpression('f.id');
        $questionnaireTotalScoreExpression = latestEvaluationScoreFieldExpression('f.id', 'total_score');
        $questionnaireMaxScoreExpression = latestEvaluationScoreFieldExpression('f.id', 'max_score');
        $questionnaireCreatedAtExpression = latestEvaluationScoreFieldExpression('f.id', 'created_at');
        $stmt = $this->db->query(
            'SELECT
                f.id,
                f.nom,
                f.nom AS name,
                f.email,
                COALESCE(telephone, "") AS telephone,
                f.specialite,
                f.max_heures,
                f.max_heures AS max_hours,
                ' . $this->weeklyHoursSelect('f') . '
                COALESCE(f.current_hours, 0) AS current_hours,
                CASE WHEN ' . $questionnaireTotalScoreExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnaireTotalScoreExpression . ', 2) END AS questionnaire_total_score,
                CASE WHEN ' . $questionnaireMaxScoreExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnaireMaxScoreExpression . ', 2) END AS questionnaire_max_score,
                CASE WHEN ' . $questionnairePercentageExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnairePercentageExpression . ', 2) END AS questionnaire_percentage,
                CASE WHEN ' . $questionnairePercentageExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnairePercentageExpression . ', 2) END AS questionnaire_score,
                ' . $questionnaireCreatedAtExpression . ' AS questionnaire_created_at,
                f.created_at,
                f.updated_at
             FROM formateurs f
             ORDER BY f.nom'
        );

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $questionnairePercentageExpression = resolvedTrainerQuestionnairePercentageExpression('f.id');
        $questionnaireTotalScoreExpression = latestEvaluationScoreFieldExpression('f.id', 'total_score');
        $questionnaireMaxScoreExpression = latestEvaluationScoreFieldExpression('f.id', 'max_score');
        $questionnaireCreatedAtExpression = latestEvaluationScoreFieldExpression('f.id', 'created_at');
        $stmt = $this->db->prepare(
            'SELECT
                f.id,
                f.nom,
                f.nom AS name,
                f.email,
                COALESCE(f.telephone, "") AS telephone,
                f.specialite,
                f.max_heures,
                f.max_heures AS max_hours,
                ' . $this->weeklyHoursSelect('f') . '
                COALESCE(f.current_hours, 0) AS current_hours,
                CASE WHEN ' . $questionnaireTotalScoreExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnaireTotalScoreExpression . ', 2) END AS questionnaire_total_score,
                CASE WHEN ' . $questionnaireMaxScoreExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnaireMaxScoreExpression . ', 2) END AS questionnaire_max_score,
                CASE WHEN ' . $questionnairePercentageExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnairePercentageExpression . ', 2) END AS questionnaire_percentage,
                CASE WHEN ' . $questionnairePercentageExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnairePercentageExpression . ', 2) END AS questionnaire_score,
                ' . $questionnaireCreatedAtExpression . ' AS questionnaire_created_at,
                f.created_at,
                f.updated_at
             FROM formateurs f
             WHERE f.id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByEmail(string $email, ?int $ignoreId = null): ?array
    {
        $sql = 'SELECT
                    id,
                    nom,
                    nom AS name,
                    email,
                    COALESCE(telephone, "") AS telephone,
                    specialite,
                    max_heures,
                    max_heures AS max_hours,
                    ' . ($this->hasWeeklyHoursColumn()
                        ? 'COALESCE(weekly_hours, 0) AS weekly_hours,
                           COALESCE(weekly_hours, 0) AS weekly_hours_target,'
                        : '0 AS weekly_hours,
                           0 AS weekly_hours_target,') . '
                    COALESCE(current_hours, 0) AS current_hours
                FROM formateurs
                WHERE email = :email';
        $params = ['email' => $email];

        if ($ignoreId !== null) {
            $sql .= ' AND id <> :ignore_id';
            $params['ignore_id'] = $ignoreId;
        }

        $sql .= ' LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByEmailOrLinkedUserEmail(string $email, ?int $ignoreId = null): ?array
    {
        $sql = 'SELECT
                    f.id,
                    f.nom,
                    f.nom AS name,
                    f.email,
                    COALESCE(f.telephone, "") AS telephone,
                    f.specialite,
                    f.max_heures,
                    f.max_heures AS max_hours,
                    ' . ($this->hasWeeklyHoursColumn()
                        ? 'COALESCE(f.weekly_hours, 0) AS weekly_hours,
                           COALESCE(f.weekly_hours, 0) AS weekly_hours_target,'
                        : '0 AS weekly_hours,
                           0 AS weekly_hours_target,') . '
                    COALESCE(f.current_hours, 0) AS current_hours
                FROM formateurs f
                LEFT JOIN utilisateurs u ON u.formateur_id = f.id
                WHERE (
                    f.email = :email
                    OR u.email = :linked_user_email
                )';
        $params = [
            'email' => $email,
            'linked_user_email' => $email,
        ];

        if ($ignoreId !== null) {
            $sql .= ' AND f.id <> :ignore_id';
            $params['ignore_id'] = $ignoreId;
        }

        $sql .= ' ORDER BY CASE WHEN f.email = :preferred_email THEN 0 ELSE 1 END, f.id ASC LIMIT 1';
        $params['preferred_email'] = $email;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function create(array $data): int
    {
        if ($this->hasWeeklyHoursColumn()) {
            $stmt = $this->db->prepare(
                'INSERT INTO formateurs (nom, email, specialite, max_heures, weekly_hours)
                 VALUES (:nom, :email, :specialite, :max_heures, :weekly_hours)'
            );
            $stmt->execute([
                'nom' => $data['nom'],
                'email' => $data['email'],
                'specialite' => $data['specialite'],
                'max_heures' => $data['max_heures'] ?? 910,
                'weekly_hours' => $data['weekly_hours'] ?? null,
            ]);
        } else {
            $stmt = $this->db->prepare(
                'INSERT INTO formateurs (nom, email, specialite, max_heures)
                 VALUES (:nom, :email, :specialite, :max_heures)'
            );
            $stmt->execute([
                'nom' => $data['nom'],
                'email' => $data['email'],
                'specialite' => $data['specialite'],
                'max_heures' => $data['max_heures'] ?? 910,
            ]);
        }

        return intval($this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        if ($this->hasWeeklyHoursColumn()) {
            $stmt = $this->db->prepare(
                'UPDATE formateurs
                 SET nom = :nom,
                     email = :email,
                     specialite = :specialite,
                     max_heures = :max_heures,
                     weekly_hours = :weekly_hours,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $stmt->execute([
                'id' => $id,
                'nom' => $data['nom'],
                'email' => $data['email'],
                'specialite' => $data['specialite'],
                'max_heures' => $data['max_heures'] ?? 910,
                'weekly_hours' => $data['weekly_hours'] ?? null,
            ]);
            return;
        }

        $stmt = $this->db->prepare(
            'UPDATE formateurs
             SET nom = :nom,
                 email = :email,
                 specialite = :specialite,
                 max_heures = :max_heures,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'nom' => $data['nom'],
            'email' => $data['email'],
            'specialite' => $data['specialite'],
            'max_heures' => $data['max_heures'] ?? 910,
        ]);
    }

    public function syncIdentity(int $id, string $nom, string $email): void
    {
        $stmt = $this->db->prepare(
            'UPDATE formateurs
             SET nom = :nom,
                 email = :email,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'nom' => $nom,
            'email' => $email,
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM formateurs WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function getHoursSummary(int $id): array
    {
        $plannedHoursExpression = planningSessionHoursExpression('s');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('s', 'ps', currentAcademicYear());
        $annualStmt = $this->db->prepare(
            'SELECT
                COALESCE(SUM(m.volume_horaire), 0) AS annual_hours,
                COALESCE(SUM(CASE WHEN m.semestre = "S1" THEN m.volume_horaire ELSE 0 END), 0) AS s1_hours,
                COALESCE(SUM(CASE WHEN m.semestre = "S2" THEN m.volume_horaire ELSE 0 END), 0) AS s2_hours
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             WHERE a.formateur_id = :formateur_id'
        );
        $annualStmt->execute(['formateur_id' => $id]);
        $annual = $annualStmt->fetch() ?: [];

        $weeklyStmt = $this->db->prepare(
            'SELECT
                COALESCE(SUM(CASE WHEN week_number = :week THEN week_total ELSE 0 END), 0) AS current_week_hours,
                COALESCE(MAX(week_total), 0) AS max_week_hours
             FROM (
                SELECT s.week_number, ' . $plannedHoursExpression . ' AS week_total
                FROM planning_sessions s
                WHERE s.formateur_id = :formateur_id
                  AND ' . $validatedPlanningCondition . '
                GROUP BY s.week_number
             ) weekly'
        );
        $weeklyStmt->execute([
            'formateur_id' => $id,
            'week' => currentAcademicWeek(),
        ]);
        $weekly = $weeklyStmt->fetch() ?: [];
        $assignedAnnualHours = round(floatval($annual['annual_hours'] ?? 0), 2);
        $weeklyTarget = 0.0;

        if ($this->hasWeeklyHoursColumn()) {
            $targetStmt = $this->db->prepare('SELECT COALESCE(weekly_hours, 0) FROM formateurs WHERE id = :id LIMIT 1');
            $targetStmt->execute(['id' => $id]);
            $weeklyTarget = round(floatval($targetStmt->fetchColumn() ?? 0), 2);
        }

        if ($weeklyTarget <= 0 && $assignedAnnualHours > 0) {
            $weeklyTarget = round(min(self::MAX_WEEKLY_HOURS, $assignedAnnualHours / ACADEMIC_WEEKS), 2);
        }

        return [
            'annual_hours' => $assignedAnnualHours,
            'semester_hours' => [
                'S1' => round(floatval($annual['s1_hours'] ?? 0), 2),
                'S2' => round(floatval($annual['s2_hours'] ?? 0), 2),
            ],
            'weekly_hours' => [
                'current_week' => round(floatval($weekly['current_week_hours'] ?? 0), 2),
                'max_week' => round(floatval($weekly['max_week_hours'] ?? 0), 2),
                'target' => $weeklyTarget,
                'limit' => self::MAX_WEEKLY_HOURS,
            ],
        ];
    }

    public function hasDependencies(int $id): bool
    {
        $stmt = $this->db->prepare(
            'SELECT
                (SELECT COUNT(*) FROM affectations WHERE formateur_id = :affectations_formateur_id) +
                (SELECT COUNT(*) FROM planning_sessions WHERE formateur_id = :planning_formateur_id) AS total_dependencies'
        );
        $stmt->execute([
            'affectations_formateur_id' => $id,
            'planning_formateur_id' => $id,
        ]);

        return intval($stmt->fetchColumn()) > 0;
    }
}
