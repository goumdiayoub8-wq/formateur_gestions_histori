<?php

require_once __DIR__ . '/../repositories/AcademicConfigRepository.php';
require_once __DIR__ . '/../core/HttpException.php';

class AcademicConfigService
{
    private AcademicConfigRepository $repository;

    public function __construct(PDO $db)
    {
        $this->repository = new AcademicConfigRepository($db);
    }

    private function validateDateString(?string $value, string $label): string
    {
        if ($value === null || trim($value) === '') {
            throw new ValidationException("Le champ {$label} est obligatoire.");
        }

        $normalized = trim($value);
        $date = DateTime::createFromFormat('Y-m-d', $normalized);

        if (!$date || $date->format('Y-m-d') !== $normalized) {
            throw new ValidationException("Le champ {$label} doit etre une date valide au format YYYY-MM-DD.");
        }

        return $normalized;
    }

    private function validateBusinessRules(array $payload): void
    {
        $start = strtotime($payload['start_date']);
        $s2 = strtotime($payload['s2_start_date']);
        $end = strtotime($payload['end_date']);
        $stageStart = strtotime($payload['stage_start_date']);
        $stageEnd = strtotime($payload['stage_end_date']);
        $exam = strtotime($payload['exam_regional_date']);

        if (!($start < $s2 && $s2 < $end)) {
            throw new ValidationException('Les dates doivent respecter: debut < S2 < fin.');
        }

        if (!($s2 <= $stageStart && $stageStart <= $stageEnd && $stageEnd <= $end)) {
            throw new ValidationException('La periode de stage doit etre comprise dans le semestre S2.');
        }

        if (!($s2 <= $exam && $exam <= $end)) {
            throw new ValidationException("La date d'examen regional doit etre comprise dans le semestre S2.");
        }
    }

    private function enrich(array $row): array
    {
        $startYear = intval(date('Y', strtotime($row['start_date'])));
        $endYear = intval(date('Y', strtotime($row['end_date'])));

        return [
            'id' => intval($row['id'] ?? 0),
            'start_date' => $row['start_date'],
            'end_date' => $row['end_date'],
            's2_start_date' => $row['s2_start_date'],
            'stage_start_date' => $row['stage_start_date'],
            'stage_end_date' => $row['stage_end_date'],
            'exam_regional_date' => $row['exam_regional_date'],
            'academic_year_label' => sprintf('%d-%d', $startYear, $endYear),
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }

    public function current(): ?array
    {
        $row = $this->repository->current();

        return $row ? $this->enrich($row) : null;
    }

    public function save(array $payload): array
    {
        $sanitized = [
            'start_date' => $this->validateDateString($payload['start_date'] ?? null, 'date de debut'),
            'end_date' => $this->validateDateString($payload['end_date'] ?? null, 'date de fin'),
            's2_start_date' => $this->validateDateString($payload['s2_start_date'] ?? null, 'date de debut S2'),
            'stage_start_date' => $this->validateDateString($payload['stage_start_date'] ?? null, 'date de debut de stage'),
            'stage_end_date' => $this->validateDateString($payload['stage_end_date'] ?? null, 'date de fin de stage'),
            'exam_regional_date' => $this->validateDateString($payload['exam_regional_date'] ?? null, 'date examen regional'),
        ];

        $this->validateBusinessRules($sanitized);

        return $this->enrich($this->repository->upsert($sanitized));
    }
}
