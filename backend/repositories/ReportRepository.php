<?php

class ReportRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO reports (type, format, title, file_path, generated_by)
             VALUES (:type, :format, :title, :file_path, :generated_by)'
        );
        $stmt->execute([
            'type' => $data['type'],
            'format' => $data['format'],
            'title' => $data['title'],
            'file_path' => $data['file_path'],
            'generated_by' => $data['generated_by'],
        ]);

        return intval($this->db->lastInsertId());
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, type, format, title, file_path, generated_by, created_at
             FROM reports
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function recent(int $limit = 8): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, type, format, title, file_path, generated_by, created_at
             FROM reports
             ORDER BY created_at DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getWorkloadRows(int $annee): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                f.id,
                f.nom,
                f.specialite,
                COALESCE(f.telephone, "") AS telephone,
                f.email,
                COALESCE((
                    SELECT GROUP_CONCAT(COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) ORDER BY m.id SEPARATOR ", ")
                    FROM affectations a
                    INNER JOIN modules m ON m.id = a.module_id
                    WHERE a.formateur_id = f.id
                      AND a.annee = :annee_modules
                ), "") AS modules,
                COALESCE((
                    SELECT SUM(m.volume_horaire)
                    FROM affectations a
                    INNER JOIN modules m ON m.id = a.module_id
                    WHERE a.formateur_id = f.id
                      AND a.annee = :annee_hours
                ), 0) AS annual_hours,
                COALESCE((SELECT SUM(p.heures) FROM planning p WHERE p.formateur_id = f.id), 0) AS completed_hours,
                COALESCE((SELECT COUNT(*) FROM planning_submissions s WHERE s.formateur_id = f.id AND s.status = "pending"), 0) AS pending_submissions
             FROM formateurs f
             ORDER BY f.nom'
        );
        $stmt->execute([
            'annee_modules' => $annee,
            'annee_hours' => $annee,
        ]);

        return array_map(static function (array $row): array {
            $row['annual_hours'] = round(floatval($row['annual_hours']), 2);
            $row['completed_hours'] = round(floatval($row['completed_hours']), 2);
            $row['pending_submissions'] = intval($row['pending_submissions']);
            return $row;
        }, $stmt->fetchAll());
    }

    public function getModuleProgressRows(int $annee): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                m.id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule,
                m.filiere,
                m.semestre,
                m.volume_horaire,
                COALESCE(pl.completed_hours, 0) AS completed_hours,
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
                COALESCE(GROUP_CONCAT(DISTINCT g.code ORDER BY g.code SEPARATOR ", "), "") AS groupes,
                COALESCE(GROUP_CONCAT(DISTINCT f.nom ORDER BY f.nom SEPARATOR ", "), "Non affecte") AS formateur_nom
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
             GROUP BY m.id, m.code, m.intitule, m.filiere, m.semestre, m.volume_horaire, pl.completed_hours
             ORDER BY progress_percent DESC, m.intitule ASC'
        );
        $stmt->execute(['annee' => $annee]);

        return array_map(static function (array $row): array {
            $row['volume_horaire'] = intval($row['volume_horaire']);
            $row['completed_hours'] = round(floatval($row['completed_hours']), 2);
            $row['progress_percent'] = intval($row['progress_percent']);
            return $row;
        }, $stmt->fetchAll());
    }
}
