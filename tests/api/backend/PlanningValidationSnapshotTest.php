<?php

require_once __DIR__ . '/../../../backend/services/PlanningService.php';

use PHPUnit\Framework\TestCase;

final class PlanningValidationSnapshotTest extends TestCase
{
    private PDO $db;
    private PlanningService $planning;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        beginBackendTestTransaction($this->db);
        $this->planning = new PlanningService($this->db);
    }

    protected function tearDown(): void
    {
        rollbackBackendTestTransaction($this->db);
    }

    public function testApprovedSubmissionKeepsSnapshotAfterLaterPlanningEdit(): void
    {
        $fixture = $this->createBaseFixture();
        $this->insertSession($fixture['formateur_id'], $fixture['module_id'], 26, '2026-02-10', '08:00:00', '10:00:00');
        $submissionId = $this->insertSubmission($fixture['formateur_id'], 26, 2026, 'pending', 2.0);

        $approved = $this->planning->updateValidationStatus($submissionId, 'approved', null, $fixture['reviewer_id']);
        self::assertSame('approved', $approved['status']);
        self::assertSame(2.0, floatval($approved['submitted_hours'] ?? 0));

        $this->insertSession($fixture['formateur_id'], $fixture['module_id'], 26, '2026-02-10', '10:00:00', '11:00:00');

        $detail = $this->planning->submissionDetail($submissionId);
        self::assertSame('approved', $detail['submission']['status']);
        self::assertSame(2.0, floatval($detail['submission']['submitted_hours'] ?? 0));
        self::assertCount(1, $detail['entries']);
        self::assertSame(2.0, floatval($detail['entries'][0]['heures'] ?? 0));

        $history = $this->planning->validationHistory(10);
        $historyRow = $this->findHistoryRow($history, $submissionId);
        self::assertNotNull($historyRow);
        self::assertSame(2.0, floatval($historyRow['submitted_hours'] ?? 0));

        $queue = $this->planning->validationQueue([]);
        $latestPending = $this->findQueueRow($queue, $fixture['formateur_id'], 26, 'pending');
        self::assertNotNull($latestPending);
        self::assertNotSame($submissionId, intval($latestPending['id']));
        self::assertSame(3.0, floatval($latestPending['submitted_hours'] ?? 0));
    }

    private function createBaseFixture(): array
    {
        $suffix = bin2hex(random_bytes(4));
        $formateurId = $this->insertFormateur($suffix);
        $moduleId = $this->insertModule($suffix);
        $this->insertAffectation($formateurId, $moduleId);
        $reviewerId = $this->insertReviewer($suffix);

        return [
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'reviewer_id' => $reviewerId,
        ];
    }

    private function insertFormateur(string $suffix): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, :max_heures, :current_hours, :weekly_hours)'
        );
        $stmt->execute([
            'nom' => 'Snapshot Formateur ' . $suffix,
            'email' => 'snapshot.' . $suffix . '@example.com',
            'telephone' => '+212644' . substr(md5($suffix), 0, 6),
            'specialite' => 'Validation planning',
            'max_heures' => 910,
            'current_hours' => 0,
            'weekly_hours' => 10,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertReviewer(string $suffix): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO utilisateurs (nom, email, username, mot_de_passe, role_id, statut)
             VALUES (:nom, :email, :username, :mot_de_passe, :role_id, :statut)'
        );
        $stmt->execute([
            'nom' => 'Reviewer ' . $suffix,
            'email' => 'reviewer.' . $suffix . '@example.com',
            'username' => 'reviewer_' . $suffix,
            'mot_de_passe' => password_hash('secret123', PASSWORD_DEFAULT),
            'role_id' => 1,
            'statut' => 'actif',
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
            'code' => 'SNP-' . strtoupper($suffix),
            'intitule' => 'Module Snapshot ' . $suffix,
            'filiere' => 'Audit',
            'semestre' => 'S1',
            'volume_horaire' => 12,
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
                :week_start_date,
                :week_end_date,
                1,
                :start_time,
                :end_time,
                :session_date,
                "scheduled",
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
            'start_time' => $startTime,
            'end_time' => $endTime,
            'session_date' => $sessionDate,
        ]);
    }

    private function insertSubmission(
        int $formateurId,
        int $weekNumber,
        int $academicYear,
        string $status,
        float $submittedHours
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO planning_submissions (
                formateur_id,
                semaine,
                academic_year,
                submitted_hours,
                status,
                submitted_at
             ) VALUES (
                :formateur_id,
                :semaine,
                :academic_year,
                :submitted_hours,
                :status,
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

        return intval($this->db->lastInsertId());
    }

    private function findHistoryRow(array $rows, int $submissionId): ?array
    {
        foreach ($rows as $row) {
            if (intval($row['id'] ?? 0) === $submissionId) {
                return $row;
            }
        }

        return null;
    }

    private function findQueueRow(array $rows, int $formateurId, int $weekNumber, string $status): ?array
    {
        foreach ($rows as $row) {
            if (
                intval($row['formateur_id'] ?? 0) === $formateurId
                && intval($row['semaine'] ?? 0) === $weekNumber
                && (string) ($row['status'] ?? '') === $status
            ) {
                return $row;
            }
        }

        return null;
    }
}
