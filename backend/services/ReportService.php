<?php

require_once __DIR__ . '/../repositories/ReportRepository.php';
require_once __DIR__ . '/../core/HttpException.php';

class ReportService
{
    private PDO $db;
    private ReportRepository $reports;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->reports = new ReportRepository($db);
    }

    public function recent(): array
    {
        return $this->reports->recent();
    }

    public function generateWorkload(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getWorkloadRows(currentAcademicYear());

        return $this->generate(
            'workload',
            $format,
            'Rapport charge enseignants',
            $generatedBy,
            ['Formateur', 'Specialite', 'Modules', 'Charge annuelle', 'Heures realisees', 'Soumissions en attente'],
            array_map(static function (array $row): array {
                return [
                    $row['nom'],
                    $row['specialite'],
                    $row['modules'],
                    $row['annual_hours'] . 'h',
                    $row['completed_hours'] . 'h',
                    $row['pending_submissions'],
                ];
            }, $rows)
        );
    }

    public function generateModuleProgress(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getModuleProgressRows(currentAcademicYear());

        return $this->generate(
            'module_progress',
            $format,
            'Rapport progression modules',
            $generatedBy,
            ['Code', 'Module', 'Filiere', 'Formateur', 'Groupes', 'Heures', 'Realisees', 'Progression'],
            array_map(static function (array $row): array {
                return [
                    $row['code'],
                    $row['intitule'],
                    $row['filiere'],
                    $row['formateur_nom'],
                    $row['groupes'],
                    $row['volume_horaire'] . 'h',
                    $row['completed_hours'] . 'h',
                    $row['progress_percent'] . '%',
                ];
            }, $rows)
        );
    }

    public function downloadable(int $reportId): array
    {
        $report = $this->reports->find($reportId);
        if (!$report) {
            throw new NotFoundException('Rapport introuvable.');
        }

        $absolutePath = dirname(__DIR__) . '/' . ltrim($report['file_path'], '/');
        $contentType = $report['format'] === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.ms-excel';

        return [
            'report' => $report,
            'absolute_path' => $absolutePath,
            'content_type' => $contentType,
        ];
    }

    private function generate(
        string $type,
        string $format,
        string $title,
        int $generatedBy,
        array $headers,
        array $rows
    ): array {
        $storageDir = dirname(__DIR__) . '/storage/reports';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0775, true);
        }

        require_once __DIR__ . '/../vendor/autoload.php';

        $filename = sprintf('%s_%s.%s', $type, date('Ymd_His'), $format === 'pdf' ? 'pdf' : 'xls');
        $absolutePath = $storageDir . '/' . $filename;

        if ($format === 'pdf') {
            if (!class_exists(\Dompdf\Dompdf::class)) {
                throw new RuntimeException('DomPDF n est pas disponible.');
            }

            $html = $this->buildPdfHtml($title, $headers, $rows);
            $dompdf = new \Dompdf\Dompdf();
            $dompdf->loadHtml($html, 'UTF-8');
            $dompdf->setPaper('A4', 'landscape');
            $dompdf->render();
            file_put_contents($absolutePath, $dompdf->output());
        } else {
            file_put_contents($absolutePath, $this->buildExcelHtml($title, $headers, $rows));
        }

        $relativePath = 'storage/reports/' . $filename;
        $reportId = $this->reports->create([
            'type' => $type,
            'format' => $format,
            'title' => $title,
            'file_path' => $relativePath,
            'generated_by' => $generatedBy,
        ]);

        $report = $this->reports->find($reportId);
        if (!$report) {
            throw new RuntimeException('Rapport genere mais introuvable en base.');
        }

        return $report;
    }

    private function buildPdfHtml(string $title, array $headers, array $rows): string
    {
        $head = implode('', array_map(static fn (string $header): string => '<th>' . htmlspecialchars($header, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</th>', $headers));
        $body = implode('', array_map(static function (array $row): string {
            $cells = implode('', array_map(static fn ($cell): string => '<td>' . htmlspecialchars((string) $cell, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</td>', $row));
            return '<tr>' . $cells . '</tr>';
        }, $rows));

        return '<html><head><meta charset="UTF-8"><style>
            body{font-family: DejaVu Sans, sans-serif; font-size:12px; color:#1f2937;}
            h1{font-size:20px; margin-bottom:16px;}
            table{width:100%; border-collapse:collapse;}
            th,td{border:1px solid #d1d5db; padding:8px; text-align:left; vertical-align:top;}
            th{background:#eef2ff;}
        </style></head><body><h1>' .
            htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') .
            '</h1><table><thead><tr>' . $head . '</tr></thead><tbody>' . $body . '</tbody></table></body></html>';
    }

    private function buildExcelHtml(string $title, array $headers, array $rows): string
    {
        $head = implode('', array_map(static fn (string $header): string => '<th>' . htmlspecialchars($header, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</th>', $headers));
        $body = implode('', array_map(static function (array $row): string {
            $cells = implode('', array_map(static fn ($cell): string => '<td>' . htmlspecialchars((string) $cell, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</td>', $row));
            return '<tr>' . $cells . '</tr>';
        }, $rows));

        return "\xEF\xBB\xBF" . '<html><head><meta charset="UTF-8"><style>
            table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;}
            th,td{border:1px solid #d1d5db;padding:8px;text-align:left;}
            th{background:#eef2ff;font-weight:bold;}
            h1{font-family:Arial,sans-serif;font-size:18px;}
        </style></head><body><h1>' .
            htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') .
            '</h1><table><thead><tr>' . $head . '</tr></thead><tbody>' . $body . '</tbody></table></body></html>';
    }
}
