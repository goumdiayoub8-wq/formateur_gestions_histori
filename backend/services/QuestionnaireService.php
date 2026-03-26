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

    public function getQuestions(?int $formateurId = null): array
    {
        $questionnaire = $this->questionnaires->getActiveQuestionnaire();

        if (!$questionnaire) {
            throw new NotFoundException('Aucun questionnaire actif n est disponible.');
        }

        $questions = array_map(static function (array $question): array {
            return [
                'id' => intval($question['id']),
                'questionnaire_id' => intval($question['questionnaire_id']),
                'question_text' => $question['question_text'],
                'type' => $question['type'],
                'weight' => round(floatval($question['weight'] ?? 0), 2),
                'created_at' => $question['created_at'],
            ];
        }, $this->questionnaires->getQuestions(intval($questionnaire['id'])));

        $score = null;
        $existingAnswers = [];

        if ($formateurId !== null) {
            $this->assertFormateurExists($formateurId);
            $score = $this->formatScore($this->questionnaires->getScoreByFormateur($formateurId));

            foreach ($this->questionnaires->getAnswersByFormateur($formateurId, intval($questionnaire['id'])) as $answer) {
                $existingAnswers[(string) intval($answer['question_id'])] = $answer['value'];
            }
        }

        return [
            'questionnaire' => [
                'id' => intval($questionnaire['id']),
                'title' => $questionnaire['title'],
                'created_at' => $questionnaire['created_at'],
            ],
            'questions' => $questions,
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
            throw new ValidationException('Le questionnaire ne contient aucune question.');
        }

        $normalizedAnswers = $this->normalizeAnswers($questions, $answers);
        $score = $this->calculateScore($questions, $normalizedAnswers);

        $this->db->beginTransaction();

        try {
            foreach ($questions as $question) {
                $questionId = intval($question['id']);
                $value = $normalizedAnswers[$questionId] ?? '';

                if ($question['type'] === 'text' && trim((string) $value) === '') {
                    continue;
                }

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
            $type = (string) ($question['type'] ?? '');
            $value = $answers[$questionId] ?? null;

            if ($type === 'rating') {
                $numericValue = intval($value);
                $totalScore += $numericValue * $weight;
                $maxScore += 5 * $weight;
                continue;
            }

            if ($type === 'yes/no') {
                $numericValue = $this->normalizeYesNoValue($value) === 'yes' ? 1 : 0;
                $totalScore += $numericValue * $weight;
                $maxScore += 1 * $weight;
            }
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
            $type = (string) ($question['type'] ?? '');
            $value = $normalized[$questionId] ?? null;
            $isEmpty = $value === null || trim((string) $value) === '';

            if ($type !== 'text' && $isEmpty) {
                throw new ValidationException('Merci de repondre a toutes les questions obligatoires.');
            }
        }

        return $normalized;
    }

    private function normalizeQuestionValue(array $question, $value): ?string
    {
        $type = (string) ($question['type'] ?? '');

        if ($type === 'rating') {
            if ($value === null || $value === '') {
                return null;
            }

            if (filter_var($value, FILTER_VALIDATE_INT) === false) {
                throw new ValidationException('Les reponses rating doivent etre comprises entre 1 et 5.');
            }

            $numericValue = intval($value);
            if ($numericValue < 1 || $numericValue > 5) {
                throw new ValidationException('Les reponses rating doivent etre comprises entre 1 et 5.');
            }

            return (string) $numericValue;
        }

        if ($type === 'yes/no') {
            if ($value === null || $value === '') {
                return null;
            }

            return $this->normalizeYesNoValue($value);
        }

        if ($value === null) {
            return '';
        }

        $normalized = trim((string) $value);
        if (mb_strlen($normalized) > 1000) {
            throw new ValidationException('Une reponse texte depasse la taille autorisee.');
        }

        return $normalized;
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
