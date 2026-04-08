<?php

require_once __DIR__ . '/../../../backend/services/FormateurService.php';
require_once __DIR__ . '/../../../backend/services/DashboardService.php';

use PHPUnit\Framework\TestCase;

final class FormateurModuleQuestionnaireTest extends TestCase
{
    private PDO $db;
    private FormateurService $service;
    private DashboardService $dashboard;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        beginBackendTestTransaction($this->db);
        $this->service = new FormateurService($this->db);
        $this->dashboard = new DashboardService($this->db);
    }

    protected function tearDown(): void
    {
        rollbackBackendTestTransaction($this->db);
    }

    public function testModuleQuestionnairesReturnsStatusScoreAndRanking(): void
    {
        $trainerId = $this->insertTrainer('mq-self');
        $otherTrainerHigh = $this->insertTrainer('mq-high');
        $otherTrainerLow = $this->insertTrainer('mq-low');
        $moduleCompleted = $this->insertModule('MQ-COMP', 'Questionnaire');
        $modulePending = $this->insertModule('MQ-PEND', 'Questionnaire');

        $this->assignModule($trainerId, $moduleCompleted);
        $this->assignModule($trainerId, $modulePending);
        $this->assignModule($otherTrainerHigh, $moduleCompleted);
        $this->assignModule($otherTrainerLow, $moduleCompleted);

        $this->insertModuleQuestionnaire($moduleCompleted);
        $this->insertModuleQuestionnaire($modulePending);

        $this->insertModuleScore($otherTrainerHigh, $moduleCompleted, 96);
        $this->insertModuleScore($trainerId, $moduleCompleted, 88);
        $this->insertModuleScore($otherTrainerLow, $moduleCompleted, 71);

        $rows = $this->service->moduleQuestionnaires($trainerId, 2026);

        self::assertCount(2, $rows);

        $completed = $this->findByModuleId($rows, $moduleCompleted);
        $pending = $this->findByModuleId($rows, $modulePending);

        self::assertSame('completed', $completed['status']);
        self::assertSame(88.0, round(floatval($completed['score'] ?? 0), 2));
        self::assertSame(2, intval($completed['rank_in_module'] ?? 0));
        self::assertSame(3, intval($completed['total_formateurs'] ?? 0));
        self::assertSame('not_started', $pending['status']);
        self::assertNull($pending['score']);
        self::assertNull($pending['rank_in_module']);
        self::assertSame(0, intval($pending['total_formateurs'] ?? -1));
    }

    public function testTrainerOverviewModulesExposeQuestionnaireFieldsForMesModulesPage(): void
    {
        $trainerId = $this->insertTrainer('mq-overview');
        $otherTrainer = $this->insertTrainer('mq-overview-other');
        $moduleId = $this->insertModule('MQ-OVERVIEW', 'Questionnaire');

        $this->assignModule($trainerId, $moduleId);
        $this->assignModule($otherTrainer, $moduleId);
        $this->insertModuleQuestionnaire($moduleId);
        $this->insertModuleScore($otherTrainer, $moduleId, 94);
        $this->insertModuleScore($trainerId, $moduleId, 82);

        $overview = $this->dashboard->trainerOverview($trainerId, 29, 2026);
        $module = $this->findModuleFromOverview($overview['modules'] ?? [], $moduleId);

        self::assertSame('completed', $module['questionnaire_status'] ?? null);
        self::assertSame(82.0, round(floatval($module['questionnaire_score'] ?? 0), 2));
        self::assertSame(2, intval($module['rank_in_module'] ?? 0));
        self::assertSame(2, intval($module['total_formateurs'] ?? 0));
    }

    private function insertTrainer(string $suffix): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, 910, 0, 12)'
        );
        $stmt->execute([
            'nom' => 'Formateur ' . $suffix,
            'email' => $suffix . '@example.com',
            'telephone' => '+212603' . substr(md5($suffix), 0, 6),
            'specialite' => 'Questionnaire module',
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

    private function assignModule(int $formateurId, int $moduleId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO affectations (formateur_id, module_id, annee)
             VALUES (:formateur_id, :module_id, 2026)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
        ]);
    }

    private function insertModuleQuestionnaire(int $moduleId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO module_questionnaires (module_id, questionnaire_id, questionnaire_token, total_questions)
             VALUES (:module_id, :questionnaire_id, :questionnaire_token, 20)'
        );
        $stmt->execute([
            'module_id' => $moduleId,
            'questionnaire_id' => 'module-' . $moduleId,
            'questionnaire_token' => substr(hash('sha256', 'test:' . $moduleId), 0, 48),
        ]);
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

    private function findByModuleId(array $rows, int $moduleId): array
    {
        foreach ($rows as $row) {
            if (intval($row['module_id'] ?? 0) === $moduleId) {
                return $row;
            }
        }

        self::fail('Module questionnaire row introuvable.');
    }

    private function findModuleFromOverview(array $rows, int $moduleId): array
    {
        foreach ($rows as $row) {
            if (intval($row['id'] ?? 0) === $moduleId) {
                return $row;
            }
        }

        self::fail('Module overview row introuvable.');
    }
}
