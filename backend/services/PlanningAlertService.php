<?php

require_once __DIR__ . '/../core/helpers.php';

class PlanningAlertService
{
    private const FORMATEUR_ALERT_LABEL = 'Planning incomplet';
    private const CHEF_ALERT_LABEL = 'Alerte planning equipe';

    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function detectIncompleteFormateurs(array $matrix): array
    {
        $rows = is_array($matrix['rows'] ?? null) ? $matrix['rows'] : [];
        $incomplete = [];

        foreach ($rows as $row) {
            $missingWeeks = array_values(array_filter(array_map(
                'intval',
                $row['incomplete_weeks'] ?? []
            ), static fn (int $week): bool => $week >= VALIDATION_START_WEEK && $week <= SYSTEM_WEEK_MAX));
            if ($missingWeeks === []) {
                continue;
            }

            $weeklyTarget = round(floatval($row['weekly_target_hours'] ?? 0), 2);
            $incomplete[] = [
                'formateur_id' => intval($row['formateur_id'] ?? 0),
                'formateur_nom' => $row['formateur_nom'] ?? '',
                'missing_weeks' => $missingWeeks,
                'incomplete_range' => formatWeekRangeLabel($missingWeeks),
                'missing_weeks_count' => count($missingWeeks),
                'total_missing_hours' => round($weeklyTarget * count($missingWeeks), 2),
            ];
        }

        return $incomplete;
    }

    public function notifyFormateurs(array $data): void
    {
        $insert = $this->db->prepare(
            'INSERT INTO recent_activities (formateur_id, module_id, action_label, action_tone, action_description)
             VALUES (:formateur_id, NULL, :action_label, :action_tone, :action_description)'
        );

        foreach ($data as $row) {
            $formateurId = intval($row['formateur_id'] ?? 0);
            if ($formateurId <= 0) {
                continue;
            }

            $description = $this->truncateDescription(
                sprintf(
                    'Vous n avez pas complete le planning assigne pour les semaines : %s.',
                    ($row['incomplete_range'] ?? '') !== ''
                        ? $row['incomplete_range']
                        : implode(', ', array_map('strval', $row['missing_weeks'] ?? []))
                )
            );

            if ($this->hasRecentNotification($formateurId, self::FORMATEUR_ALERT_LABEL, $description)) {
                continue;
            }

            $insert->execute([
                'formateur_id' => $formateurId,
                'action_label' => self::FORMATEUR_ALERT_LABEL,
                'action_tone' => 'warning',
                'action_description' => $description,
            ]);
        }
    }

    public function notifyChefPole(array $summary): void
    {
        if ($summary === []) {
            return;
        }

        $parts = array_map(static function (array $row): string {
            return sprintf(
                '%s (%s semaines)',
                $row['formateur_nom'] ?? ('#' . intval($row['formateur_id'] ?? 0)),
                intval($row['missing_weeks_count'] ?? 0)
            );
        }, array_slice($summary, 0, 5));

        $description = 'Travail manquant detecte : ' . implode(', ', $parts) . '.';
        if (count($summary) > 5) {
            $description .= ' +' . (count($summary) - 5) . ' autres.';
        }
        $description = $this->truncateDescription($description);

        if ($this->hasRecentNotification(null, self::CHEF_ALERT_LABEL, $description)) {
            return;
        }

        $insert = $this->db->prepare(
            'INSERT INTO recent_activities (formateur_id, module_id, action_label, action_tone, action_description)
             VALUES (NULL, NULL, :action_label, :action_tone, :action_description)'
        );
        $insert->execute([
            'action_label' => self::CHEF_ALERT_LABEL,
            'action_tone' => 'warning',
            'action_description' => $description,
        ]);
    }

    private function hasRecentNotification(?int $formateurId, string $label, string $description): bool
    {
        if ($formateurId !== null) {
            $stmt = $this->db->prepare(
                'SELECT 1
                 FROM recent_activities
                 WHERE formateur_id = :formateur_id
                   AND action_label = :action_label
                   AND action_description = :action_description
                   AND created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
                 LIMIT 1'
            );
            $stmt->execute([
                'formateur_id' => $formateurId,
                'action_label' => $label,
                'action_description' => $description,
            ]);

            return (bool) $stmt->fetchColumn();
        }

        $stmt = $this->db->prepare(
            'SELECT 1
             FROM recent_activities
             WHERE formateur_id IS NULL
               AND action_label = :action_label
               AND action_description = :action_description
               AND created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
             LIMIT 1'
        );
        $stmt->execute([
            'action_label' => $label,
            'action_description' => $description,
        ]);

        return (bool) $stmt->fetchColumn();
    }

    private function truncateDescription(string $description): string
    {
        $description = trim($description);
        if (strlen($description) <= 255) {
            return $description;
        }

        return substr($description, 0, 252) . '...';
    }
}
