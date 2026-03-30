<?php

require_once __DIR__ . '/../services/ReportService.php';

use PHPUnit\Framework\TestCase;

final class ReportExportTest extends TestCase
{
    private PDO $db;
    private ReportService $reports;
    private array $generatedFiles = [];

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        $this->db->beginTransaction();
        $this->reports = new ReportService($this->db);
    }

    protected function tearDown(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }

        foreach ($this->generatedFiles as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }

    public function testExcelExportCreatesValidSpreadsheetFile(): void
    {
        $report = $this->reports->generateWorkload('xlsx', $this->existingUserId());
        $download = $this->reports->downloadable(intval($report['id']));
        $this->generatedFiles[] = $download['absolute_path'];
        $contents = file_get_contents($download['absolute_path']);

        self::assertNotFalse($contents);
        self::assertStringEndsWith('.xls', $download['absolute_path']);
        self::assertMatchesRegularExpression('/planning_export_\d{4}-\d{2}-\d{2}(_\d+)?\.xls$/', basename($download['absolute_path']));
        self::assertSame('application/vnd.ms-excel', $download['content_type']);
        self::assertStringContainsString('<?xml version="1.0" encoding="UTF-8"?>', $contents);
        self::assertStringContainsString('<?mso-application progid="Excel.Sheet"?>', $contents);
        self::assertStringContainsString('Trainer Summary', $contents);
        self::assertStringContainsString('Planning Repartition', $contents);
        self::assertStringContainsString('Totals', $contents);
        self::assertStringContainsString('Heures planifiees', $contents);
        self::assertStringContainsString('Formateur', $contents);
    }

    public function testPdfExportCreatesDownloadablePdfWithoutServerError(): void
    {
        $autoloadPath = __DIR__ . '/../vendor/autoload.php';
        if (!is_file($autoloadPath)) {
            self::markTestSkipped('Vendor Composer indisponible pour le test PDF.');
        }

        require_once $autoloadPath;
        if (!class_exists(\Dompdf\Dompdf::class)) {
            self::markTestSkipped('Dompdf indisponible pour le test PDF.');
        }

        $report = $this->reports->generateModuleProgress('pdf', $this->existingUserId());
        $download = $this->reports->downloadable(intval($report['id']));
        $this->generatedFiles[] = $download['absolute_path'];
        $handle = fopen($download['absolute_path'], 'rb');
        $signature = $handle !== false ? fread($handle, 4) : false;
        if ($handle !== false) {
            fclose($handle);
        }

        self::assertSame('application/pdf', $download['content_type']);
        self::assertStringEndsWith('.pdf', $download['absolute_path']);
        self::assertMatchesRegularExpression('/report_export_\d{4}-\d{2}-\d{2}(_\d+)?\.pdf$/', basename($download['absolute_path']));
        self::assertSame('%PDF', $signature);
    }

    public function testExcelExportHandlesTrainerWithoutPlanning(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, :max_heures, :current_hours, :weekly_hours)'
        );
        $stmt->execute([
            'nom' => 'No Planning ' . $suffix,
            'email' => 'noplanning.' . $suffix . '@example.com',
            'telephone' => '+212600' . substr(md5($suffix), 0, 6),
            'specialite' => '',
            'max_heures' => 910,
            'current_hours' => 0,
            'weekly_hours' => 0,
        ]);

        $report = $this->reports->generateWorkload('xlsx', $this->existingUserId());
        $download = $this->reports->downloadable(intval($report['id']));
        $this->generatedFiles[] = $download['absolute_path'];
        $contents = file_get_contents($download['absolute_path']);

        self::assertNotFalse($contents);
        self::assertStringContainsString('No Planning ' . $suffix, $contents);
        self::assertStringContainsString('Aucun planning', $contents);
        self::assertStringContainsString('0h', $contents);
    }

    private function existingUserId(): int
    {
        $stmt = $this->db->query('SELECT id FROM utilisateurs ORDER BY id ASC LIMIT 1');
        $value = $stmt->fetchColumn();

        if ($value === false) {
            self::fail('Aucun utilisateur disponible pour generer un rapport.');
        }

        return intval($value);
    }
}
