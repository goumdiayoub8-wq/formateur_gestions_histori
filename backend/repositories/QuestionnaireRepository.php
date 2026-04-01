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
             ORDER BY created_at DESC, id DESC
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

    public function getAnswersByFormateur(int $formateurId, int $questionnaireId, ?int $moduleId = null): array
    {
        $moduleCondition = $moduleId !== null
            ? 'AND a.module_id = :module_id'
            : 'AND a.module_id IS NULL';
        $stmt = $this->db->prepare(
            'SELECT
                a.id,
                a.formateur_id,
                a.module_id,
                a.question_id,
                a.value,
                a.created_at
             FROM evaluation_answers a
             INNER JOIN evaluation_questions q ON q.id = a.question_id
             WHERE a.formateur_id = :formateur_id
               AND q.questionnaire_id = :questionnaire_id
               ' . $moduleCondition . '
             ORDER BY a.question_id ASC'
        );
        $params = [
            'formateur_id' => $formateurId,
            'questionnaire_id' => $questionnaireId,
        ];
        if ($moduleId !== null) {
            $params['module_id'] = $moduleId;
        }
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function getGlobalScoresByQuestionnaire(int $questionnaireId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                q.id AS question_id,
                COUNT(a.id) AS submissions_count,
                AVG(
                    CASE
                        WHEN LOWER(TRIM(a.value)) IN ("yes", "oui", "true") THEN 5
                        WHEN LOWER(TRIM(a.value)) IN ("no", "non", "false") THEN 1
                        WHEN a.value REGEXP "^[0-9]+(\\.[0-9]+)?$" THEN LEAST(5, GREATEST(1, CAST(a.value AS DECIMAL(10,2))))
                        ELSE NULL
                    END
                ) AS average_rating
             FROM evaluation_questions q
             LEFT JOIN evaluation_answers a ON a.question_id = q.id
             WHERE q.questionnaire_id = :questionnaire_id
             GROUP BY q.id
             ORDER BY q.id ASC'
        );
        $stmt->execute(['questionnaire_id' => $questionnaireId]);

        return $stmt->fetchAll();
    }

    public function getScoreByFormateur(int $formateurId, ?int $moduleId = null): ?array
    {
        $moduleCondition = $moduleId !== null
            ? 'AND module_id = :module_id'
            : 'AND module_id IS NULL';
        $stmt = $this->db->prepare(
            'SELECT
                id,
                formateur_id,
                module_id,
                total_score,
                max_score,
                percentage,
                created_at
             FROM evaluation_scores
             WHERE formateur_id = :formateur_id
               ' . $moduleCondition . '
             ORDER BY created_at DESC, id DESC
             LIMIT 1'
        );
        $params = ['formateur_id' => $formateurId];
        if ($moduleId !== null) {
            $params['module_id'] = $moduleId;
        }
        $stmt->execute($params);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function hasSubmitted(int $formateurId, ?int $moduleId = null): bool
    {
        return $this->getScoreByFormateur($formateurId, $moduleId) !== null;
    }

    public function createAnswer(int $formateurId, ?int $moduleId, int $questionId, string $value): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO evaluation_answers (formateur_id, module_id, question_id, value)
             VALUES (:formateur_id, :module_id, :question_id, :value)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'question_id' => $questionId,
            'value' => $value,
        ]);
    }

    public function createScore(int $formateurId, ?int $moduleId, array $data): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO evaluation_scores (formateur_id, module_id, total_score, max_score, percentage)
             VALUES (:formateur_id, :module_id, :total_score, :max_score, :percentage)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'total_score' => $data['total_score'],
            'max_score' => $data['max_score'],
            'percentage' => $data['percentage'],
        ]);

        return $this->getScoreByFormateur($formateurId, $moduleId) ?: [];
    }

    public function getFormateurModuleScore(int $formateurId, int $moduleId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT
                id,
                formateur_id,
                module_id,
                score,
                last_updated_at
             FROM formateur_module_scores
             WHERE formateur_id = :formateur_id
               AND module_id = :module_id
             LIMIT 1'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
        ]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function getFormateurModuleQuestionnaireRows(int $formateurId, int $academicYear): array
    {
        $stmt = $this->db->prepare(
            'SELECT DISTINCT
                m.id AS module_id,
                m.intitule AS module_name,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.semestre AS module_semester,
                mq.questionnaire_id,
                mq.questionnaire_token,
                fms.score
             FROM affectations a
             INNER JOIN modules m ON m.id = a.module_id
             LEFT JOIN module_questionnaires mq ON mq.module_id = m.id
             LEFT JOIN formateur_module_scores fms
                ON fms.module_id = m.id
               AND fms.formateur_id = :score_formateur_id
             WHERE a.formateur_id = :assignment_formateur_id
               AND a.annee = :academic_year
             ORDER BY
                CASE m.semestre WHEN "S1" THEN 1 ELSE 2 END,
                m.intitule ASC'
        );
        $stmt->execute([
            'score_formateur_id' => $formateurId,
            'assignment_formateur_id' => $formateurId,
            'academic_year' => $academicYear,
        ]);

        return $stmt->fetchAll();
    }

    public function findAccessibleQuestionnaireToken(int $formateurId, string $questionnaireToken, int $academicYear): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT DISTINCT
                mq.module_id,
                mq.questionnaire_id,
                mq.questionnaire_token,
                COALESCE(m.code, CONCAT("M", LPAD(m.id, 3, "0"))) AS module_code,
                m.intitule AS module_name
             FROM affectations a
             INNER JOIN module_questionnaires mq ON mq.module_id = a.module_id
             INNER JOIN modules m ON m.id = mq.module_id
             WHERE a.formateur_id = :formateur_id
               AND a.annee = :academic_year
               AND (mq.questionnaire_token = :questionnaire_token OR mq.questionnaire_id = :legacy_questionnaire_id)
             LIMIT 1'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'academic_year' => $academicYear,
            'questionnaire_token' => $questionnaireToken,
            'legacy_questionnaire_id' => $questionnaireToken,
        ]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function getModuleScoreRankings(array $moduleIds): array
    {
        $normalizedModuleIds = array_values(array_unique(array_filter(array_map('intval', $moduleIds))));
        if ($normalizedModuleIds === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($normalizedModuleIds), '?'));
        $stmt = $this->db->prepare(
            'SELECT
                module_id,
                formateur_id,
                score
             FROM formateur_module_scores
             WHERE module_id IN (' . $placeholders . ')
             ORDER BY module_id ASC, score DESC, formateur_id ASC'
        );
        $stmt->execute($normalizedModuleIds);

        return $stmt->fetchAll();
    }

    public function upsertFormateurModuleScore(int $formateurId, int $moduleId, float $score): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formateur_module_scores (formateur_id, module_id, score, last_updated_at)
             VALUES (:formateur_id, :module_id, :score, NOW())
             ON DUPLICATE KEY UPDATE
                score = VALUES(score),
                last_updated_at = VALUES(last_updated_at)'
        );
        $stmt->execute([
            'formateur_id' => $formateurId,
            'module_id' => $moduleId,
            'score' => round(max(0.0, min(100.0, $score)), 2),
        ]);

        return $this->getFormateurModuleScore($formateurId, $moduleId) ?: [];
    }
}
