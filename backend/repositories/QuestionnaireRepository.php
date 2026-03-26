<?php

class QuestionnaireRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getActiveQuestionnaire(): ?array
    {
        $stmt = $this->db->query(
            'SELECT id, title, created_at
             FROM evaluation_questionnaires
             ORDER BY id ASC
             LIMIT 1'
        );
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function getQuestions(int $questionnaireId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                id,
                questionnaire_id,
                question_text,
                type,
                weight,
                created_at
             FROM evaluation_questions
             WHERE questionnaire_id = :questionnaire_id
             ORDER BY id ASC'
        );
        $stmt->execute(['questionnaire_id' => $questionnaireId]);

        return $stmt->fetchAll();
    }

    public function getAnswersByFormateur(int $formateurId, int $questionnaireId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                a.id,
                a.formateur_id,
                a.question_id,
                a.value,
                a.created_at
             FROM evaluation_answers a
             INNER JOIN evaluation_questions q ON q.id = a.question_id
             WHERE a.formateur_id = :formateur_id
               AND q.questionnaire_id = :questionnaire_id
             ORDER BY a.question_id ASC'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'questionnaire_id' => $questionnaireId,
        ]);

        return $stmt->fetchAll();
    }

    public function getScoreByFormateur(int $formateurId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT
                id,
                formateur_id,
                total_score,
                max_score,
                percentage,
                created_at
             FROM evaluation_scores
             WHERE formateur_id = :formateur_id
             LIMIT 1'
        );
        $stmt->execute(['formateur_id' => $formateurId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function hasSubmitted(int $formateurId): bool
    {
        return $this->getScoreByFormateur($formateurId) !== null;
    }

    public function createAnswer(int $formateurId, int $questionId, string $value): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO evaluation_answers (formateur_id, question_id, value)
             VALUES (:formateur_id, :question_id, :value)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'question_id' => $questionId,
            'value' => $value,
        ]);
    }

    public function createScore(int $formateurId, array $data): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO evaluation_scores (formateur_id, total_score, max_score, percentage)
             VALUES (:formateur_id, :total_score, :max_score, :percentage)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'total_score' => $data['total_score'],
            'max_score' => $data['max_score'],
            'percentage' => $data['percentage'],
        ]);

        return $this->getScoreByFormateur($formateurId) ?: [];
    }
}
