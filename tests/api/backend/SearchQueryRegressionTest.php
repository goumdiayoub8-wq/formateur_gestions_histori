<?php

require_once __DIR__ . '/../../../backend/repositories/AffectationRepository.php';
require_once __DIR__ . '/../../../backend/repositories/FormateurRepository.php';
require_once __DIR__ . '/../../../backend/repositories/ModuleRepository.php';
require_once __DIR__ . '/../../../backend/repositories/PlanningRepository.php';

use PHPUnit\Framework\TestCase;

final class SearchQueryRegressionTest extends TestCase
{
    private PDO $db;
    private AffectationRepository $affectations;
    private ModuleRepository $modules;
    private PlanningRepository $planning;
    private FormateurRepository $formateurs;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        beginBackendTestTransaction($this->db);
        $this->affectations = new AffectationRepository($this->db);
        $this->modules = new ModuleRepository($this->db);
        $this->planning = new PlanningRepository($this->db);
        $this->formateurs = new FormateurRepository($this->db);
    }

    protected function tearDown(): void
    {
        rollbackBackendTestTransaction($this->db);
    }

    public function testSharedSearchPlaceholdersDoNotBreakPaginatedQueries(): void
    {
        $affectationRows = $this->affectations->paginate(1, 5, [
            'annee' => 2025,
            'search' => 'EGT',
        ]);
        $moduleRows = $this->modules->paginate(1, 5, [
            'search' => 'EGT',
        ]);
        $planningRows = $this->planning->paginate(1, 5, [
            'search' => 'EGT',
        ]);
        $formateurRows = $this->formateurs->paginate(1, 5, 'formateur');

        self::assertIsArray($affectationRows['data']);
        self::assertIsInt($affectationRows['total_items']);
        self::assertIsArray($moduleRows['data']);
        self::assertIsArray($planningRows['data']);
        self::assertIsArray($formateurRows['data']);
    }

    public function testWildcardAndSpecialCharacterSearchesRemainBoundSafely(): void
    {
        $affectationRows = $this->affectations->paginate(1, 5, [
            'annee' => 2025,
            'search' => "EGT%_'\"",
        ]);
        $moduleRows = $this->modules->progressList([
            'annee' => 2026,
            'search' => "DEV%_'\"",
        ]);
        $planningRows = $this->planning->paginate(1, 5, [
            'search' => "%_'\"",
        ]);

        self::assertIsArray($affectationRows['data']);
        self::assertIsArray($moduleRows);
        self::assertIsArray($planningRows['data']);
    }
}
