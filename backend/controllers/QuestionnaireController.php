<?php

require_once __DIR__ . '/../services/QuestionnaireService.php';
require_once __DIR__ . '/../services/FormateurService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class QuestionnaireController
{
    private QuestionnaireService $questionnaires;
    private FormateurService $formateurs;

    public function __construct(PDO $db)
    {
        $this->questionnaires = new QuestionnaireService($db);
        $this->formateurs = new FormateurService($db);
    }

    public function getQuestionnaire(): void
    {
        $userId = requireRole([1, 2, 3]);
        $formateurId = $this->resolveFormateurId($userId, false);
        $payload = $this->questionnaires->getQuestions($formateurId);

        jsonResponse([
            'status' => 'success',
            'data' => $payload,
            'questionnaire' => $payload,
        ]);
    }

    public function submit(): void
    {
        $userId = requireRole([3]);
        $formateur = $this->formateurs->findByUserId($userId);
        $payload = readJsonBody();
        $answers = $payload['answers'] ?? null;

        if (!is_array($answers)) {
            throw new ValidationException('Le tableau des reponses est obligatoire.');
        }

        $score = $this->questionnaires->submitAnswers(intval($formateur['id']), $answers);

        jsonResponse([
            'status' => 'success',
            'message' => 'Questionnaire soumis avec succes.',
            'data' => $score,
            'score' => $score,
        ], 201);
    }

    public function getScore(): void
    {
        $userId = requireRole([1, 2, 3]);
        $formateurId = $this->resolveFormateurId($userId, true);
        $score = $this->questionnaires->getScore($formateurId);

        jsonResponse([
            'status' => 'success',
            'data' => $score,
            'score' => $score,
        ]);
    }

    private function resolveFormateurId(int $userId, bool $requiredForManagers): ?int
    {
        $roleId = currentUserRoleId();

        if ($roleId === 3) {
            $formateur = $this->formateurs->findByUserId($userId);
            return intval($formateur['id']);
        }

        $requestedFormateurId = InputValidator::integer(
            ['formateur_id' => requestQuery('formateur_id')],
            'formateur_id',
            'formateur',
            $requiredForManagers,
            1
        );

        return $requestedFormateurId;
    }
}
