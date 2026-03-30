<?php

require_once __DIR__ . '/../repositories/ReportRepository.php';
require_once __DIR__ . '/../core/HttpException.php';

class ReportService
{
    private const EXCEL_EXTENSION = 'xls';

    private PDO $db;
    private ReportRepository $reports;
    private ?array $headerAssets = null;

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
        $summary = [
            'Formateurs' => count($rows),
            'Heures planifiees' => round(array_sum(array_map(static fn(array $row): float => floatval($row['planned_hours'] ?? 0), $rows)), 2) . 'h',
            'Heures assignees' => round(array_sum(array_map(static fn(array $row): float => floatval($row['annual_hours'] ?? 0), $rows)), 2) . 'h',
            'Heures realisees' => round(array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows)), 2) . 'h',
        ];

        return $this->generate(
            'workload',
            $format,
            $this->reportTitle('Charge des enseignants'),
            $generatedBy,
            ['Formateur', 'Specialite', 'Modules', 'Seances planifiees', 'Heures planifiees', 'Charge annuelle', 'Heures realisees', 'Soumissions en attente'],
            array_map(static function (array $row): array {
                return [
                    $row['nom'],
                    $row['specialite'],
                    $row['modules'],
                    $row['planned_sessions'],
                    $row['planned_hours'] . 'h',
                    $row['annual_hours'] . 'h',
                    $row['completed_hours'] . 'h',
                    $row['pending_submissions'],
                ];
            }, $rows),
            $summary
        );
    }

    public function generateModuleProgress(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getModuleProgressRows(currentAcademicYear());

        return $this->generate(
            'module_progress',
            $format,
            $this->reportTitle('Progression des modules'),
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
            }, $rows),
            [
                'Modules' => count($rows),
                'Volume total' => round(array_sum(array_map(static fn(array $row): float => floatval($row['volume_horaire'] ?? 0), $rows)), 2) . 'h',
                'Heures realisees' => round(array_sum(array_map(static fn(array $row): float => floatval($row['completed_hours'] ?? 0), $rows)), 2) . 'h',
            ]
        );
    }

    public function generateAssignmentCoverage(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getAssignmentCoverageRows(currentAcademicYear());

        return $this->generate(
            'assignment_coverage',
            $format,
            $this->reportTitle('Couverture des affectations'),
            $generatedBy,
            ['Code', 'Module', 'Filiere', 'Semestre', 'Groupes', 'Volume', 'Formateur', 'Statut'],
            array_map(static function (array $row): array {
                return [
                    $row['code'],
                    $row['intitule'],
                    $row['filiere'],
                    $row['semestre'],
                    $row['groupes'],
                    $row['volume_horaire'] . 'h',
                    $row['formateur_nom'],
                    $row['statut'],
                ];
            }, $rows),
            [
                'Modules' => count($rows),
                'Affectes' => count(array_filter($rows, static fn(array $row): bool => ($row['statut'] ?? '') === 'Affecte')),
                'Libres' => count(array_filter($rows, static fn(array $row): bool => ($row['statut'] ?? '') === 'Libre')),
            ]
        );
    }

    public function generateValidationStatus(string $format, int $generatedBy): array
    {
        $rows = $this->reports->getValidationStatusRows();

        return $this->generate(
            'validation_status',
            $format,
            $this->reportTitle('Suivi des validations de planning'),
            $generatedBy,
            ['Formateur', 'Specialite', 'Semaine', 'Annee', 'Heures soumises', 'Statut', 'Soumis le', 'Traite le', 'Note'],
            array_map(static function (array $row): array {
                return [
                    $row['formateur_nom'],
                    $row['specialite'],
                    $row['semaine'],
                    $row['academic_year'],
                    $row['submitted_hours'] . 'h',
                    $row['status'],
                    $row['submitted_at'] ?: '-',
                    $row['processed_at'] ?: '-',
                    $row['decision_note'] !== '' ? $row['decision_note'] : '-',
                ];
            }, $rows),
            [
                'Soumissions' => count($rows),
                'En attente' => count(array_filter($rows, static fn(array $row): bool => ($row['status'] ?? '') === 'pending')),
                'Revision / rejet' => count(array_filter($rows, static fn(array $row): bool => in_array(($row['status'] ?? ''), ['revision', 'rejected'], true))),
            ]
        );
    }

    public function downloadable(int $reportId): array
    {
        $report = $this->reports->find($reportId);
        if (!$report) {
            throw new NotFoundException('Rapport introuvable.');
        }

        $absolutePath = dirname(__DIR__) . '/' . ltrim($report['file_path'], '/');
        $extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
        $contentType = match ($extension) {
            'pdf' => 'application/pdf',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls' => 'application/vnd.ms-excel',
            default => 'application/octet-stream',
        };

        return [
            'report' => $report,
            'absolute_path' => $absolutePath,
            'content_type' => $contentType,
            'download_name' => basename($absolutePath),
        ];
    }

    private function generate(
        string $type,
        string $format,
        string $title,
        int $generatedBy,
        array $headers,
        array $rows,
        array $summary = []
    ): array {
        $storageDir = dirname(__DIR__) . '/storage/reports';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0775, true);
        }

        $filename = $this->buildFilename($type, $format);
        $absolutePath = $storageDir . '/' . $filename;

        if ($format === 'pdf') {
            $this->writePdfReport($absolutePath, $title, $headers, $rows, $summary);
        } else {
            $this->writeExcelReport($absolutePath, $title, $headers, $rows, $summary);
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

    private function reportTitle(string $label): string
    {
        return 'CMC Casablanca - ' . $label;
    }

    private function writePdfReport(string $absolutePath, string $title, array $headers, array $rows, array $summary): void
    {
        $this->ensurePdfDependenciesAreAvailable();

        try {
            $data = $this->buildPdfData($title, $headers, $rows, $summary);
            $html = $this->buildPdfHtml($data);
            $dompdf = new \Dompdf\Dompdf();
            $dompdf->loadHtml($html, 'UTF-8');
            $dompdf->setPaper('A4', 'landscape');
            $dompdf->render();
            $contents = $dompdf->output();
        } catch (Throwable $exception) {
            throw new HttpException(500, 'La generation du PDF a echoue.');
        }

        if (@file_put_contents($absolutePath, $contents) === false) {
            throw new RuntimeException('Impossible d ecrire le fichier PDF du rapport.');
        }
    }

    private function writeExcelReport(string $absolutePath, string $title, array $headers, array $rows, array $summary): void
    {
        $data = $this->buildExcelData($title, $headers, $rows, $summary);
        $contents = $this->buildExcelSpreadsheetXml($data);
        if (@file_put_contents($absolutePath, $contents) === false) {
            throw new RuntimeException('Impossible d ecrire le fichier Excel du rapport.');
        }
    }

    private function ensurePdfDependenciesAreAvailable(): void
    {
        $autoloadPath = __DIR__ . '/../vendor/autoload.php';

        if (!is_file($autoloadPath)) {
            throw new HttpException(
                503,
                'Generation PDF indisponible en local. Installez les dependances Composer dans backend avant de demander un export PDF.'
            );
        }

        require_once $autoloadPath;

        if (!class_exists(\Dompdf\Dompdf::class)) {
            throw new HttpException(
                503,
                'Generation PDF indisponible car DomPDF n est pas disponible.'
            );
        }
    }

    private function buildPdfData(string $title, array $headers, array $rows, array $summary = []): array
    {
        return [
            'title' => $this->normalizeText($title, '-'),
            'generated_label' => 'Genere le ' . date('d/m/Y H:i'),
            'headers' => array_map(fn (string $header): string => $this->normalizeText($header, '-'), $headers),
            'rows' => array_map(function (array $row): array {
                $cells = [];
                foreach ($row as $cell) {
                    $cells[] = $this->normalizeCell($cell);
                }

                return $cells;
            }, $rows),
            'summary' => $this->normalizeSummary($summary),
        ];
    }

    private function buildPdfHtml(array $data): string
    {
        $head = implode('', array_map(fn (string $header): string => '<th>' . $this->escape($header) . '</th>', $data['headers']));
        $body = implode('', array_map(function (array $row): string {
            $cells = implode('', array_map(fn ($cell): string => '<td>' . $this->escape((string) $cell) . '</td>', $row));
            return '<tr>' . $cells . '</tr>';
        }, $data['rows']));

        return '<html><head><meta charset="UTF-8"><style>' .
            $this->buildSharedDocumentStyles() .
            '</style></head><body>' .
            $this->buildDocumentHeader($data['title'], 'Edition automatique du rapport pedagogique') .
            '<div class="report-meta">' . $this->escape($data['generated_label']) . '</div>' .
            $this->buildSummaryHtml($data['summary']) .
            '<table class="report-table"><thead><tr>' . $head . '</tr></thead><tbody>' . $body . '</tbody></table></body></html>';
    }

    private function buildExcelData(string $title, array $headers, array $rows, array $summary = []): array
    {
        $normalizedRows = [];
        foreach ($rows as $row) {
            $normalizedRows[] = array_map(fn ($cell): string => $this->normalizeCell($cell), $row);
        }

        $summaryRows = $this->buildExcelSummaryRows($normalizedRows, $summary);
        $planningRows = $this->buildExcelPlanningRows($normalizedRows);
        $totalRows = $this->buildExcelTotalRows($summary, $summaryRows, $planningRows);

        return [
            'title' => $this->normalizeText($title, '-'),
            'generated_label' => 'Genere le ' . date('d/m/Y H:i'),
            'sections' => [
                [
                    'title' => 'Trainer Summary',
                    'headers' => ['Formateur', 'Specialite', 'Modules', 'Charge annuelle', 'Soumissions en attente'],
                    'rows' => $summaryRows,
                ],
                [
                    'title' => 'Planning Repartition',
                    'headers' => ['Formateur', 'Seances planifiees', 'Heures planifiees', 'Heures realisees', 'Statut planning'],
                    'rows' => $planningRows,
                ],
                [
                    'title' => 'Totals',
                    'headers' => ['Indicateur', 'Valeur'],
                    'rows' => $totalRows,
                ],
            ],
        ];
    }

    private function buildExcelSpreadsheetXml(array $data): string
    {
        $xmlRows = [];
        $xmlRows[] = $this->buildSpreadsheetRow([$data['title']], 'title');
        $xmlRows[] = $this->buildSpreadsheetRow([$data['generated_label']], 'meta');
        $xmlRows[] = $this->buildSpreadsheetRow([], 'empty');

        foreach ($data['sections'] as $section) {
            $xmlRows[] = $this->buildSpreadsheetRow([$section['title']], 'section');
            $xmlRows[] = $this->buildSpreadsheetRow($section['headers'], 'header');

            foreach ($section['rows'] as $row) {
                $xmlRows[] = $this->buildSpreadsheetRow($row, 'data');
            }

            $xmlRows[] = $this->buildSpreadsheetRow([], 'empty');
        }

        return '<?xml version="1.0" encoding="UTF-8"?>' .
            '<?mso-application progid="Excel.Sheet"?>' .
            '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:x="urn:schemas-microsoft-com:office:excel"
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:html="http://www.w3.org/TR/REC-html40">' .
                '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">' .
                    '<Title>' . $this->escapeXml($data['title']) . '</Title>' .
                    '<Created>' . date('c') . '</Created>' .
                '</DocumentProperties>' .
                '<Styles>' .
                    '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/><Interior/><Borders/><NumberFormat/><Protection/></Style>' .
                    '<Style ss:ID="title"><Font ss:Bold="1" ss:Size="14"/><Alignment ss:Vertical="Center"/></Style>' .
                    '<Style ss:ID="meta"><Font ss:Italic="1" ss:Size="10"/></Style>' .
                    '<Style ss:ID="section"><Font ss:Bold="1" ss:Size="12"/><Interior ss:Color="#EEF4FB" ss:Pattern="Solid"/></Style>' .
                    '<Style ss:ID="summary"><Font ss:Bold="1"/></Style>' .
                    '<Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#DCEAF7" ss:Pattern="Solid"/></Style>' .
                    '<Style ss:ID="data"><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style>' .
                '</Styles>' .
                '<Worksheet ss:Name="Rapport">' .
                    '<Table>' . implode('', $xmlRows) . '</Table>' .
                '</Worksheet>' .
            '</Workbook>';
    }

    private function buildSharedDocumentStyles(): string
    {
        return '
            body{font-family:DejaVu Sans, Arial, sans-serif;font-size:12px;color:#000;margin:20px;background:#fff;}
            .report-header{border:3px solid #000;background:#fff;margin-bottom:18px;}
            .report-header-top{width:100%;border-collapse:collapse;table-layout:fixed;}
            .report-header-top td{height:86px;vertical-align:middle;text-align:center;}
            .report-header-logo-left{width:22%;border-right:3px solid #000;}
            .report-header-logo-right{width:22%;border-left:3px solid #000;}
            .report-header-logo-left img{width:62px;height:62px;object-fit:contain;}
            .report-header-logo-right img{width:66px;height:66px;object-fit:contain;}
            .report-header-org-ar{margin:0 0 2px 0;text-align:center;}
            .report-header-org-ar img{width:360px;height:auto;display:inline-block;}
            .report-header-org-fr{font-size:13px;font-weight:600;margin:2px 0 0 0;}
            .report-header-title{padding:10px 16px 6px;text-align:center;}
            .report-header-title h1{font-size:22px;font-weight:700;color:#3f7cc4;margin:0;}
            .report-header-title p{font-size:14px;font-weight:700;color:#f27424;margin:4px 0 0 0;}
            .report-header-meta{padding:0 16px 14px;}
            .report-header-meta table{width:100%;border-collapse:collapse;table-layout:fixed;}
            .report-header-meta td{vertical-align:middle;}
            .report-campus{font-size:12px;font-weight:700;text-transform:uppercase;line-height:1.5;}
            .report-campus p{margin:0;}
            .report-campus .report-campus-line{margin-top:2px;}
            .report-header-info{border:2px solid #000;padding:6px 10px;text-align:center;font-size:12px;font-weight:700;}
            .report-header-info-fill{background:#c7d9ec;}
            .report-meta{margin:14px 0 16px;font-size:11px;color:#5b6b83;}
            .report-summary{width:100%;border-collapse:collapse;margin:0 0 16px 0;}
            .report-summary td{border:1px solid #d7dfeb;padding:8px 10px;}
            .report-summary .report-summary-label{background:#f4f8fc;font-weight:700;color:#12385a;width:28%;}
            .report-table{width:100%;border-collapse:collapse;table-layout:auto;}
            .report-table th,.report-table td{border:1px solid #d7dfeb;padding:9px;text-align:left;vertical-align:top;}
            .report-table th{background:#edf4fb;color:#12385a;font-size:11px;font-weight:700;}
            .report-table tbody tr:nth-child(even){background:#f9fbfd;}
        ';
    }

    private function buildDocumentHeader(string $title, string $subtitle): string
    {
        $assets = $this->getHeaderAssets();

        $arabicHeader = $assets['arabic_header'] !== ''
            ? '<p class="report-header-org-ar"><img src="' . $assets['arabic_header'] . '" alt="مكتب التكوين المهني و إنعاش الشغل"></p>'
            : '<p class="report-header-org-ar" lang="ar" dir="rtl">مكتب التكوين المهني و إنعاش الشغل</p>';

        return '<div class="report-header">
            <table class="report-header-top">
                <tr>
                    <td class="report-header-logo-left"><img src="' . $assets['region_logo'] . '" alt="Casablanca Settat"></td>
                    <td>
                        ' . $arabicHeader . '
                        <p class="report-header-org-fr">Office de la formation professionnelle et</p>
                        <p class="report-header-org-fr">de la promotion du travail</p>
                    </td>
                    <td class="report-header-logo-right"><img src="' . $assets['ofppt_logo'] . '" alt="OFPPT"></td>
                </tr>
            </table>
            <div class="report-header-title">
                <h1>' . $this->escape($title) . '</h1>
                <p>' . $this->escape($subtitle) . '</p>
            </div>
            <div class="report-header-meta">
                <table>
                    <tr>
                        <td style="width:28%;" class="report-campus">
                            <p>DRRSK / CMC CASABLANCA</p>
                            <p class="report-campus-line">POLE : DIRECTION PEDAGOGIQUE</p>
                        </td>
                        <td style="width:44%;">
                            <table style="width:100%;border-collapse:collapse;">
                                <tr>
                                    <td class="report-header-info" style="width:40%;">Rapport institutionnel</td>
                                    <td class="report-header-info" style="width:36%;">Centre de Management de Casablanca</td>
                                    <td style="width:24%;text-align:center;font-size:12px;font-weight:700;">Edition 2025/2026</td>
                                </tr>
                            </table>
                        </td>
                        <td style="width:28%;text-align:right;">
                            <table style="display:inline-table;width:220px;border-collapse:collapse;">
                                <tr>
                                    <td class="report-header-info report-header-info-fill">Annee de formation</td>
                                </tr>
                                <tr>
                                    <td class="report-header-info">2025/2026</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </div>';
    }

    private function getHeaderAssets(): array
    {
        if ($this->headerAssets !== null) {
            return $this->headerAssets;
        }

        $basePath = dirname(__DIR__, 2) . '/frontend/src/style/photos/';

        $this->headerAssets = [
            'region_logo' => $this->imageToDataUri($basePath . 'Casablanca-Settat_VF.png'),
            'ofppt_logo' => $this->imageToDataUri($basePath . 'logo1 (1).png'),
            'arabic_header' => $this->imageToDataUri(dirname(__DIR__) . '/assets/report-header-ar.png'),
        ];

        return $this->headerAssets;
    }

    private function imageToDataUri(string $path): string
    {
        if (!is_file($path)) {
            return '';
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            return '';
        }

        $mimeType = function_exists('mime_content_type') ? mime_content_type($path) : 'image/png';
        if (!$mimeType) {
            $mimeType = 'image/png';
        }

        return 'data:' . $mimeType . ';base64,' . base64_encode($contents);
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function escapeXml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function buildSummaryHtml(array $summary): string
    {
        if ($summary === []) {
            return '';
        }

        $rows = '';
        foreach ($summary as $label => $value) {
            $rows .= '<tr><td class="report-summary-label">' . $this->escape((string) $label) . '</td><td>' . $this->escape((string) $value) . '</td></tr>';
        }

        return '<table class="report-summary"><tbody>' . $rows . '</tbody></table>';
    }

    private function buildSpreadsheetRow(array $cells, string $styleId): string
    {
        if ($cells === []) {
            return '<Row><Cell><Data ss:Type="String"></Data></Cell></Row>';
        }

        $xmlCells = '';
        foreach ($cells as $cell) {
            $xmlCells .= '<Cell ss:StyleID="' . $styleId . '"><Data ss:Type="String">' . $this->escapeXml((string) $cell) . '</Data></Cell>';
        }

        return '<Row>' . $xmlCells . '</Row>';
    }

    private function buildFilename(string $type, string $format): string
    {
        $date = date('Y-m-d');
        $base = $format === 'pdf' ? 'report_export_' . $date : 'planning_export_' . $date;
        $extension = $format === 'pdf' ? 'pdf' : self::EXCEL_EXTENSION;
        $storageDir = dirname(__DIR__) . '/storage/reports';
        $filename = $base . '.' . $extension;
        $counter = 2;

        while (is_file($storageDir . '/' . $filename)) {
            $filename = $base . '_' . $counter . '.' . $extension;
            $counter++;
        }

        return $filename;
    }

    private function normalizeSummary(array $summary): array
    {
        $normalized = [];
        foreach ($summary as $label => $value) {
            $normalized[$this->normalizeText((string) $label, '-')] = $this->normalizeCell($value);
        }

        return $normalized;
    }

    private function normalizeCell($value): string
    {
        if ($value === null || $value === '') {
            return '-';
        }

        if (is_float($value) || is_int($value)) {
            return (string) $value;
        }

        return $this->normalizeText((string) $value, '-');
    }

    private function normalizeText(string $value, string $default = '-'): string
    {
        $trimmed = trim($value);

        return $trimmed === '' ? $default : $trimmed;
    }

    private function buildExcelSummaryRows(array $rows, array $summary): array
    {
        $summaryRows = [];
        foreach ($rows as $row) {
            $summaryRows[] = [
                $row[0] ?? '-',
                $row[1] ?? '-',
                $row[2] ?? '-',
                $row[5] ?? '0h',
                $row[7] ?? '0',
            ];
        }

        if ($summaryRows !== []) {
            return $summaryRows;
        }

        return [[
            '-',
            '-',
            '-',
            '0h',
            '0',
        ]];
    }

    private function buildExcelPlanningRows(array $rows): array
    {
        $planningRows = [];
        foreach ($rows as $row) {
            $plannedHours = $row[4] ?? '0h';
            $completedHours = $row[6] ?? '0h';
            $planningRows[] = [
                $row[0] ?? '-',
                $row[3] ?? '0',
                $plannedHours,
                $completedHours,
                $plannedHours === '0h' ? 'Aucun planning' : 'Planifie',
            ];
        }

        if ($planningRows !== []) {
            return $planningRows;
        }

        return [[
            '-',
            '0',
            '0h',
            '0h',
            'Aucun planning',
        ]];
    }

    private function buildExcelTotalRows(array $summary, array $summaryRows, array $planningRows): array
    {
        $totalRows = [];
        foreach ($this->normalizeSummary($summary) as $label => $value) {
            $totalRows[] = [$label, $value];
        }

        if ($totalRows === []) {
            $totalRows[] = ['Formateurs', (string) count($summaryRows)];
            $totalRows[] = ['Heures planifiees', $this->sumHourColumn($planningRows, 2)];
            $totalRows[] = ['Heures realisees', $this->sumHourColumn($planningRows, 3)];
        }

        return $totalRows;
    }

    private function sumHourColumn(array $rows, int $index): string
    {
        $total = 0.0;
        foreach ($rows as $row) {
            $value = preg_replace('/[^0-9.]+/', '', (string) ($row[$index] ?? '0'));
            $total += floatval($value ?: '0');
        }

        return round($total, 2) . 'h';
    }
}
