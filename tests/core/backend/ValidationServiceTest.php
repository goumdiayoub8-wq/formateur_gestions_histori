<?php

require_once __DIR__ . '/../../../backend/services/ValidationService.php';

use PHPUnit\Framework\TestCase;

final class ValidationServiceTest extends TestCase
{
    private PDO $db;
    private ValidationService $service;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        beginBackendTestTransaction($this->db);
        $this->service = new ValidationService($this->db);
    }

    protected function tearDown(): void
    {
        rollbackBackendTestTransaction($this->db);
    }

    public function testValidateAssignmentRejectsDuplicateTrainerModuleForTheSameYear(): void
    {
        $trainerId = $this->insertTrainer('duplicate-assignment', 910);
        $moduleId = $this->insertModule('DUP-101', 'S1', 20, 0);
        $this->insertAffectation($trainerId, $moduleId, 2026);

        $this->expectException(ConflictException::class);
        $this->expectExceptionMessage('deja affecte');
        $this->service->validateAssignment($trainerId, $moduleId, 2026);
    }

    public function testValidateAssignmentRejectsAnnualOverloadAndSecondEfm(): void
    {
        $trainerId = $this->insertTrainer('annual-limit', 60);
        $existingModuleId = $this->insertModule('EFM-EXIST', 'S1', 30, 1);
        $nextModuleId = $this->insertModule('EFM-NEXT', 'S2', 40, 1);
        $this->insertAffectation($trainerId, $existingModuleId, 2026);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('limite annuelle');
        $this->service->validateAssignment($trainerId, $nextModuleId, 2026);
    }

    public function testValidateAssignmentRejectsSemesterImbalanceBeyondTolerance(): void
    {
        $trainerId = $this->insertTrainer('semester-gap', 910);
        $heavyS1 = $this->insertModule('SEM-S1', 'S1', 200, 0);
        $heavierS1 = $this->insertModule('SEM-S1-2', 'S1', 160, 0);

        $this->insertAffectation($trainerId, $heavyS1, 2026);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('desequilibree');
        $this->service->validateAssignment($trainerId, $heavierS1, 2026);
    }

    public function testValidatePlanningRejectsInvalidWeekHoursAndUnassignedModules(): void
    {
        $trainerId = $this->insertTrainer('planning-invalid', 910);
        $moduleId = $this->insertModule('PLAN-101', 'S1', 20, 0);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('semaine doit etre comprise');
        $this->service->validatePlanning($trainerId, $moduleId, 99, 2.0);
    }

    public function testValidatePlanningRejectsWeeklyOverloadAndDuplicateWeekRows(): void
    {
        $trainerId = $this->insertTrainer('planning-overload', 910);
        $moduleA = $this->insertModule('PLAN-A', 'S1', 20, 0);
        $moduleB = $this->insertModule('PLAN-B', 'S1', 20, 0);

        $this->insertAffectation($trainerId, $moduleA, 2026);
        $this->insertAffectation($trainerId, $moduleB, 2026);
        $this->insertPlanningRow($trainerId, $moduleA, 6, 40.0);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('limite hebdomadaire de 44 heures');
        $this->service->validatePlanning($trainerId, $moduleB, 6, 5.0);
    }

    public function testValidatePlanningSessionRejectsOverlapsAndOutOfGridTimes(): void
    {
        $trainerId = $this->insertTrainer('session-overlap', 910);
        $moduleA = $this->insertModule('SES-A', 'S1', 20, 0);
        $moduleB = $this->insertModule('SES-B', 'S1', 20, 0);

        $this->insertAffectation($trainerId, $moduleA, 2026);
        $this->insertAffectation($trainerId, $moduleB, 2026);
        $this->insertSession($trainerId, $moduleA, 8, 2, '09:00:00', '11:00:00');

        $this->expectException(ConflictException::class);
        $this->expectExceptionMessage('Conflit detecte');
        $this->service->validatePlanningSession($trainerId, $moduleB, 8, 2, '10:00:00', '12:00:00', 2.0);
    }

    public function testValidatePlanningSessionRejectsTimesOutsideTheGrid(): void
    {
        $trainerId = $this->insertTrainer('session-grid', 910);
        $moduleId = $this->insertModule('SES-GRID', 'S2', 20, 0);
        $this->insertAffectation($trainerId, $moduleId, 2026);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('entre 08:00 et 18:00');
        $this->service->validatePlanningSession($trainerId, $moduleId, 8, 2, '07:30:00', '09:00:00', 1.5);
    }

    private function insertTrainer(string $suffix, int $maxHeures): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, :max_heures, 0, 10)'
        );
        $stmt->execute([
            'nom' => 'Validation ' . $suffix,
            'email' => $suffix . '@example.com',
            'telephone' => '+212602' . substr(md5($suffix), 0, 6),
            'specialite' => 'Validation QA',
            'max_heures' => $maxHeures,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertModule(string $code, string $semestre, int $volumeHoraire, int $hasEfm): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO modules (code, intitule, filiere, semestre, volume_horaire, has_efm)
             VALUES (:code, :intitule, :filiere, :semestre, :volume_horaire, :has_efm)'
        );
        $stmt->execute([
            'code' => $code,
            'intitule' => 'Module ' . $code,
            'filiere' => 'Validation',
            'semestre' => $semestre,
            'volume_horaire' => $volumeHoraire,
            'has_efm' => $hasEfm,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertAffectation(int $trainerId, int $moduleId, int $annee): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO affectations (formateur_id, module_id, annee)
             VALUES (:formateur_id, :module_id, :annee)'
        );
        $stmt->execute([
            'formateur_id' => $trainerId,
            'module_id' => $moduleId,
            'annee' => $annee,
        ]);
    }

    private function insertPlanningRow(int $trainerId, int $moduleId, int $semaine, float $heures): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO planning (formateur_id, module_id, semaine, heures)
             VALUES (:formateur_id, :module_id, :semaine, :heures)'
        );
        $stmt->execute([
            'formateur_id' => $trainerId,
            'module_id' => $moduleId,
            'semaine' => $semaine,
            'heures' => $heures,
        ]);
    }

    private function insertSession(
        int $trainerId,
        int $moduleId,
        int $weekNumber,
        int $dayOfWeek,
        string $startTime,
        string $endTime
    ): void {
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
                "2026-02-16",
                "2026-02-22",
                :day_of_week,
                :start_time,
                :end_time,
                "2026-02-17",
                "scheduled",
                "Cours",
                ""
             )'
        );
        $stmt->execute([
            'formateur_id' => $trainerId,
            'module_id' => $moduleId,
            'week_number' => $weekNumber,
            'day_of_week' => $dayOfWeek,
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);
    }
}
