<?php

require_once __DIR__ . '/../repositories/QuestionnaireRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../core/HttpException.php';

class QuestionnaireService
{
    private PDO $db;
    private QuestionnaireRepository $questionnaires;
    private FormateurRepository $formateurs;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->questionnaires = new QuestionnaireRepository($db);
        $this->formateurs = new FormateurRepository($db);
    }

    private function normalizeStoredRating($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, ['yes', 'oui', 'true'], true)) {
            return 5;
        }

        if (in_array($normalized, ['no', 'non', 'false'], true)) {
            return 1;
        }

        if (!is_numeric($value)) {
            return null;
        }

        return max(1, min(5, intval(round(floatval($value)))));
    }

    private function inferSkills(string $text): array
    {
        $normalized = strtolower($text);
        $skills = [];

        if (str_contains($normalized, 'contenu') || str_contains($normalized, 'module')) {
            $skills[] = 'Pedagogie';
        }

        if (str_contains($normalized, 'explique') || str_contains($normalized, 'support')) {
            $skills[] = 'Communication';
        }

        if (str_contains($normalized, 'interagit') || str_contains($normalized, 'constructive')) {
            $skills[] = 'Soft Skills';
        }

        if (str_contains($normalized, 'horaire') || str_contains($normalized, 'planning')) {
            $skills[] = 'Organisation';
        }

        if ($skills === []) {
            $skills[] = 'Soft Skills';
        }

        return array_values(array_unique($skills));
    }

    private function buildModelDefinition(array $question, int $index, array $globalScores, array $existingAnswers): array
    {
        $raw = trim((string) ($question['question_text'] ?? ''));
        $decoded = json_decode($raw, true);
        $name = $raw;
        $description = 'Evaluation simple de ce modele pedagogique.';
        $skills = $this->inferSkills($raw);

        if (is_array($decoded) && !empty($decoded['name'])) {
            $name = trim((string) $decoded['name']);
            $description = trim((string) ($decoded['description'] ?? $description));
            $skills = is_array($decoded['skills'] ?? null) && $decoded['skills'] !== []
                ? array_values(array_filter(array_map(static fn($skill) => trim((string) $skill), $decoded['skills'])))
                : $skills;
        }

        if ($name === '') {
            $name = 'Modele ' . ($index + 1);
        }

        $globalScore = $globalScores[intval($question['id'])] ?? [
            'average_rating' => null,
            'percentage' => null,
            'submissions_count' => 0,
        ];
        $currentScore = $existingAnswers[(string) intval($question['id'])] ?? null;

        return [
            'id' => intval($question['id']),
            'questionnaire_id' => intval($question['questionnaire_id']),
            'name' => $name,
            'description' => $description,
            'skills' => $skills,
            'question_text' => $name,
            'type' => 'rating',
            'weight' => round(floatval($question['weight'] ?? 0), 2),
            'scale' => [
                'min' => 1,
                'max' => 5,
            ],
            'score' => $currentScore,
            'global_score' => $globalScore,
            'created_at' => $question['created_at'] ?? null,
        ];
    }

    public function getQuestions(?int $formateurId = null): array
    {
        $questionnaire = $this->questionnaires->getActiveQuestionnaire();

        if (!$questionnaire) {
            throw new NotFoundException('Aucun questionnaire actif n est disponible.');
        }

        $questions = $this->questionnaires->getQuestions(intval($questionnaire['id']));
        $globalScores = [];
        foreach ($this->questionnaires->getGlobalScoresByQuestionnaire(intval($questionnaire['id'])) as $row) {
            $averageRating = $row['average_rating'] !== null ? round(floatval($row['average_rating']), 2) : null;
            $globalScores[intval($row['question_id'])] = [
                'average_rating' => $averageRating,
                'percentage' => $averageRating !== null ? round(($averageRating / 5) * 100, 2) : null,
                'submissions_count' => intval($row['submissions_count'] ?? 0),
            ];
        }

        $score = null;
        $existingAnswers = [];

        if ($formateurId !== null) {
            $this->assertFormateurExists($formateurId);
            $score = $this->formatScore($this->questionnaires->getScoreByFormateur($formateurId));

            foreach ($this->questionnaires->getAnswersByFormateur($formateurId, intval($questionnaire['id'])) as $answer) {
                $existingAnswers[(string) intval($answer['question_id'])] = $this->normalizeStoredRating($answer['value']);
            }
        }

        $models = array_map(function (array $question, int $index) use ($globalScores, $existingAnswers): array {
            return $this->buildModelDefinition($question, $index, $globalScores, $existingAnswers);
        }, $questions, array_keys($questions));

        return [
            'questionnaire' => [
                'id' => intval($questionnaire['id']),
                'title' => $questionnaire['title'],
                'created_at' => $questionnaire['created_at'],
            ],
            'questions' => $models,
            'models' => $models,
            'score' => $score,
            'can_submit' => $formateurId === null ? true : !$this->questionnaires->hasSubmitted($formateurId),
            'existing_answers' => $existingAnswers,
        ];
    }

    public function submitAnswers(int $formateurId, array $answers): array
    {
        $this->assertFormateurExists($formateurId);

        if ($this->questionnaires->hasSubmitted($formateurId)) {
            throw new ConflictException('Ce questionnaire a deja ete soumis pour ce formateur.');
        }

        $questionnaire = $this->questionnaires->getActiveQuestionnaire();
        if (!$questionnaire) {
            throw new NotFoundException('Aucun questionnaire actif n est disponible.');
        }

        $questions = $this->questionnaires->getQuestions(intval($questionnaire['id']));
        if (count($questions) === 0) {
            throw new ValidationException('Le questionnaire ne contient aucun modele.');
        }

        $normalizedAnswers = $this->normalizeAnswers($questions, $answers);
        $score = $this->calculateScore($questions, $normalizedAnswers);

        $this->db->beginTransaction();

        try {
            foreach ($questions as $question) {
                $questionId = intval($question['id']);
                $value = $normalizedAnswers[$questionId] ?? '';

                $this->questionnaires->createAnswer($formateurId, $questionId, (string) $value);
            }

            $createdScore = $this->questionnaires->createScore($formateurId, $score);
            $this->db->commit();

            return $this->formatScore($createdScore) ?: [
                'submitted' => true,
                'total_score' => $score['total_score'],
                'max_score' => $score['max_score'],
                'percentage' => $score['percentage'],
                'message' => $this->getPerformanceMessage($score['percentage']),
                'tone' => $this->getPerformanceTone($score['percentage']),
            ];
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }

    public function calculateScore(array $questions, array $answers): array
    {
        $totalScore = 0.0;
        $maxScore = 0.0;

        foreach ($questions as $question) {
            $questionId = intval($question['id']);
            $weight = round(max(0, floatval($question['weight'] ?? 0)), 2);
            $numericValue = floatval($answers[$questionId] ?? 0);

            $totalScore += $numericValue * $weight;
            $maxScore += 5 * $weight;
        }

        $percentage = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0.0;

        return [
            'total_score' => round($totalScore, 2),
            'max_score' => round($maxScore, 2),
            'percentage' => $percentage,
        ];
    }

    public function getScore(int $formateurId): array
    {
        $this->assertFormateurExists($formateurId);
        $score = $this->formatScore($this->questionnaires->getScoreByFormateur($formateurId));

        return $score ?: [
            'submitted' => false,
            'total_score' => 0,
            'max_score' => 0,
            'percentage' => null,
            'message' => 'Non evalue',
            'tone' => 'slate',
            'created_at' => null,
        ];
    }

    private function assertFormateurExists(int $formateurId): void
    {
        if (!$this->formateurs->find($formateurId)) {
            throw new NotFoundException('Formateur introuvable.');
        }
    }

    private function normalizeAnswers(array $questions, array $answers): array
    {
        $questionMap = [];
        foreach ($questions as $question) {
            $questionMap[intval($question['id'])] = $question;
        }

        $normalized = [];
        foreach ($answers as $key => $answer) {
            if (is_array($answer) && array_key_exists('question_id', $answer)) {
                $questionId = intval($answer['question_id']);
                $value = $answer['value'] ?? null;
            } else {
                $questionId = intval($key);
                $value = $answer;
            }

            if ($questionId <= 0 || !isset($questionMap[$questionId])) {
                continue;
            }

            $question = $questionMap[$questionId];
            $normalized[$questionId] = $this->normalizeQuestionValue($question, $value);
        }

        foreach ($questionMap as $questionId => $question) {
            $value = $normalized[$questionId] ?? null;
            $isEmpty = $value === null || trim((string) $value) === '';

            if ($isEmpty) {
                throw new ValidationException('Merci de repondre a toutes les questions obligatoires.');
            }
        }

        return $normalized;
    }

    private function normalizeQuestionValue(array $question, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalizedStored = $this->normalizeStoredRating($value);
        if ($normalizedStored !== null) {
            return (string) $normalizedStored;
        }

        throw new ValidationException('Les notes doivent etre comprises entre 1 et 5.');
    }

    private function normalizeYesNoValue($value): string
    {
        $normalized = strtolower(trim((string) $value));

        if (in_array($normalized, ['1', 'true', 'yes', 'oui'], true)) {
            return 'yes';
        }

        if (in_array($normalized, ['0', 'false', 'no', 'non'], true)) {
            return 'no';
        }

        throw new ValidationException('Les reponses oui/non doivent etre egales a yes ou no.');
    }

    private function formatScore(?array $score): ?array
    {
        if (!$score) {
            return null;
        }

        $percentage = round(floatval($score['percentage'] ?? 0), 2);

        return [
            'id' => intval($score['id']),
            'submitted' => true,
            'formateur_id' => intval($score['formateur_id']),
            'total_score' => round(floatval($score['total_score'] ?? 0), 2),
            'max_score' => round(floatval($score['max_score'] ?? 0), 2),
            'percentage' => $percentage,
            'message' => $this->getPerformanceMessage($percentage),
            'tone' => $this->getPerformanceTone($percentage),
            'created_at' => $score['created_at'] ?? null,
        ];
    }

    private function getPerformanceMessage(float $percentage): string
    {
        if ($percentage >= 75) {
            return 'Excellent';
        }

        if ($percentage >= 50) {
            return 'Good';
        }

        return 'Needs improvement';
    }

    private function getPerformanceTone(float $percentage): string
    {
        if ($percentage >= 75) {
            return 'green';
        }

        if ($percentage >= 50) {
            return 'orange';
        }

        return 'red';
    }
}
