<?php

require_once __DIR__ . '/../repositories/ModuleRepository.php';
require_once __DIR__ . '/../repositories/DashboardRepository.php';
require_once __DIR__ . '/../repositories/ReportRepository.php';

use PHPUnit\Framework\TestCase;

final class ProgressionExecutionTest extends TestCase
{
    private PDO $db;
    private ModuleRepository $modules;
    private DashboardRepository $dashboard;
    private ReportRepository $reports;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        $this->db->beginTransaction();

        $this->modules = new ModuleRepository($this->db);
        $this->dashboard = new DashboardRepository($this->db);
        $this->reports = new ReportRepository($this->db);
    }

    protected function tearDown(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
    }

    public function testAssigningModuleDoesNotIncreaseProgress(): void
    {
        $fixture = $this->createBaseFixture();

        $moduleRow = $this->findModuleProgressRow($fixture['module_id']);
        $trainerKpis = $this->dashboard->getTrainerKpis($fixture['formateur_id'], 10, 2026);
        $reportRow = $this->findReportProgressRow($fixture['module_id']);

        self::assertSame(0.0, floatval($moduleRow['completed_hours']));
        self::assertSame(0, intval($moduleRow['progress_percent']));
        self::assertSame(0.0, floatval($trainerKpis['annual_completed_hours'] ?? 0));
        self::assertSame(0.0, floatval($reportRow['completed_hours']));
    }

    public function testFutureSessionDoesNotIncreaseProgress(): void
    {
        $fixture = $this->createBaseFixture();
        $this->insertSession(
            $fixture['formateur_id'],
            $fixture['module_id'],
            14,
            date('Y-m-d', strtotime('+7 days')),
            'done'
        );

        $moduleRow = $this->findModuleProgressRow($fixture['module_id']);
        $trainerKpis = $this->dashboard->getTrainerKpis($fixture['formateur_id'], 14, 2026);

        self::assertSame(0.0, floatval($moduleRow['completed_hours']));
        self::assertSame(0, intval($moduleRow['progress_percent']));
        self::assertSame(0.0, floatval($trainerKpis['annual_completed_hours'] ?? 0));
    }

    public function testPastSessionIncreasesProgress(): void
    {
        $fixture = $this->createBaseFixture();
        $this->insertSession(
            $fixture['formateur_id'],
            $fixture['module_id'],
            12,
            date('Y-m-d', strtotime('-1 day')),
            'done'
        );

        $moduleRow = $this->findModuleProgressRow($fixture['module_id']);
        $assignedModule = $this->findAssignedModuleRow($fixture['formateur_id'], $fixture['module_id']);
        $reportRow = $this->findReportProgressRow($fixture['module_id']);

        self::assertSame(2.0, floatval($moduleRow['completed_hours']));
        self::assertSame(20, intval($moduleRow['progress_percent']));
        self::assertSame(2.0, floatval($assignedModule['completed_hours']));
        self::assertSame(20, intval($assignedModule['progress_percent']));
        self::assertSame(2.0, floatval($reportRow['completed_hours']));
    }

    public function testCancelledSessionIsIgnoredCompletely(): void
    {
        $fixture = $this->createBaseFixture();
        $this->insertSession(
            $fixture['formateur_id'],
            $fixture['module_id'],
            12,
            date('Y-m-d', strtotime('-1 day')),
            'cancelled'
        );

        $moduleRow = $this->findModuleProgressRow($fixture['module_id']);
        $trainerKpis = $this->dashboard->getTrainerKpis($fixture['formateur_id'], 12, 2026);
        $reportRow = $this->findReportProgressRow($fixture['module_id']);

        self::assertSame(0.0, floatval($moduleRow['completed_hours']));
        self::assertSame(0, intval($moduleRow['progress_percent']));
        self::assertSame(0.0, floatval($trainerKpis['annual_completed_hours'] ?? 0));
        self::assertSame(0.0, floatval($reportRow['completed_hours']));
    }

    public function testMissingExecutionDateIsIgnoredSafely(): void
    {
        $fixture = $this->createBaseFixture();
        $this->insertSession(
            $fixture['formateur_id'],
            $fixture['module_id'],
            12,
            null,
            'done'
        );

        $moduleRow = $this->findModuleProgressRow($fixture['module_id']);
        $trainerKpis = $this->dashboard->getTrainerKpis($fixture['formateur_id'], 12, 2026);

        self::assertSame(0.0, floatval($moduleRow['completed_hours']));
        self::assertSame(0, intval($moduleRow['progress_percent']));
        self::assertSame(0.0, floatval($trainerKpis['annual_completed_hours'] ?? 0));
    }

    private function findModuleProgressRow(int $moduleId): array
    {
        foreach ($this->modules->progressList(['annee' => 2026, 'module_id' => $moduleId]) as $row) {
            if (intval($row['id'] ?? 0) === $moduleId) {
                return $row;
            }
        }

        self::fail('Ligne de progression module introuvable.');
    }

    private function findAssignedModuleRow(int $formateurId, int $moduleId): array
    {
        foreach ($this->dashboard->getTrainerAssignedModules($formateurId, 2026, 12) as $row) {
            if (intval($row['id'] ?? 0) === $moduleId) {
                return $row;
            }
        }

        self::fail('Module affecte introuvable.');
    }

    private function findReportProgressRow(int $moduleId): array
    {
        foreach ($this->reports->getModuleProgressRows(2026) as $row) {
            if (intval($row['id'] ?? 0) === $moduleId) {
                return $row;
            }
        }

        self::fail('Ligne de rapport progression introuvable.');
    }

    private function createBaseFixture(): array
    {
        $suffix = bin2hex(random_bytes(4));
        $formateurId = $this->insertFormateur($suffix);
        $moduleId = $this->insertModule($suffix);
        $this->insertAffectation($formateurId, $moduleId);

        return [
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
        ];
    }

    private function insertFormateur(string $suffix): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, :max_heures, :current_hours, :weekly_hours)'
        );
        $stmt->execute([
            'nom' => 'Progress Formateur ' . $suffix,
            'email' => 'progress.' . $suffix . '@example.com',
            'telephone' => '+212622' . substr($suffix, 0, 6),
            'specialite' => 'Suivi execution',
            'max_heures' => 910,
            'current_hours' => 0,
            'weekly_hours' => 10,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertModule(string $suffix): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO modules (code, intitule, filiere, semestre, volume_horaire, has_efm)
             VALUES (:code, :intitule, :filiere, :semestre, :volume_horaire, :has_efm)'
        );
        $stmt->execute([
            'code' => 'PRG-' . strtoupper($suffix),
            'intitule' => 'Module Progression ' . $suffix,
            'filiere' => 'Informatique',
            'semestre' => 'S2',
            'volume_horaire' => 10,
            'has_efm' => 0,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertAffectation(int $formateurId, int $moduleId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO affectations (formateur_id, module_id, annee)
             VALUES (:formateur_id, :module_id, :annee)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'annee' => 2026,
        ]);
    }

    private function insertSession(
        int $formateurId,
        int $moduleId,
        int $weekNumber,
        ?string $sessionDate,
        string $status = 'done'
    ): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO planning_sessions (
                formateur_id,
                module_id,
                groupe_id,
                salle_id,
                week_number,
                week_start_date,
                week_end_date,
                day_of_week,
                start_time,
                end_time,
                session_date,
                status,
                task_title,
                task_description
             ) VALUES (
                :formateur_id,
                :module_id,
                NULL,
                NULL,
                :week_number,
                :week_start_date,
                :week_end_date,
                :day_of_week,
                :start_time,
                :end_time,
                :session_date,
                :status,
                :task_title,
                :task_description
             )'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'week_number' => $weekNumber,
            'week_start_date' => $sessionDate,
            'week_end_date' => $sessionDate,
            'day_of_week' => 1,
            'start_time' => '08:00:00',
            'end_time' => '10:00:00',
            'session_date' => $sessionDate,
            'status' => $status,
            'task_title' => 'Cours',
            'task_description' => 'Session test progression',
        ]);
    }
}
