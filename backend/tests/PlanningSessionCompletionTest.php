<?php

require_once __DIR__ . '/../services/PlanningService.php';
require_once __DIR__ . '/../repositories/DashboardRepository.php';
require_once __DIR__ . '/../repositories/ModuleRepository.php';
require_once __DIR__ . '/../repositories/ReportRepository.php';

use PHPUnit\Framework\TestCase;

final class PlanningSessionCompletionTest extends TestCase
{
    private PDO $db;
    private PlanningService $planning;
    private DashboardRepository $dashboard;
    private ModuleRepository $modules;
    private ReportRepository $reports;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        $this->db->beginTransaction();

        $this->planning = new PlanningService($this->db);
        $this->dashboard = new DashboardRepository($this->db);
        $this->modules = new ModuleRepository($this->db);
        $this->reports = new ReportRepository($this->db);
    }

    protected function tearDown(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
    }

    public function testCompletingScheduledSessionUpdatesProgressionWithoutChangingPlannedHours(): void
    {
        $fixture = $this->createBaseFixture();
        $sessionDate = date('Y-m-d', strtotime('-1 day'));
        $sessionId = $this->insertSession($fixture['formateur_id'], $fixture['module_id'], 26, $sessionDate, 'scheduled');
        $this->insertSubmission($fixture['formateur_id'], 26, 2026, 'approved', 2.0);

        $beforeReport = $this->findWorkloadRow($fixture['formateur_id']);
        self::assertSame(2.0, floatval($beforeReport['planned_hours'] ?? 0));
        self::assertSame(0.0, floatval($beforeReport['completed_hours'] ?? 0));

        $updated = $this->planning->completeSession($sessionId, $fixture['formateur_id'], 3);
        $storedStatus = $this->fetchStoredSessionStatus($sessionId);

        $moduleRow = $this->findModuleProgressRow($fixture['module_id']);
        $trainerKpis = $this->dashboard->getTrainerKpis($fixture['formateur_id'], 26, 2026);
        $reportRow = $this->findWorkloadRow($fixture['formateur_id']);

        self::assertSame('completed', $updated['status']);
        self::assertSame('done', $storedStatus);
        self::assertSame(2.0, floatval($moduleRow['completed_hours'] ?? 0));
        self::assertSame(20, intval($moduleRow['progress_percent'] ?? 0));
        self::assertSame(2.0, floatval($trainerKpis['annual_completed_hours'] ?? 0));
        self::assertSame(2.0, floatval($trainerKpis['weekly_hours'] ?? 0));
        self::assertSame(2.0, floatval($reportRow['planned_hours'] ?? 0));
        self::assertSame(2.0, floatval($reportRow['completed_hours'] ?? 0));
    }

    public function testFutureSessionCannotBeMarkedCompleted(): void
    {
        $fixture = $this->createBaseFixture();
        $sessionId = $this->insertSession(
            $fixture['formateur_id'],
            $fixture['module_id'],
            27,
            date('Y-m-d', strtotime('+7 days')),
            'scheduled'
        );

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('future');

        $this->planning->completeSession($sessionId, $fixture['formateur_id'], 3);
    }

    private function findWorkloadRow(int $formateurId): array
    {
        foreach ($this->reports->getWorkloadRows(2026) as $row) {
            if (intval($row['id'] ?? 0) === $formateurId) {
                return $row;
            }
        }

        self::fail('Ligne de charge formateur introuvable.');
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
            'nom' => 'Completion Formateur ' . $suffix,
            'email' => 'completion.' . $suffix . '@example.com',
            'telephone' => '+212633' . substr(md5($suffix), 0, 6),
            'specialite' => 'Suivi seances',
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
            'code' => 'CMP-' . strtoupper($suffix),
            'intitule' => 'Module Completion ' . $suffix,
            'filiere' => 'Management',
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
        string $sessionDate,
        string $status
    ): int {
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
                1,
                "08:00:00",
                "10:00:00",
                :session_date,
                :status,
                "Cours",
                ""
             )'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'week_number' => $weekNumber,
            'week_start_date' => $sessionDate,
            'week_end_date' => $sessionDate,
            'session_date' => $sessionDate,
            'status' => $status,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertSubmission(
        int $formateurId,
        int $weekNumber,
        int $academicYear,
        string $status,
        float $submittedHours
    ): void {
        $stmt = $this->db->prepare(
            'INSERT INTO planning_submissions (
                formateur_id,
                semaine,
                academic_year,
                submitted_hours,
                status,
                submitted_at,
                reviewed_at,
                created_at,
                updated_at
             ) VALUES (
                :formateur_id,
                :semaine,
                :academic_year,
                :submitted_hours,
                :status,
                NOW(),
                NOW(),
                NOW(),
                NOW()
             )'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'semaine' => $weekNumber,
            'academic_year' => $academicYear,
            'submitted_hours' => $submittedHours,
            'status' => $status,
        ]);
    }

    private function fetchStoredSessionStatus(int $sessionId): string
    {
        $stmt = $this->db->prepare('SELECT status FROM planning_sessions WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $sessionId]);

        return (string) ($stmt->fetchColumn() ?: '');
    }
}
