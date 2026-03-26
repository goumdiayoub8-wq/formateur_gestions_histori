<?php

class AcademicConfigRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function current(): ?array
    {
        $stmt = $this->db->query(
            'SELECT
                id,
                start_date,
                end_date,
                s2_start_date,
                stage_start_date,
                stage_end_date,
                exam_regional_date,
                created_at,
                updated_at
             FROM academic_config
             ORDER BY id DESC
             LIMIT 1'
        );
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function upsert(array $payload): array
    {
        $current = $this->current();

        if ($current) {
            $stmt = $this->db->prepare(
                'UPDATE academic_config
                 SET start_date = :start_date,
                     end_date = :end_date,
                     s2_start_date = :s2_start_date,
                     stage_start_date = :stage_start_date,
                     stage_end_date = :stage_end_date,
                     exam_regional_date = :exam_regional_date,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $stmt->execute([
                'id' => intval($current['id']),
                'start_date' => $payload['start_date'],
                'end_date' => $payload['end_date'],
                's2_start_date' => $payload['s2_start_date'],
                'stage_start_date' => $payload['stage_start_date'],
                'stage_end_date' => $payload['stage_end_date'],
                'exam_regional_date' => $payload['exam_regional_date'],
            ]);

            return $this->current() ?: [];
        }

        $stmt = $this->db->prepare(
            'INSERT INTO academic_config (
                start_date,
                end_date,
                s2_start_date,
                stage_start_date,
                stage_end_date,
                exam_regional_date
             ) VALUES (
                :start_date,
                :end_date,
                :s2_start_date,
                :stage_start_date,
                :stage_end_date,
                :exam_regional_date
             )'
        );
        $stmt->execute([
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'],
            's2_start_date' => $payload['s2_start_date'],
            'stage_start_date' => $payload['stage_start_date'],
            'stage_end_date' => $payload['stage_end_date'],
            'exam_regional_date' => $payload['exam_regional_date'],
        ]);

        return $this->current() ?: [];
    }
}
