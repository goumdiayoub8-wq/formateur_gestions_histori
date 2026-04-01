<?php

require_once __DIR__ . '/../repositories/DashboardRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../repositories/SmartAssignmentRepository.php';
require_once __DIR__ . '/../services/DashboardService.php';

use PHPUnit\Framework\TestCase;

final class QuestionnaireAlignmentTest extends TestCase
{
    private PDO $db;
    private DashboardRepository $dashboard;
    private FormateurRepository $formateurs;
    private SmartAssignmentRepository $smartAssignment;
    private DashboardService $dashboardService;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        $this->db->beginTransaction();
        $this->dashboard = new DashboardRepository($this->db);
        $this->formateurs = new FormateurRepository($this->db);
        $this->smartAssignment = new SmartAssignmentRepository($this->db);
        $this->dashboardService = new DashboardService($this->db);
    }

    protected function tearDown(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
    }

    public function testRepositoriesPreferModuleScoresForFrontendConsumedQuestionnairePercentage(): void
    {
        $trainerId = $this->insertTrainer('aligned-modules');
        $moduleOne = $this->insertModule('ALIGN-1', 'Alignment');
        $moduleTwo = $this->insertModule('ALIGN-2', 'Alignment');

        $this->insertModuleScore($trainerId, $moduleOne, 80);
        $this->insertModuleScore($trainerId, $moduleTwo, 100);
        $this->insertEvaluationScore($trainerId, 42, '2026-03-01 09:00:00');

        $dashboardRow = $this->findDashboardTrainerRow($trainerId);
        $formateurRow = $this->findFormateurRow($trainerId);
        $suggestionRow = $this->findSmartAssignmentTrainerRow($trainerId, $moduleOne);
        $stats = $this->dashboardService->stats();
        $statsRow = $this->findStatsTrainerRow($stats['formateurs'] ?? [], $trainerId);

        self::assertSame(90.0, round(floatval($dashboardRow['questionnaire_percentage'] ?? 0), 2));
        self::assertSame(90.0, round(floatval($formateurRow['questionnaire_percentage'] ?? 0), 2));
        self::assertSame(90.0, round(floatval($suggestionRow['questionnaire_percentage'] ?? 0), 2));
        self::assertSame(80.0, round(floatval($suggestionRow['module_questionnaire_percentage'] ?? 0), 2));

        self::assertArrayHasKey('questionnaire_percentage', $statsRow);
        self::assertArrayHasKey('planned_hours', $statsRow);
        self::assertArrayHasKey('completed_hours', $statsRow);
        self::assertSame(90.0, round(floatval($statsRow['questionnaire_percentage'] ?? 0), 2));
        self::assertIsNumeric($statsRow['planned_hours']);
        self::assertIsNumeric($statsRow['completed_hours']);
    }

    public function testRepositoriesFallbackDeterministicallyToLatestLegacyEvaluationScore(): void
    {
        $trainerId = $this->insertTrainer('aligned-legacy');

        $this->insertEvaluationScore($trainerId, 55, '2026-03-01 08:00:00');
        $this->insertEvaluationScore($trainerId, 72, '2026-03-15 08:00:00');

        $dashboardRows = array_values(array_filter(
            $this->dashboard->getTrainerRows(),
            static fn(array $row): bool => intval($row['id'] ?? 0) === $trainerId
        ));
        $formateurRows = array_values(array_filter(
            $this->formateurs->all(),
            static fn(array $row): bool => intval($row['id'] ?? 0) === $trainerId
        ));

        self::assertCount(1, $dashboardRows);
        self::assertCount(1, $formateurRows);
        self::assertSame(72.0, round(floatval($dashboardRows[0]['questionnaire_percentage'] ?? 0), 2));
        self::assertSame(72.0, round(floatval($formateurRows[0]['questionnaire_percentage'] ?? 0), 2));
        self::assertSame(72.0, round(floatval($formateurRows[0]['questionnaire_score'] ?? 0), 2));
    }

    private function insertTrainer(string $suffix): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, 910, 0, 12)'
        );
        $stmt->execute([
            'nom' => 'Questionnaire ' . $suffix,
            'email' => $suffix . '@example.com',
            'telephone' => '+212602' . substr(md5($suffix), 0, 6),
            'specialite' => 'Questionnaire Alignment',
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertModule(string $code, string $filiere): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO modules (code, intitule, filiere, semestre, volume_horaire, has_efm)
             VALUES (:code, :intitule, :filiere, "S1", 30, 0)'
        );
        $stmt->execute([
            'code' => $code,
            'intitule' => 'Module ' . $code,
            'filiere' => $filiere,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertModuleScore(int $formateurId, int $moduleId, float $score): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateur_module_scores (formateur_id, module_id, score, last_updated_at)
             VALUES (:formateur_id, :module_id, :score, NOW())'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'score' => $score,
        ]);
    }

    private function insertEvaluationScore(int $formateurId, float $percentage, string $createdAt): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO evaluation_scores (formateur_id, total_score, max_score, percentage, created_at)
             VALUES (:formateur_id, :total_score, 100, :percentage, :created_at)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'total_score' => $percentage,
            'percentage' => $percentage,
            'created_at' => $createdAt,
        ]);
    }

    private function findDashboardTrainerRow(int $trainerId): array
    {
        foreach ($this->dashboard->getTrainerRows() as $row) {
            if (intval($row['id'] ?? 0) === $trainerId) {
                return $row;
            }
        }

        self::fail('Dashboard trainer row introuvable.');
    }

    private function findFormateurRow(int $trainerId): array
    {
        foreach ($this->formateurs->all() as $row) {
            if (intval($row['id'] ?? 0) === $trainerId) {
                return $row;
            }
        }

        self::fail('Formateur row introuvable.');
    }

    private function findSmartAssignmentTrainerRow(int $trainerId, int $moduleId): array
    {
        foreach ($this->smartAssignment->listTrainersForSuggestions(2026, 29, $moduleId) as $row) {
            if (intval($row['id'] ?? 0) === $trainerId) {
                return $row;
            }
        }

        self::fail('Suggestion trainer row introuvable.');
    }

    private function findStatsTrainerRow(array $rows, int $trainerId): array
    {
        foreach ($rows as $row) {
            if (intval($row['id'] ?? 0) === $trainerId) {
                return $row;
            }
        }

        self::fail('Stats trainer row introuvable.');
    }
}
