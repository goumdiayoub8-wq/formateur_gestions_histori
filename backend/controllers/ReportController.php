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

    public function generateAssignmentCoverage(): void
    {
        $payload = readJsonBody();
        $format = InputValidator::oneOf($payload, 'format', 'format', ['pdf', 'xlsx']);
        $report = $this->reports->generateAssignmentCoverage($format, currentUserId() ?? requireAuthentication());

        jsonResponse([
            'status' => 'success',
            'message' => 'Rapport couverture des affectations genere.',
            'data' => $report,
            'report' => $report,
        ], 201);
    }

    public function generateValidationStatus(): void
    {
        $payload = readJsonBody();
        $format = InputValidator::oneOf($payload, 'format', 'format', ['pdf', 'xlsx']);
        $report = $this->reports->generateValidationStatus($format, currentUserId() ?? requireAuthentication());

        jsonResponse([
            'status' => 'success',
            'message' => 'Rapport validation planning genere.',
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

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        $downloadName = $report['download_name'] ?? basename($report['absolute_path']);
        $asciiName = preg_replace('/[^A-Za-z0-9._-]/', '_', $downloadName) ?: 'rapport';

        header('Content-Type: ' . $report['content_type']);
        header('Content-Length: ' . filesize($report['absolute_path']));
        header('Content-Disposition: attachment; filename="' . $asciiName . '"; filename*=UTF-8\'\'' . rawurlencode($downloadName));
        header('Content-Transfer-Encoding: binary');
        header('Cache-Control: private, must-revalidate');
        header('Pragma: public');
        header('Expires: 0');
        header('X-Content-Type-Options: nosniff');

        if (readfile($report['absolute_path']) === false) {
            throw new RuntimeException('Le telechargement du rapport a echoue.');
        }

        exit();
    }
}
