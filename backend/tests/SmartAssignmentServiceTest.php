<?php

require_once __DIR__ . '/../services/SmartAssignmentService.php';

use PHPUnit\Framework\TestCase;

final class SmartAssignmentServiceTest extends TestCase
{
    private PDO $db;
    private SmartAssignmentService $service;

    protected function setUp(): void
    {
        $this->db = $GLOBALS['test_db_connection'];
        $this->db->beginTransaction();
        $this->service = new SmartAssignmentService($this->db);
    }

    protected function tearDown(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
    }

    public function testSuggestionsShowAssignedModulesForCurrentAcademicYear(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $academicYear = currentAcademicYear();
        $specialite = 'Developpement web ' . strtoupper($suffix);
        $trainerId = $this->insertTrainer($suffix, $specialite);

        $assignedA = $this->insertModule($suffix . 'a', 'WEB-' . strtoupper(substr($suffix, 0, 4)), $specialite, 40, 'S1');
        $assignedB = $this->insertModule($suffix . 'b', 'API-' . strtoupper(substr($suffix, 0, 4)), $specialite, 30, 'S2');
        $pastYearModule = $this->insertModule($suffix . 'c', 'OLD-' . strtoupper(substr($suffix, 0, 4)), $specialite, 20, 'S1');
        $targetModule = $this->insertModule($suffix . 'd', 'NEW-' . strtoupper(substr($suffix, 0, 4)), $specialite, 35, 'S2');

        $this->insertAffectation($trainerId, $assignedA, $academicYear);
        $this->insertAffectation($trainerId, $assignedB, $academicYear);
        $this->insertAffectation($trainerId, $pastYearModule, $academicYear - 1);

        $suggestion = $this->findSuggestion($this->service->suggestions($targetModule), $trainerId);

        self::assertSame(
            [
                'API-' . strtoupper(substr($suffix, 0, 4)),
                'WEB-' . strtoupper(substr($suffix, 0, 4)),
            ],
            $suggestion['modules']
        );
    }

    public function testSuggestionsPreferHigherModuleQuestionnaireScoreWhenAvailabilityMatches(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $specialite = 'Developpement score ' . strtoupper($suffix);
        $trainerHigh = $this->insertTrainer($suffix . 'h', $specialite);
        $trainerLow = $this->insertTrainer($suffix . 'l', $specialite);
        $targetModule = $this->insertModule($suffix . 't', 'DEV-' . strtoupper(substr($suffix, 0, 4)), $specialite, 28, 'S1');

        $this->insertModuleScore($trainerHigh, $targetModule, 92);
        $this->insertModuleScore($trainerLow, $targetModule, 58);

        $suggestions = $this->service->suggestions($targetModule);
        $highIndex = $this->findSuggestionIndex($suggestions, $trainerHigh);
        $lowIndex = $this->findSuggestionIndex($suggestions, $trainerLow);

        self::assertNotEmpty($suggestions);
        self::assertLessThan($lowIndex, $highIndex);
        self::assertGreaterThan(
            floatval($suggestions[$lowIndex]['score'] ?? 0),
            floatval($suggestions[$highIndex]['score'] ?? 0)
        );
    }

    public function testSuggestionsExcludeTrainerWithoutAvailability(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $academicYear = currentAcademicYear();
        $specialite = 'Reseau ' . strtoupper($suffix);
        $availableTrainer = $this->insertTrainer($suffix . 'a', $specialite, 120);
        $unavailableTrainer = $this->insertTrainer($suffix . 'b', $specialite, 50);
        $existingHeavyModule = $this->insertModule($suffix . 'h', 'LOAD-' . strtoupper(substr($suffix, 0, 4)), $specialite, 45, 'S1');
        $targetModule = $this->insertModule($suffix . 't', 'NET-' . strtoupper(substr($suffix, 0, 4)), $specialite, 12, 'S2');

        $this->insertAffectation($unavailableTrainer, $existingHeavyModule, $academicYear);

        $suggestions = $this->service->suggestions($targetModule);
        $suggestedIds = array_map(static fn(array $row): int => intval($row['id']), $suggestions);

        self::assertContains($availableTrainer, $suggestedIds);
        self::assertNotContains($unavailableTrainer, $suggestedIds);
    }

    public function testSuggestionsRankingIsDeterministic(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $specialite = 'Deterministic ' . strtoupper($suffix);
        $this->insertTrainer($suffix . 'a', $specialite);
        $this->insertTrainer($suffix . 'b', $specialite);
        $this->insertTrainer($suffix . 'c', $specialite);
        $targetModule = $this->insertModule($suffix . 't', 'DET-' . strtoupper(substr($suffix, 0, 4)), $specialite, 20, 'S1');

        $firstRun = array_map(static fn(array $row): int => intval($row['id'] ?? 0), $this->service->suggestions($targetModule));
        $secondRun = array_map(static fn(array $row): int => intval($row['id'] ?? 0), $this->service->suggestions($targetModule));

        self::assertSame($firstRun, $secondRun);
    }

