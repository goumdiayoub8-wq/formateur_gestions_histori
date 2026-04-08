<?php

use PHPUnit\Framework\TestCase;

final class PlanningWeekRangeTest extends TestCase
{
    private PDO $db;
    private PlanningService $planningService;
    private PlanningAlertService $alertService;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        beginBackendTestTransaction($this->db);

        $this->planningService = new PlanningService($this->db);
        $this->alertService = new PlanningAlertService($this->db);
    }

    protected function tearDown(): void
    {
        rollbackBackendTestTransaction($this->db);
    }

    public function testWeeksUpTo44Accepted(): void
    {
        $fixture = $this->createBaseFixture();

        $session = $this->planningService->saveSession([
            'formateur_id' => $fixture['formateur_id'],
            'module_id' => $fixture['module_id'],
            'groupe_id' => $fixture['groupe_id'],
            'week_number' => 44,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

        self::assertSame(44, intval($session['week_number']));
        self::assertSame($fixture['formateur_id'], intval($session['formateur_id']));
    }

    public function testWeeksAbove44Rejected(): void
    {
        $fixture = $this->createBaseFixture();

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('La semaine doit etre comprise entre 1 et 44.');

        $this->planningService->saveSession([
            'formateur_id' => $fixture['formateur_id'],
            'module_id' => $fixture['module_id'],
            'groupe_id' => $fixture['groupe_id'],
            'week_number' => 45,
            'day_of_week' => 1,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);
    }

    public function testInvalidWeekRejectedInService(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('La semaine doit etre comprise entre 1 et 44.');

        $this->planningService->sessions(0);
    }

    public function testNoFalseIncompleteForUnavailableWeeks(): void
    {
        $fixture = $this->createBaseFixture();

        $this->planningService->saveSession([
            'formateur_id' => $fixture['formateur_id'],
            'module_id' => $fixture['module_id'],
            'groupe_id' => $fixture['groupe_id'],
            'week_number' => 44,
            'day_of_week' => 2,
            'start_time' => '10:00',
            'end_time' => '12:00',
        ]);

        $dashboard = $this->planningService->validationDashboard([]);

        $matrixRow = $this->findMatrixRow($dashboard['matrix']['rows'] ?? [], $fixture['formateur_id']);
        $queueRow = $this->findQueueRow($dashboard['queue'] ?? [], $fixture['formateur_id'], 44);
        $incomplete = $this->findIncompleteEntry($dashboard['incomplete_formateurs'] ?? [], $fixture['formateur_id']);

        self::assertSame(2.0, floatval($matrixRow['weeks'][44] ?? 0));
        self::assertNotContains(44, $matrixRow['incomplete_weeks'] ?? []);
        self::assertNotNull($queueRow);
        self::assertFalse(!empty($queueRow['incomplete']));
        self::assertNotContains(44, $incomplete['missing_weeks'] ?? []);
    }

    public function testWeeksBelowValidationRangeIgnoredInAlerts(): void
    {
        $alerts = $this->alertService->detectIncompleteFormateurs([
            'rows' => [
                [
                    'formateur_id' => 9,
                    'formateur_nom' => 'Formateur Test',
                    'weekly_target_hours' => 12,
                    'incomplete_weeks' => [12, 26, 27, 30],
                ],
            ],
        ]);

        self::assertCount(1, $alerts);
        self::assertSame([26, 27, 30], $alerts[0]['missing_weeks']);
        self::assertSame('26-27, 30', $alerts[0]['incomplete_range']);
    }

    public function testIncompleteRangeFormatting(): void
    {
        $alerts = $this->alertService->detectIncompleteFormateurs([
            'rows' => [
                [
                    'formateur_id' => 10,
                    'formateur_nom' => 'Formateur Range',
                    'weekly_target_hours' => 10,
                    'incomplete_weeks' => [26, 27, 28, 31, 33, 34],
                ],
            ],
        ]);

        self::assertCount(1, $alerts);
        self::assertSame('26-28, 31, 33-34', $alerts[0]['incomplete_range']);
        self::assertSame(60.0, floatval($alerts[0]['total_missing_hours']));
    }

    private function findMatrixRow(array $rows, int $formateurId): array
    {
        foreach ($rows as $row) {
            if (intval($row['formateur_id'] ?? 0) === $formateurId) {
                return $row;
            }
        }

        self::fail('Ligne matrice introuvable pour le formateur.');
    }

    private function findQueueRow(array $rows, int $formateurId, int $weekNumber): ?array
    {
        foreach ($rows as $row) {
            if (
                intval($row['formateur_id'] ?? 0) === $formateurId
                && intval($row['semaine'] ?? 0) === $weekNumber
            ) {
                return $row;
            }
        }

        return null;
    }

    private function findIncompleteEntry(array $rows, int $formateurId): array
    {
        foreach ($rows as $row) {
            if (intval($row['formateur_id'] ?? 0) === $formateurId) {
                return $row;
            }
        }

        self::fail('Entree incomplete introuvable pour le formateur.');
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
            'email' => 'test.week.' . $suffix . '@example.com',
            'telephone' => '+212611' . substr($suffix, 0, 6),
            'specialite' => 'Audit planning',
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
            'code' => 'WEEK-' . strtoupper($suffix),
            'intitule' => 'Module Week ' . $suffix,
            'filiere' => 'Informatique',
            'semestre' => 'S2',
            'volume_horaire' => 70,
            'has_efm' => 0,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertGroup(string $suffix): array
    {
        $code = 'GW-' . strtoupper($suffix);
        $stmt = $this->db->prepare(
            'INSERT INTO groupes (code, nom, filiere, annee_scolaire, effectif, actif)
             VALUES (:code, :nom, :filiere, :annee_scolaire, :effectif, :actif)'
        );
        $stmt->execute([
            'code' => $code,
            'nom' => 'Groupe Week ' . $suffix,
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
