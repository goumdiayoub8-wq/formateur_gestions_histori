<?php

class SmartAssignmentCandidate
{
    public function __construct(
        private int $id,
        private string $name,
        private string $specialite,
        private array $modules,
        private float $remainingHours,
        private float $score,
        private string $badge,
        private array $reason
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'specialite' => $this->specialite,
            'modules' => $this->modules,
            'heures_restantes' => round($this->remainingHours, 2),
            'score' => round($this->score, 2),
            'badge' => $this->badge,
            'reason' => $this->reason,
        ];
    }
}
