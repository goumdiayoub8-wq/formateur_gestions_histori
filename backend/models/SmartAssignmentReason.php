<?php

class SmartAssignmentReason
{
    public function __construct(
        private float $questionnaireScore,
        private float $competenceScore,
        private float $availabilityScore,
        private float $experienceScore,
        private int $competenceLevel,
        private float $remainingHours,
        private int $experienceCount,
        private float $currentWeekHours,
        private float $projectedWeeklyHours,
        private float $weeklyTargetHours
    ) {
    }

    public function toArray(): array
    {
        return [
            'weights' => [
                'questionnaire_score' => 40,
                'availability' => 35,
                'competence_level' => 15,
                'experience' => 10,
            ],
            'components' => [
                'questionnaire_score' => $this->normalizePercent($this->questionnaireScore),
                'competence_level' => $this->normalizePercent($this->competenceScore),
                'availability' => $this->normalizePercent($this->availabilityScore),
                'experience' => $this->normalizePercent($this->experienceScore),
            ],
            'details' => [
                'competence_level' => max(1, min(5, intval($this->competenceLevel))),
                'remaining_hours' => $this->normalizeHours($this->remainingHours),
                'experience_count' => max(0, intval($this->experienceCount)),
                'current_week_hours' => $this->normalizeHours($this->currentWeekHours),
                'projected_weekly_hours' => $this->normalizeHours($this->projectedWeeklyHours),
                'weekly_target_hours' => $this->normalizeHours($this->weeklyTargetHours),
            ],
        ];
    }

    private function normalizePercent(float $value): float
    {
        return round(max(0.0, min(100.0, $value)), 2);
    }

    private function normalizeHours(float $value): float
    {
        return round(max(0.0, $value), 2);
    }
}
