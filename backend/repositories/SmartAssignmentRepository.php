<?php

require_once __DIR__ . '/../core/helpers.php';

class SmartAssignmentRepository
{
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
            return "COALESCE({$alias}.weekly_hours, 0)";
        }

        return '0';
    }

    public function listTrainersForSuggestions(int $annee, int $week): array
    {
        $plannedHoursExpression = planningSessionHoursExpression('weekly_sessions');
        $validatedPlanningCondition = validatedPlanningSessionExistsCondition('weekly_sessions', 'weekly_submissions', $annee);
        $stmt = $this->db->prepare(
            'SELECT
                f.id,
                f.nom,
                f.email,
                f.specialite,
                f.max_heures,
                COALESCE(workload.current_hours, 0) AS current_hours,
                COALESCE(weekly.weekly_hours, 0) AS current_week_hours,
                ' . $this->weeklyHoursSelect('f') . ' AS weekly_hours_target,
                CASE WHEN s.id IS NULL THEN NULL ELSE ROUND(s.percentage, 2) END AS questionnaire_percentage
             FROM formateurs f
             LEFT JOIN (
                SELECT
                    a.formateur_id,
                    COALESCE(SUM(m.volume_horaire), 0) AS current_hours
                FROM affectations a
                INNER JOIN modules m ON m.id = a.module_id
                WHERE a.annee = :annee_workload
                GROUP BY a.formateur_id
             ) workload ON workload.formateur_id = f.id
             LEFT JOIN (
                SELECT
                    weekly_sessions.formateur_id,
                    ' . $plannedHoursExpression . ' AS weekly_hours
                FROM planning_sessions weekly_sessions
                WHERE weekly_sessions.week_number = :week
                  AND ' . $validatedPlanningCondition . '
                GROUP BY weekly_sessions.formateur_id
             ) weekly ON weekly.formateur_id = f.id
             LEFT JOIN evaluation_scores s ON s.formateur_id = f.id
             ORDER BY f.nom ASC, f.id ASC'
        );
        $stmt->execute([
            'annee_workload' => $annee,
            'week' => $week,
        ]);

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

    public function getAssignedModuleCodes(int $formateurId, ?int $annee = null): array
    {
        $sql = 'SELECT COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             WHERE a.formateur_id = :formateur_id';
        $params = ['formateur_id' => $formateurId];

        if ($annee !== null) {
            $sql .= ' AND a.annee = :annee';
            $params['annee'] = $annee;
        }

        $sql .= ' ORDER BY m.code';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return array_map(static fn(array $row): string => $row['code'], $stmt->fetchAll());
    }

    public function getAssignedModuleCodesMap(array $formateurIds, ?int $annee = null): array
    {
        $trainerIds = array_values(array_unique(array_filter(array_map('intval', $formateurIds))));
        if ($trainerIds === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($trainerIds), '?'));
        $sql = 'SELECT
                    a.formateur_id,
                    COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS code
                FROM affectations a
                INNER JOIN modules m ON m.id = a.module_id
                WHERE a.formateur_id IN (' . $placeholders . ')';
        $params = $trainerIds;

        if ($annee !== null) {
            $sql .= ' AND a.annee = ?';
            $params[] = $annee;
        }

        $sql .= ' ORDER BY a.formateur_id ASC, m.code ASC, a.id ASC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $grouped = [];
        foreach ($stmt->fetchAll() as $row) {
            $trainerId = intval($row['formateur_id'] ?? 0);
            if (!isset($grouped[$trainerId])) {
                $grouped[$trainerId] = [];
            }

            $grouped[$trainerId][] = $row['code'];
        }

        return $grouped;
    }

    public function getExperienceCountsForFiliere(array $formateurIds, string $filiere, int $annee): array
    {
        $trainerIds = array_values(array_unique(array_filter(array_map('intval', $formateurIds))));
        if ($trainerIds === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($trainerIds), '?'));
        $params = $trainerIds;
        $params[] = $filiere;
        $params[] = $annee;

        $stmt = $this->db->prepare(
            'SELECT
                a.formateur_id,
                COUNT(*) AS experience_count
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             WHERE a.formateur_id IN (' . $placeholders . ')
               AND m.filiere = ?
               AND a.annee = ?
             GROUP BY a.formateur_id'
        );
        $stmt->execute($params);

        $counts = [];
        foreach ($stmt->fetchAll() as $row) {
            $counts[intval($row['formateur_id'] ?? 0)] = intval($row['experience_count'] ?? 0);
        }

        return $counts;
    }

    public function getCompetenceLevelsForModule(array $formateurIds, int $moduleId): array
    {
        $trainerIds = array_values(array_unique(array_filter(array_map('intval', $formateurIds))));
        if ($trainerIds === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($trainerIds), '?'));
        $params = $trainerIds;
        $params[] = $moduleId;

        $stmt = $this->db->prepare(
            'SELECT
                formateur_id,
                competence_level
             FROM formateur_modules
             WHERE formateur_id IN (' . $placeholders . ')
               AND module_id = ?'
        );
        $stmt->execute($params);

        $levels = [];
        foreach ($stmt->fetchAll() as $row) {
            $levels[intval($row['formateur_id'] ?? 0)] = intval($row['competence_level'] ?? 0);
        }

        return $levels;
    }

    public function countExperienceForTrainer(int $formateurId, string $filiere): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             WHERE a.formateur_id = :formateur_id
               AND m.filiere = :filiere
               AND a.annee = :annee'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'filiere' => $filiere,
            'annee' => currentAcademicYear(),
        ]);

        return intval($stmt->fetchColumn());
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

    public function updateTrainerCurrentHours(int $formateurId, ?int $annee = null): void
    {
        $sql = 'UPDATE formateurs f
             LEFT JOIN (
                SELECT
                    a.formateur_id,
                    COALESCE(SUM(m.volume_horaire), 0) AS used_hours
                FROM affectations a
                INNER JOIN modules m ON m.id = a.module_id
                WHERE a.formateur_id = :workload_formateur_id';
        $params = [
            'workload_formateur_id' => $formateurId,
            'target_formateur_id' => $formateurId,
        ];

        if ($annee !== null) {
            $sql .= ' AND a.annee = :annee';
            $params['annee'] = $annee;
        }

        $sql .= '
                GROUP BY a.formateur_id
             ) workload ON workload.formateur_id = f.id
             SET f.current_hours = COALESCE(workload.used_hours, 0)
             WHERE f.id = :target_formateur_id';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }
}
