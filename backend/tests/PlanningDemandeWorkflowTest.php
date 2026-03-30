<?php

use PHPUnit\Framework\TestCase;

final class PlanningDemandeWorkflowTest extends TestCase
{
    private PDO $db;
    private DashboardService $dashboardService;
    private PlanningService $planningService;
    private DashboardRepository $dashboardRepository;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        $this->db->beginTransaction();

        $this->dashboardService = new DashboardService($this->db);
        $this->planningService = new PlanningService($this->db);
        $this->dashboardRepository = new DashboardRepository($this->db);
    }

    protected function tearDown(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
    }

    public function testCreateDemandeDefaultsToPending(): void
    {
        $fixture = $this->createBaseFixture();

        $created = $this->dashboardService->createTrainerChangeRequest($fixture['formateur_id'], [
            'module_id' => $fixture['module_id'],
            'reason' => 'Demande de test',
        ], 2026);

        self::assertSame('pending', $created['status']);
        self::assertSame('', $created['groupe_code']);
        self::assertSame('A definir', $created['semaine']);
        self::assertNull($created['request_week']);
    }

    public function testValidateDemande(): void
    {
        $fixture = $this->createBaseFixture();
        $demande = $this->createDemande($fixture['formateur_id'], $fixture['module_id']);

        $updated = $this->dashboardService->reviewTrainerChangeRequest(intval($demande['id']), 'validated');
        $stored = $this->fetchDemande(intval($demande['id']));

        self::assertSame('validated', $updated['status']);
        self::assertSame('validated', $stored['status']);
    }

    public function testPlanningTurnsValidatedToPlanned(): void
    {
        $fixture = $this->createBaseFixture();
        $demande = $this->createDemande($fixture['formateur_id'], $fixture['module_id']);
        $this->dashboardService->reviewTrainerChangeRequest(intval($demande['id']), 'validated');

        $session = $this->planningService->saveSession([
            'formateur_id' => $fixture['formateur_id'],
            'module_id' => $fixture['module_id'],
            'groupe_id' => $fixture['groupe_id'],
            'week_number' => 5,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);
        $stored = $this->fetchDemande(intval($demande['id']));

        self::assertGreaterThan(0, intval($session['id']));
        self::assertSame('planned', $stored['status']);
        self::assertSame(5, $stored['request_week']);
        self::assertSame($fixture['groupe_code'], $stored['groupe_code']);
    }

    public function testDeletingPlanningReturnsToValidated(): void
    {
        $fixture = $this->createBaseFixture();
        $demande = $this->createDemande($fixture['formateur_id'], $fixture['module_id']);
        $this->dashboardService->reviewTrainerChangeRequest(intval($demande['id']), 'validated');

        $session = $this->planningService->saveSession([
            'formateur_id' => $fixture['formateur_id'],
            'module_id' => $fixture['module_id'],
            'groupe_id' => $fixture['groupe_id'],
            'week_number' => 6,
            'day_of_week' => 2,
            'start_time' => '10:00',
            'end_time' => '12:00',
        ]);

        $this->planningService->deleteSession(intval($session['id']));
        $stored = $this->fetchDemande(intval($demande['id']));

        self::assertSame('validated', $stored['status']);
    }

    public function testRejectedIsTerminal(): void
    {
        $fixture = $this->createBaseFixture();
        $demande = $this->createDemande($fixture['formateur_id'], $fixture['module_id']);
        $this->dashboardService->reviewTrainerChangeRequest(intval($demande['id']), 'rejected');

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Une demande refusee ne peut plus etre modifiee.');

        try {
            $this->dashboardService->reviewTrainerChangeRequest(intval($demande['id']), 'validated');
        } finally {
            $stored = $this->fetchDemande(intval($demande['id']));
            self::assertSame('rejected', $stored['status']);
        }
    }

    public function testCannotPlanRejectedDemande(): void
    {
        $fixture = $this->createBaseFixture();
        $demande = $this->createDemande($fixture['formateur_id'], $fixture['module_id']);
        $this->dashboardService->reviewTrainerChangeRequest(intval($demande['id']), 'rejected');

        $this->planningService->saveSession([
            'formateur_id' => $fixture['formateur_id'],
            'module_id' => $fixture['module_id'],
            'groupe_id' => $fixture['groupe_id'],
            'week_number' => 7,
            'day_of_week' => 3,
            'start_time' => '14:00',
            'end_time' => '16:00',
        ]);

        $stored = $this->fetchDemande(intval($demande['id']));

        self::assertSame('rejected', $stored['status']);
    }

    public function testNoPlannedWithoutPlanning(): void
    {
        $fixture = $this->createBaseFixture();
        $demande = $this->createDemande($fixture['formateur_id'], $fixture['module_id']);
        $this->dashboardService->reviewTrainerChangeRequest(intval($demande['id']), 'validated');

        $updated = $this->planningService->updateDemandeStatus(intval($demande['id']), null, null, [
            'week_number' => 8,
            'group_code' => $fixture['groupe_code'],
        ]);
        $stored = $this->fetchDemande(intval($demande['id']));

        self::assertSame('validated', $updated['status']);
        self::assertSame('validated', $stored['status']);
    }

    private function createDemande(int $formateurId, int $moduleId): array
    {
        return $this->dashboardService->createTrainerChangeRequest($formateurId, [
            'module_id' => $moduleId,
            'reason' => 'Demande de workflow',
        ], 2026);
    }

    private function fetchDemande(int $demandeId): array
    {
        $demande = $this->dashboardRepository->findTrainerChangeRequestById($demandeId);

        self::assertNotNull($demande);

        return $demande;
    }

    private function createBaseFixture(): array
    {
        $suffix = bin2hex(random_bytes(4));
        $formateurId = $this->insertFormateur($suffix);
        $moduleId = $this->insertModule($suffix);
        $group = $this->insertGroup($suffix);

        $this->linkModuleToGroup($moduleId, $group['id']);
        $this->insertAffectation($formateurId, $moduleId);

        return [
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'groupe_id' => $group['id'],
            'groupe_code' => $group['code'],
        ];
    }

    private function insertFormateur(string $suffix): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, :max_heures, :current_hours, :weekly_hours)'
        );
        $stmt->execute([
            'nom' => 'Test Formateur ' . $suffix,
            'email' => 'test.' . $suffix . '@example.com',
            'telephone' => '+212600' . substr($suffix, 0, 6),
            'specialite' => 'Audit workflow',
            'max_heures' => 910,
            'current_hours' => 0,
            'weekly_hours' => 12,
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
            'code' => 'TST-' . strtoupper($suffix),
            'intitule' => 'Module Test ' . $suffix,
            'filiere' => 'Informatique',
            'semestre' => 'S1',
            'volume_horaire' => 70,
            'has_efm' => 0,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertGroup(string $suffix): array
    {
        $code = 'GRP-' . strtoupper($suffix);
        $stmt = $this->db->prepare(
            'INSERT INTO groupes (code, nom, filiere, annee_scolaire, effectif, actif)
             VALUES (:code, :nom, :filiere, :annee_scolaire, :effectif, :actif)'
        );
        $stmt->execute([
            'code' => $code,
            'nom' => 'Groupe Test ' . $suffix,
            'filiere' => 'Informatique',
            'annee_scolaire' => '2025-2026',
            'effectif' => 24,
            'actif' => 1,
        ]);

        return [
            'id' => intval($this->db->lastInsertId()),
            'code' => $code,
        ];
    }

    private function linkModuleToGroup(int $moduleId, int $groupId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO module_groupes (module_id, groupe_id)
             VALUES (:module_id, :groupe_id)'
        );
        $stmt->execute([
            'module_id' => $moduleId,
            'groupe_id' => $groupId,
        ]);
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
}
