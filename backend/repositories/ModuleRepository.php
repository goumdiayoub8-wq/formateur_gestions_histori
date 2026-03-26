<?php

class ModuleRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function all(array $filters = []): array
    {
        $sql = 'SELECT
                    m.id,
                    m.code,
                    m.intitule,
                    m.intitule AS title,
                    m.filiere,
                    m.semestre,
                    m.volume_horaire,
                    m.volume_horaire AS hours_required,
                    m.has_efm,
                    m.created_at,
                    m.updated_at,
                    COALESCE(GROUP_CONCAT(DISTINCT g.code ORDER BY g.code SEPARATOR " • "), "") AS groupes
                FROM modules m
                LEFT JOIN module_groupes mg ON mg.module_id = m.id
                LEFT JOIN groupes g ON g.id = mg.groupe_id
                WHERE 1 = 1';
        $params = [];

        if (!empty($filters['filiere'])) {
            $sql .= ' AND m.filiere = :filiere';
            $params['filiere'] = $filters['filiere'];
        }

        if (!empty($filters['semestre'])) {
            $sql .= ' AND m.semestre = :semestre';
            $params['semestre'] = $filters['semestre'];
        }

        if (array_key_exists('has_efm', $filters) && $filters['has_efm'] !== null) {
            $sql .= ' AND m.has_efm = :has_efm';
            $params['has_efm'] = $filters['has_efm'] ? 1 : 0;
        }

        if (!empty($filters['formateur_id'])) {
            $sql .= ' AND EXISTS (
                SELECT 1
                FROM affectations a
                WHERE a.module_id = m.id
                  AND a.formateur_id = :formateur_id';
            $params['formateur_id'] = intval($filters['formateur_id']);

            if (!empty($filters['annee'])) {
                $sql .= ' AND a.annee = :annee';
                $params['annee'] = intval($filters['annee']);
            }

            $sql .= ')';
        }

        $sql .= ' GROUP BY
                    m.id,
                    m.code,
                    m.intitule,
                    m.filiere,
                    m.semestre,
                    m.volume_horaire,
                    m.has_efm,
                    m.created_at,
                    m.updated_at
                  ORDER BY m.filiere, m.intitule';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return array_map(static function (array $row): array {
            $row['groupes'] = $row['groupes'] !== '' ? explode(' • ', $row['groupes']) : [];

            return $row;
        }, $stmt->fetchAll());
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, code, intitule, intitule AS title, filiere, semestre, volume_horaire, volume_horaire AS hours_required, has_efm, created_at, updated_at
             FROM modules
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findDuplicate(array $data, ?int $ignoreId = null): ?array
    {
        $sql = 'SELECT id, intitule FROM modules WHERE intitule = :intitule AND filiere = :filiere AND semestre = :semestre';
        $params = [
            'intitule' => $data['intitule'],
            'filiere' => $data['filiere'],
            'semestre' => $data['semestre'],
        ];

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
            'INSERT INTO modules (code, intitule, filiere, semestre, volume_horaire, has_efm)
             VALUES (:code, :intitule, :filiere, :semestre, :volume_horaire, :has_efm)'
        );
        $stmt->execute([
            'code' => $data['code'],
            'intitule' => $data['intitule'],
            'filiere' => $data['filiere'],
            'semestre' => $data['semestre'],
            'volume_horaire' => $data['volume_horaire'],
            'has_efm' => $data['has_efm'] ? 1 : 0,
        ]);

        return intval($this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE modules
             SET code = :code,
                 intitule = :intitule,
                 filiere = :filiere,
                 semestre = :semestre,
                 volume_horaire = :volume_horaire,
                 has_efm = :has_efm,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'code' => $data['code'],
            'intitule' => $data['intitule'],
            'filiere' => $data['filiere'],
            'semestre' => $data['semestre'],
            'volume_horaire' => $data['volume_horaire'],
            'has_efm' => $data['has_efm'] ? 1 : 0,
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM modules WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function hasDependencies(int $id): bool
    {
        $stmt = $this->db->prepare(
            'SELECT
                (SELECT COUNT(*) FROM affectations WHERE module_id = :affectations_module_id) +
                (SELECT COUNT(*) FROM planning WHERE module_id = :planning_module_id) AS total_dependencies'
        );
        $stmt->execute([
            'affectations_module_id' => $id,
            'planning_module_id' => $id,
        ]);

        return intval($stmt->fetchColumn()) > 0;
    }

    public function progressSummary(?int $annee = null): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                COUNT(*) AS total_modules,
                COALESCE(SUM(volume_horaire), 0) AS total_hours,
                SUM(CASE WHEN semestre = "S1" THEN 1 ELSE 0 END) AS semester_1,
                SUM(CASE WHEN semestre = "S2" THEN 1 ELSE 0 END) AS semester_2
             FROM modules'
        );
        $stmt->execute();

        $row = $stmt->fetch() ?: [];

        return [
            'total_modules' => intval($row['total_modules'] ?? 0),
            'total_hours' => intval($row['total_hours'] ?? 0),
            'semester_1' => intval($row['semester_1'] ?? 0),
            'semester_2' => intval($row['semester_2'] ?? 0),
            'academic_year' => $annee,
        ];
    }

    public function progressList(array $filters = []): array
    {
        $annee = intval($filters['annee'] ?? date('Y'));
        $sql = 'SELECT
                    m.id,
                    COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                    m.intitule,
                    m.filiere,
                    m.semestre,
                    m.volume_horaire,
                    COALESCE(pl.completed_hours, 0) AS completed_hours,
                    GREATEST(m.volume_horaire - COALESCE(pl.completed_hours, 0), 0) AS remaining_hours,
                    ROUND(
                        LEAST(
                            100,
                            CASE
                                WHEN m.volume_horaire = 0 THEN 0
                                ELSE (COALESCE(pl.completed_hours, 0) / m.volume_horaire) * 100
                            END
                        ),
                        0
                    ) AS progress_percent,
                    COALESCE(GROUP_CONCAT(DISTINCT g.code ORDER BY g.code SEPARATOR " • "), "") AS groupes,
                    COALESCE(GROUP_CONCAT(DISTINCT f.nom ORDER BY f.nom SEPARATOR " • "), "Non affecte") AS formateur_nom
                FROM modules m
                LEFT JOIN (
                    SELECT module_id, SUM(heures) AS completed_hours
                    FROM planning
                    GROUP BY module_id
                ) pl ON pl.module_id = m.id
                LEFT JOIN module_groupes mg ON mg.module_id = m.id
                LEFT JOIN groupes g ON g.id = mg.groupe_id
                LEFT JOIN affectations a ON a.module_id = m.id AND a.annee = :annee
                LEFT JOIN formateurs f ON f.id = a.formateur_id
                WHERE 1 = 1';
        $params = ['annee' => $annee];

        if (!empty($filters['module_id'])) {
            $sql .= ' AND m.id = :module_id';
            $params['module_id'] = intval($filters['module_id']);
        }

        if (!empty($filters['groupe_id'])) {
            $sql .= ' AND EXISTS (
                SELECT 1
                FROM module_groupes mg2
                WHERE mg2.module_id = m.id
                  AND mg2.groupe_id = :groupe_id
            )';
            $params['groupe_id'] = intval($filters['groupe_id']);
        }

        if (!empty($filters['q'])) {
            $sql .= ' AND (
                m.intitule LIKE :q
                OR m.filiere LIKE :q
                OR COALESCE(m.code, "") LIKE :q
                OR EXISTS (
                    SELECT 1
                    FROM module_groupes mg3
                    INNER JOIN groupes g3 ON g3.id = mg3.groupe_id
                    WHERE mg3.module_id = m.id
                      AND (g3.code LIKE :q OR g3.nom LIKE :q)
                )
            )';
            $params['q'] = '%' . $filters['q'] . '%';
        }

        $sql .= ' GROUP BY
                    m.id,
                    m.code,
                    m.intitule,
                    m.filiere,
                    m.semestre,
                    m.volume_horaire,
                    pl.completed_hours
                  ORDER BY progress_percent DESC, m.intitule ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return array_map(static function (array $row): array {
            return [
                'id' => intval($row['id']),
                'code' => $row['code'],
                'intitule' => $row['intitule'],
                'filiere' => $row['filiere'],
                'semestre' => $row['semestre'],
                'volume_horaire' => intval($row['volume_horaire']),
                'completed_hours' => round(floatval($row['completed_hours']), 2),
                'remaining_hours' => round(floatval($row['remaining_hours']), 2),
                'progress_percent' => intval($row['progress_percent']),
                'groupes' => $row['groupes'] !== '' ? explode(' • ', $row['groupes']) : [],
                'formateur_nom' => $row['formateur_nom'],
            ];
        }, $stmt->fetchAll());
    }
}
