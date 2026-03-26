<?php

require_once __DIR__ . '/../services/ReportService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class ReportController
{
    private ReportService $reports;

    public function __construct(PDO $db)
    {
        $this->reports = new ReportService($db);
    }

    public function recent(): void
    {
        $rows = $this->reports->recent();

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'reports' => $rows,
        ]);
    }

    public function generateWorkload(): void
    {
        $payload = readJsonBody();
        $format = InputValidator::oneOf($payload, 'format', 'format', ['pdf', 'xlsx']);
        $report = $this->reports->generateWorkload($format, currentUserId() ?? requireAuthentication());

        jsonResponse([
            'status' => 'success',
            'message' => 'Rapport charge enseignants genere.',
            'data' => $report,
            'report' => $report,
        ], 201);
    }

    public function generateModuleProgress(): void
    {
        $payload = readJsonBody();
        $format = InputValidator::oneOf($payload, 'format', 'format', ['pdf', 'xlsx']);
        $report = $this->reports->generateModuleProgress($format, currentUserId() ?? requireAuthentication());

        jsonResponse([
            'status' => 'success',
            'message' => 'Rapport progression modules genere.',
            'data' => $report,
            'report' => $report,
        ], 201);
    }

    public function download(): void
    {
        $reportId = InputValidator::integer(['id' => requestQuery('id')], 'id', 'rapport', true, 1);
        $report = $this->reports->downloadable($reportId);

        if (!is_file($report['absolute_path'])) {
            throw new NotFoundException('Le fichier du rapport est introuvable.');
        }

        header('Content-Type: ' . $report['content_type']);
        header('Content-Length: ' . filesize($report['absolute_path']));
        header('Content-Disposition: attachment; filename="' . basename($report['absolute_path']) . '"');
        readfile($report['absolute_path']);
        exit();
    }
}
