<?php

class FormateurModulePreferenceRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function buildInClause(array $values): array
    {
        return [implode(', ', array_fill(0, count($values), '?')), array_values($values)];
    }

    public function countModulesByIds(array $moduleIds): int
    {
        if ($moduleIds === []) {
            return 0;
        }

        [$placeholders, $params] = $this->buildInClause($moduleIds);
        $stmt = $this->db->prepare(
            sprintf('SELECT COUNT(*) FROM modules WHERE id IN (%s)', $placeholders)
        );
        $stmt->execute($params);

        return intval($stmt->fetchColumn() ?: 0);
    }

    public function getCatalogWithPreferences(int $formateurId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                m.id AS module_id,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.intitule AS module_title,
                m.filiere,
                m.semestre,
                m.volume_horaire,
                pref.id AS preference_id,
                pref.status,
                pref.message_chef,
                pref.created_at AS preference_created_at,
                pref.updated_at AS preference_updated_at
             FROM modules m
             LEFT JOIN formateur_module_preferences pref
                ON pref.module_id = m.id
               AND pref.formateur_id = :formateur_id
             ORDER BY m.filiere ASC, m.semestre ASC, m.intitule ASC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
        ]);

        return $stmt->fetchAll();
    }

    public function getPreferencesForFormateur(int $formateurId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                pref.id,
                pref.formateur_id,
                pref.module_id,
                pref.status,
                pref.message_chef,
                pref.created_at,
                pref.updated_at,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.intitule AS module_title,
                m.filiere,
                m.semestre,
                m.volume_horaire
             FROM formateur_module_preferences pref
             INNER JOIN modules m ON m.id = pref.module_id
             WHERE pref.formateur_id = :formateur_id
             ORDER BY
                CASE pref.status
                    WHEN "pending" THEN 0
                    WHEN "accepted" THEN 1
                    WHEN "rejected" THEN 2
                    ELSE 3
                END,
                pref.updated_at DESC,
                m.intitule ASC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
        ]);

        return $stmt->fetchAll();
    }

    public function getPreferencesByFormateurAndModules(int $formateurId, array $moduleIds): array
    {
        if ($moduleIds === []) {
            return [];
        }

        [$placeholders, $params] = $this->buildInClause($moduleIds);
        $stmt = $this->db->prepare(
            sprintf(
                'SELECT
                    pref.id,
                    pref.formateur_id,
                    pref.module_id,
                    pref.status,
                    pref.message_chef,
                    pref.created_at,
                    pref.updated_at,
                    COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                    m.intitule AS module_title,
                    m.filiere,
                    m.semestre,
                    m.volume_horaire
                 FROM formateur_module_preferences pref
                 INNER JOIN modules m ON m.id = pref.module_id
                 WHERE pref.formateur_id = ?
                   AND pref.module_id IN (%s)
                 ORDER BY m.intitule ASC',
                $placeholders
            )
        );
        $stmt->execute(array_merge([$formateurId], $params));

        return $stmt->fetchAll();
    }

    public function upsertPreference(int $formateurId, int $moduleId, string $status, ?string $message): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateur_module_preferences (formateur_id, module_id, status, message_chef)
             VALUES (:formateur_id, :module_id, :status, :message_chef)
             ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                message_chef = VALUES(message_chef),
                updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'status' => $status,
            'message_chef' => $message,
        ]);
    }

    public function deletePendingPreferencesNotInSelection(int $formateurId, array $selectedModuleIds): void
    {
        if ($selectedModuleIds === []) {
            $stmt = $this->db->prepare(
                'DELETE FROM formateur_module_preferences
                 WHERE formateur_id = :formateur_id
                   AND status = "pending"'
            );
            $stmt->execute([
                'formateur_id' => $formateurId,
            ]);

            return;
        }

        [$placeholders, $params] = $this->buildInClause($selectedModuleIds);
        $stmt = $this->db->prepare(
            sprintf(
                'DELETE FROM formateur_module_preferences
                 WHERE formateur_id = ?
                   AND status = "pending"
                   AND module_id NOT IN (%s)',
                $placeholders
            )
        );
        $stmt->execute(array_merge([$formateurId], $params));
    }

    public function updateStatuses(int $formateurId, array $moduleIds, string $status, ?string $message): int
    {
        if ($moduleIds === []) {
            return 0;
        }

        [$placeholders, $params] = $this->buildInClause($moduleIds);
        $stmt = $this->db->prepare(
            sprintf(
                'UPDATE formateur_module_preferences
                 SET status = ?,
                     message_chef = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE formateur_id = ?
                   AND module_id IN (%s)',
                $placeholders
            )
        );
        $stmt->execute(array_merge([$status, $message, $formateurId], $params));

        return $stmt->rowCount();
    }

    public function insertRecentActivity(?int $formateurId, ?int $moduleId, string $label, string $tone, string $description): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO recent_activities (formateur_id, module_id, action_label, action_tone, action_description)
             VALUES (:formateur_id, :module_id, :action_label, :action_tone, :action_description)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'action_label' => $label,
            'action_tone' => $tone,
            'action_description' => $description,
        ]);
    }
}