    public function testTieBreakingUsesStableTrainerOrder(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $specialite = 'Tie Break ' . strtoupper($suffix);
        $firstTrainer = $this->insertTrainer($suffix . 'a', $specialite, 200);
        $secondTrainer = $this->insertTrainer($suffix . 'b', $specialite, 200);
        $targetModule = $this->insertModule($suffix . 't', 'TIE-' . strtoupper(substr($suffix, 0, 4)), $specialite, 14, 'S1');

        $suggestions = $this->service->suggestions($targetModule);
        $firstIndex = $this->findSuggestionIndex($suggestions, $firstTrainer);
        $secondIndex = $this->findSuggestionIndex($suggestions, $secondTrainer);

        self::assertSame(
            floatval($suggestions[$firstIndex]['score'] ?? 0),
            floatval($suggestions[$secondIndex]['score'] ?? 0)
        );
        self::assertLessThan($secondIndex, $firstIndex);
    }

    public function testSuggestionsHandleMissingQuestionnaireScoreSafely(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $specialite = 'Fallback Score ' . strtoupper($suffix);
        $trainerId = $this->insertTrainer($suffix, $specialite);
        $targetModule = $this->insertModule($suffix . 't', 'FBK-' . strtoupper(substr($suffix, 0, 4)), $specialite, 18, 'S1');

        $suggestion = $this->findSuggestion($this->service->suggestions($targetModule), $trainerId);

        self::assertGreaterThanOrEqual(0, floatval($suggestion['score'] ?? 0));
        self::assertSame(0.0, floatval($suggestion['reason']['components']['questionnaire_score'] ?? -1));
    }

    public function testSuggestionsHandleZeroQuestionnaireScoreSafely(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $specialite = 'Zero Score ' . strtoupper($suffix);
        $trainerId = $this->insertTrainer($suffix, $specialite, 220);
        $targetModule = $this->insertModule($suffix . 't', 'ZER-' . strtoupper(substr($suffix, 0, 4)), $specialite, 16, 'S1');
        $this->insertModuleScore($trainerId, $targetModule, 0);

        $suggestion = $this->findSuggestion($this->service->suggestions($targetModule), $trainerId);

        self::assertGreaterThanOrEqual(0, floatval($suggestion['score'] ?? 0));
        self::assertSame(0.0, floatval($suggestion['reason']['components']['questionnaire_score'] ?? -1));
    }

    public function testSuggestionsReturnEmptyArrayWhenNoEligibleCandidateExists(): void
    {
        $suffix = bin2hex(random_bytes(4));
        $specialite = 'No Candidate ' . strtoupper($suffix);
        $this->insertTrainer($suffix . 'a', $specialite, 10);
        $this->insertTrainer($suffix . 'b', $specialite, 8);
        $targetModule = $this->insertModule($suffix . 't', 'NONE-' . strtoupper(substr($suffix, 0, 4)), $specialite, 2000, 'S1');

        self::assertSame([], $this->service->suggestions($targetModule));
    }

    private function findSuggestion(array $suggestions, int $trainerId): array
    {
        foreach ($suggestions as $suggestion) {
            if (intval($suggestion['id'] ?? 0) === $trainerId) {
                return $suggestion;
            }
        }

        self::fail('Suggestion introuvable pour le formateur attendu.');
    }

    private function findSuggestionIndex(array $suggestions, int $trainerId): int
    {
        foreach ($suggestions as $index => $suggestion) {
            if (intval($suggestion['id'] ?? 0) === $trainerId) {
                return $index;
            }
        }

        self::fail('Position de suggestion introuvable pour le formateur attendu.');
    }

    private function insertTrainer(string $suffix, string $specialite, int $maxHours = 910): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateurs (nom, email, telephone, specialite, max_heures, current_hours, weekly_hours)
             VALUES (:nom, :email, :telephone, :specialite, :max_heures, :current_hours, :weekly_hours)'
        );
        $stmt->execute([
            'nom' => 'Smart Trainer ' . $suffix,
            'email' => 'smart.' . $suffix . '@example.com',
            'telephone' => '+212600' . substr(md5($suffix), 0, 6),
            'specialite' => $specialite,
            'max_heures' => $maxHours,
            'current_hours' => 0,
            'weekly_hours' => 12,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertModule(string $suffix, string $code, string $filiere, int $hours, string $semester = 'S1'): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO modules (code, intitule, filiere, semestre, volume_horaire, has_efm)
             VALUES (:code, :intitule, :filiere, :semestre, :volume_horaire, :has_efm)'
        );
        $stmt->execute([
            'code' => $code,
            'intitule' => 'Module ' . $suffix,
            'filiere' => $filiere,
            'semestre' => $semester,
            'volume_horaire' => $hours,
            'has_efm' => 0,
        ]);

        return intval($this->db->lastInsertId());
    }

    private function insertAffectation(int $formateurId, int $moduleId, int $annee): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO affectations (formateur_id, module_id, annee)
             VALUES (:formateur_id, :module_id, :annee)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'annee' => $annee,
        ]);
    }

    private function insertModuleScore(int $formateurId, int $moduleId, float $percentage): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateur_module_scores (formateur_id, module_id, score, last_updated_at)
             VALUES (:formateur_id, :module_id, :score, NOW())'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'score' => round($percentage, 2),
        ]);
    }

    private function insertEvaluationScore(int $formateurId, float $percentage): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO evaluation_scores (formateur_id, total_score, max_score, percentage)
             VALUES (:formateur_id, :total_score, :max_score, :percentage)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'total_score' => round($percentage, 2),
            'max_score' => 100,
            'percentage' => round($percentage, 2),
        ]);
    }
}
