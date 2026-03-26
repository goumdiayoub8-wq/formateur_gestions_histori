<?php

class SmartAssignmentReason
{
    public function __construct(
        private float $competenceScore,
        private float $availabilityScore,
        private float $experienceScore,
        private int $competenceLevel,
        private float $remainingHours,
        private int $experienceCount
    ) {
    }

    public function toArray(): array
    {
        return [
            'weights' => [
                'competence_level' => 50,
                'availability' => 30,
                'experience' => 20,
            ],
            'components' => [
                'competence_level' => round($this->competenceScore, 2),
                'availability' => round($this->availabilityScore, 2),
                'experience' => round($this->experienceScore, 2),
            ],
            'details' => [
                'competence_level' => $this->competenceLevel,
                'remaining_hours' => round($this->remainingHours, 2),
                'experience_count' => $this->experienceCount,
            ],
        ];
    }
}
