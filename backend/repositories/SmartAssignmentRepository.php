<?php

class SmartAssignmentRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function listTrainersForSuggestions(): array
    {
        $stmt = $this->db->query(
            'SELECT
                f.id,
                f.nom,
                f.email,
                f.specialite,
                f.max_heures,
                COALESCE(f.current_hours, 0) AS current_hours
             FROM formateurs f
             ORDER BY f.nom'
        );

        return $stmt->fetchAll();
    }

    public function getModuleById(int $moduleId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT
                m.id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code,
                m.intitule,
                m.filiere,
                m.semestre,
                m.volume_horaire,
                m.has_efm
             FROM modules m
             WHERE m.id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $moduleId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function trainerExists(int $formateurId): bool
    {
        $stmt = $this->db->prepare('SELECT id FROM formateurs WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $formateurId]);

        return (bool) $stmt->fetch();
    }

    public function moduleExists(int $moduleId): bool
    {
        $stmt = $this->db->prepare('SELECT id FROM modules WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $moduleId]);

        return (bool) $stmt->fetch();
    }

    public function getAssignedModuleCodes(int $formateurId): array
    {
        $stmt = $this->db->prepare(
            'SELECT COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             WHERE a.formateur_id = :formateur_id
             ORDER BY m.code'
        );
        $stmt->execute(['formateur_id' => $formateurId]);

        return array_map(static fn(array $row): string => $row['code'], $stmt->fetchAll());
    }

    public function getCompetenceLevel(int $formateurId, int $moduleId): ?int
    {
        $stmt = $this->db->prepare(
            'SELECT competence_level
             FROM formateur_modules
             WHERE formateur_id = :formateur_id
               AND module_id = :module_id
             LIMIT 1'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
        ]);
        $value = $stmt->fetchColumn();

        return $value !== false ? intval($value) : null;
    }

    public function countExperienceForTrainer(int $formateurId, string $filiere): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             WHERE a.formateur_id = :formateur_id
               AND m.filiere = :filiere'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'filiere' => $filiere,
        ]);

        return intval($stmt->fetchColumn());
    }

    public function getCachedScore(int $formateurId, int $moduleId, int $ttlHours = 12): ?array
    {
        $threshold = (new DateTimeImmutable(sprintf('-%d hours', $ttlHours)))->format('Y-m-d H:i:s');
        $stmt = $this->db->prepare(
            'SELECT
                score,
                reason,
                created_at
             FROM ai_scores
             WHERE formateur_id = :formateur_id
               AND module_id = :module_id
               AND created_at >= :threshold
             LIMIT 1'
        );
        $stmt->bindValue(':formateur_id', $formateurId, PDO::PARAM_INT);
        $stmt->bindValue(':module_id', $moduleId, PDO::PARAM_INT);
        $stmt->bindValue(':threshold', $threshold, PDO::PARAM_STR);
        $stmt->execute();

        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        return [
            'score' => floatval($row['score']),
            'reason' => json_decode((string) $row['reason'], true) ?: [],
            'created_at' => $row['created_at'],
        ];
    }

    public function cacheScore(int $formateurId, int $moduleId, float $score, array $reason): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO ai_scores (formateur_id, module_id, score, reason, created_at)
             VALUES (:formateur_id, :module_id, :score, :reason, NOW())
             ON DUPLICATE KEY UPDATE
                score = VALUES(score),
                reason = VALUES(reason),
                created_at = NOW()'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'score' => round($score, 2),
            'reason' => json_encode($reason, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }

    public function clearScoreCacheForModule(int $moduleId): void
    {
        $stmt = $this->db->prepare('DELETE FROM ai_scores WHERE module_id = :module_id');
        $stmt->execute(['module_id' => $moduleId]);
    }

    public function clearScoreCacheForTrainer(int $formateurId): void
    {
        $stmt = $this->db->prepare('DELETE FROM ai_scores WHERE formateur_id = :formateur_id');
        $stmt->execute(['formateur_id' => $formateurId]);
    }

    public function updateTrainerCurrentHours(int $formateurId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE formateurs f
             LEFT JOIN (
                SELECT
                    a.formateur_id,
                    COALESCE(SUM(m.volume_horaire), 0) AS used_hours
                FROM affectations a
                INNER JOIN modules m ON m.id = a.module_id
                WHERE a.formateur_id = :workload_formateur_id
                GROUP BY a.formateur_id
             ) workload ON workload.formateur_id = f.id
             SET f.current_hours = COALESCE(workload.used_hours, 0)
             WHERE f.id = :target_formateur_id'
        );
        $stmt->execute([
            'workload_formateur_id' => $formateurId,
            'target_formateur_id' => $formateurId,
        ]);
    }
}
