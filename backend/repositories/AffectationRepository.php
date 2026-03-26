<?php

class AffectationRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function all(array $filters = []): array
    {
        $sql = 'SELECT
                    a.id,
                    a.formateur_id,
                    a.module_id,
                    a.annee,
                    a.created_at,
                    f.nom AS formateur_nom,
                    f.email AS formateur_email,
                    m.intitule AS module_intitule,
                    m.filiere,
                    m.semestre,
                    m.volume_horaire,
                    m.has_efm
                FROM affectations a
                INNER JOIN formateurs f ON f.id = a.formateur_id
                INNER JOIN modules m ON m.id = a.module_id
                WHERE 1 = 1';
        $params = [];

        if (!empty($filters['formateur_id'])) {
            $sql .= ' AND a.formateur_id = :formateur_id';
            $params['formateur_id'] = intval($filters['formateur_id']);
        }

        if (!empty($filters['module_id'])) {
            $sql .= ' AND a.module_id = :module_id';
            $params['module_id'] = intval($filters['module_id']);
        }

        if (!empty($filters['annee'])) {
            $sql .= ' AND a.annee = :annee';
            $params['annee'] = intval($filters['annee']);
        }

        $sql .= ' ORDER BY a.annee DESC, f.nom, m.intitule';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM affectations WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByFormateurAndModule(int $formateurId, int $moduleId, ?int $annee = null): ?array
    {
        $sql = 'SELECT * FROM affectations WHERE formateur_id = :formateur_id AND module_id = :module_id';
        $params = [
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
        ];

        if ($annee !== null) {
            $sql .= ' AND annee = :annee';
            $params['annee'] = $annee;
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
            'INSERT INTO affectations (formateur_id, module_id, annee)
             VALUES (:formateur_id, :module_id, :annee)'
        );
        $stmt->execute([
            'formateur_id' => $data['formateur_id'],
            'module_id' => $data['module_id'],
            'annee' => $data['annee'],
        ]);

        return intval($this->db->lastInsertId());
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM affectations WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function getTrainerAnnualHours(int $formateurId, int $annee, ?int $excludeAssignmentId = null): float
    {
        $sql = 'SELECT COALESCE(SUM(m.volume_horaire), 0)
                FROM affectations a
                INNER JOIN modules m ON m.id = a.module_id
                WHERE a.formateur_id = :formateur_id
                  AND a.annee = :annee';
        $params = [
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ];

        if ($excludeAssignmentId !== null) {
            $sql .= ' AND a.id <> :exclude_id';
            $params['exclude_id'] = $excludeAssignmentId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return round(floatval($stmt->fetchColumn()), 2);
    }

    public function getTrainerSemesterHours(int $formateurId, int $annee, ?int $excludeAssignmentId = null): array
    {
        $sql = 'SELECT
                    COALESCE(SUM(CASE WHEN m.semestre = "S1" THEN m.volume_horaire ELSE 0 END), 0) AS s1_hours,
                    COALESCE(SUM(CASE WHEN m.semestre = "S2" THEN m.volume_horaire ELSE 0 END), 0) AS s2_hours
                FROM affectations a
                INNER JOIN modules m ON m.id = a.module_id
                WHERE a.formateur_id = :formateur_id
                  AND a.annee = :annee';
        $params = [
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ];

        if ($excludeAssignmentId !== null) {
            $sql .= ' AND a.id <> :exclude_id';
            $params['exclude_id'] = $excludeAssignmentId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch() ?: [];

        return [
            'S1' => round(floatval($row['s1_hours'] ?? 0), 2),
            'S2' => round(floatval($row['s2_hours'] ?? 0), 2),
        ];
    }

    public function getTrainerEfmCount(int $formateurId, int $annee, ?int $excludeAssignmentId = null): int
    {
        $sql = 'SELECT COUNT(*)
                FROM affectations a
                INNER JOIN modules m ON m.id = a.module_id
                WHERE a.formateur_id = :formateur_id
                  AND a.annee = :annee
                  AND m.has_efm = 1';
        $params = [
            'formateur_id' => $formateurId,
            'annee' => $annee,
        ];

        if ($excludeAssignmentId !== null) {
            $sql .= ' AND a.id <> :exclude_id';
            $params['exclude_id'] = $excludeAssignmentId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return intval($stmt->fetchColumn());
    }

    public function findModuleAssignmentForYear(int $moduleId, int $annee, ?int $excludeAssignmentId = null): ?array
    {
        $sql = 'SELECT * FROM affectations WHERE module_id = :module_id AND annee = :annee';
        $params = [
            'module_id' => $moduleId,
            'annee' => $annee,
        ];

        if ($excludeAssignmentId !== null) {
            $sql .= ' AND id <> :exclude_id';
            $params['exclude_id'] = $excludeAssignmentId;
        }

        $sql .= ' LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function isModuleAssignedToTrainer(int $formateurId, int $moduleId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT id
             FROM affectations
             WHERE formateur_id = :formateur_id AND module_id = :module_id
             LIMIT 1'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
        ]);

        return (bool) $stmt->fetch();
    }
}
