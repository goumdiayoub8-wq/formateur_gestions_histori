<?php

class FormateurRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function all(): array
    {
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
                COALESCE(f.current_hours, 0) AS current_hours,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.total_score, 2) END AS questionnaire_total_score,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.max_score, 2) END AS questionnaire_max_score,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.percentage, 2) END AS questionnaire_percentage,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.percentage, 2) END AS questionnaire_score,
                s.created_at AS questionnaire_created_at,
                f.created_at,
                f.updated_at
             FROM formateurs f
             LEFT JOIN evaluation_scores s ON s.formateur_id = f.id
             ORDER BY f.nom'
        );

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
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
                COALESCE(f.current_hours, 0) AS current_hours,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.total_score, 2) END AS questionnaire_total_score,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.max_score, 2) END AS questionnaire_max_score,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.percentage, 2) END AS questionnaire_percentage,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.percentage, 2) END AS questionnaire_score,
                s.created_at AS questionnaire_created_at,
                f.created_at,
                f.updated_at
             FROM formateurs f
             LEFT JOIN evaluation_scores s ON s.formateur_id = f.id
             WHERE f.id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByEmail(string $email, ?int $ignoreId = null): ?array
    {
        $sql = 'SELECT id, nom, nom AS name, email, COALESCE(telephone, "") AS telephone, specialite, max_heures, max_heures AS max_hours, COALESCE(current_hours, 0) AS current_hours FROM formateurs WHERE email = :email';
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

    public function create(array $data): int
    {
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

        return intval($this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
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
                COALESCE(SUM(CASE WHEN semaine = :week THEN week_total ELSE 0 END), 0) AS current_week_hours,
                COALESCE(MAX(week_total), 0) AS max_week_hours
             FROM (
                SELECT semaine, SUM(heures) AS week_total
                FROM planning
                WHERE formateur_id = :formateur_id
                GROUP BY semaine
             ) weekly'
        );
        $weeklyStmt->execute([
            'formateur_id' => $id,
            'week' => currentAcademicWeek(),
        ]);
        $weekly = $weeklyStmt->fetch() ?: [];

        return [
            'annual_hours' => round(floatval($annual['annual_hours'] ?? 0), 2),
            'semester_hours' => [
                'S1' => round(floatval($annual['s1_hours'] ?? 0), 2),
                'S2' => round(floatval($annual['s2_hours'] ?? 0), 2),
            ],
            'weekly_hours' => [
                'current_week' => round(floatval($weekly['current_week_hours'] ?? 0), 2),
                'max_week' => round(floatval($weekly['max_week_hours'] ?? 0), 2),
            ],
        ];
    }

    public function hasDependencies(int $id): bool
    {
        $stmt = $this->db->prepare(
            'SELECT
                (SELECT COUNT(*) FROM affectations WHERE formateur_id = :affectations_formateur_id) +
                (SELECT COUNT(*) FROM planning WHERE formateur_id = :planning_formateur_id) AS total_dependencies'
        );
        $stmt->execute([
            'affectations_formateur_id' => $id,
            'planning_formateur_id' => $id,
        ]);

        return intval($stmt->fetchColumn()) > 0;
    }
}
