<?php

class AffectationRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function applyFilters(string &$sql, array &$params, array $filters = []): void
    {
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

        $search = trim((string) ($filters['search'] ?? $filters['q'] ?? ''));

        if ($search !== '') {
            $sql .= ' AND (
                f.nom LIKE :search_formateur_nom
                OR f.email LIKE :search_formateur_email
                OR m.intitule LIKE :search_module_intitule
                OR m.filiere LIKE :search_module_filiere
                OR COALESCE(m.code, "") LIKE :search_module_code
            )';
            $searchValue = '%' . $search . '%';
            $params['search_formateur_nom'] = $searchValue;
            $params['search_formateur_email'] = $searchValue;
            $params['search_module_intitule'] = $searchValue;
            $params['search_module_filiere'] = $searchValue;
            $params['search_module_code'] = $searchValue;
        }
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
        $this->applyFilters($sql, $params, $filters);

        $sql .= ' ORDER BY a.annee DESC, f.nom, m.intitule';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function paginate(int $page = 1, int $limit = 5, array $filters = []): array
    {
        $normalizedLimit = max(1, min(100, $limit));
        $countSql = 'SELECT COUNT(*)
            FROM affectations a
            INNER JOIN formateurs f ON f.id = a.formateur_id
            INNER JOIN modules m ON m.id = a.module_id
            WHERE 1 = 1';
        $countParams = [];
        $this->applyFilters($countSql, $countParams, $filters);

        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($countParams);

        $totalItems = intval($countStmt->fetchColumn() ?: 0);
        $totalPages = max(1, (int) ceil($totalItems / $normalizedLimit));
        $currentPage = max(1, min($page, $totalPages));
        $offset = ($currentPage - 1) * $normalizedLimit;

        $sql = 'SELECT
                    a.id,
                    a.formateur_id,
                    a.module_id,
                    a.annee,
                    a.created_at,
                    f.nom AS formateur_nom,
                    f.email AS formateur_email,
                    m.code AS module_code,
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
        $this->applyFilters($sql, $params, $filters);
        $sql .= ' ORDER BY a.annee DESC, f.nom, m.intitule
                  LIMIT :limit OFFSET :offset';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':limit', $normalizedLimit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data' => $stmt->fetchAll(),
            'total_items' => $totalItems,
            'total_pages' => $totalPages,
            'current_page' => $currentPage,
            'limit' => $normalizedLimit,
        ];
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
