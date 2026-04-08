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

    private function baseSelect(string $alias = 'f'): string
    {
        $questionnairePercentageExpression = resolvedTrainerQuestionnairePercentageExpression($alias . '.id');
        $questionnaireTotalScoreExpression = latestEvaluationScoreFieldExpression($alias . '.id', 'total_score');
        $questionnaireMaxScoreExpression = latestEvaluationScoreFieldExpression($alias . '.id', 'max_score');
        $questionnaireCreatedAtExpression = latestEvaluationScoreFieldExpression($alias . '.id', 'created_at');

        return 'SELECT
                ' . $alias . '.id,
                ' . $alias . '.nom,
                ' . $alias . '.nom AS name,
                ' . $alias . '.email,
                COALESCE(' . $alias . '.telephone, "") AS telephone,
                ' . $alias . '.specialite,
                ' . $alias . '.max_heures,
                ' . $alias . '.max_heures AS max_hours,
                ' . $this->weeklyHoursSelect($alias) . '
                COALESCE(' . $alias . '.current_hours, 0) AS current_hours,
                CASE WHEN ' . $questionnaireTotalScoreExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnaireTotalScoreExpression . ', 2) END AS questionnaire_total_score,
                CASE WHEN ' . $questionnaireMaxScoreExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnaireMaxScoreExpression . ', 2) END AS questionnaire_max_score,
                CASE WHEN ' . $questionnairePercentageExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnairePercentageExpression . ', 2) END AS questionnaire_percentage,
                CASE WHEN ' . $questionnairePercentageExpression . ' IS NULL THEN NULL ELSE ROUND(' . $questionnairePercentageExpression . ', 2) END AS questionnaire_score,
                ' . $questionnaireCreatedAtExpression . ' AS questionnaire_created_at,
                ' . $alias . '.created_at,
                ' . $alias . '.updated_at
             FROM formateurs ' . $alias;
    }

    private function searchCondition(string $alias = 'f'): string
    {
        return '(' . $alias . '.nom LIKE :search_nom
            OR ' . $alias . '.email LIKE :search_email
            OR ' . $alias . '.specialite LIKE :search_specialite)';
    }

    private function buildSearchBindings(string $search = ''): array
    {
        $searchValue = '%' . trim($search) . '%';

        return [
            'search_nom' => $searchValue,
            'search_email' => $searchValue,
            'search_specialite' => $searchValue,
        ];
    }

    private function fetchRows(string $whereClause = '', array $params = [], ?int $limit = null, ?int $offset = null): array
    {
        $sql = $this->baseSelect('f');

        if ($whereClause !== '') {
            $sql .= ' WHERE ' . $whereClause;
        }

        $sql .= ' ORDER BY f.nom';

        if ($limit !== null) {
            $sql .= ' LIMIT :limit';
        }

        if ($offset !== null) {
            $sql .= ' OFFSET :offset';
        }

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }

        if ($limit !== null) {
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        }

        if ($offset !== null) {
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        }

        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function all(): array
    {
        return $this->fetchRows();
    }

    public function find(int $id): ?array
    {
        $rows = $this->fetchRows('f.id = :id', ['id' => $id], 1, 0);
        $row = $rows[0] ?? null;

        return $row ?: null;
    }

    public function paginate(int $page = 1, int $limit = 5, string $search = ''): array
    {
        $normalizedLimit = max(1, min(100, $limit));
        $search = trim($search);
        $countSql = 'SELECT COUNT(*) FROM formateurs f';
        $params = [];
        $whereClause = '';

        if ($search !== '') {
            $whereClause = $this->searchCondition('f');
            $params = $this->buildSearchBindings($search);
            $countSql .= ' WHERE ' . $whereClause;
        }

        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue(':' . $key, $value);
        }
        $countStmt->execute();

        $totalItems = intval($countStmt->fetchColumn() ?: 0);
        $totalPages = max(1, (int) ceil($totalItems / $normalizedLimit));
        $currentPage = max(1, min($page, $totalPages));
        $offset = ($currentPage - 1) * $normalizedLimit;

        return [
            'data' => $this->fetchRows($whereClause, $params, $normalizedLimit, $offset),
            'total_items' => $totalItems,
            'total_pages' => $totalPages,
            'current_page' => $currentPage,
            'limit' => $normalizedLimit,
        ];
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
