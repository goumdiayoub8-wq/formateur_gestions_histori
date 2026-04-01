<?php

require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../repositories/QuestionnaireRepository.php';
require_once __DIR__ . '/../repositories/UserRepository.php';
require_once __DIR__ . '/../core/HttpException.php';

class FormateurService
{
    private PDO $db;
    private FormateurRepository $formateurs;
    private QuestionnaireRepository $questionnaires;
    private UserRepository $users;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->formateurs = new FormateurRepository($db);
        $this->questionnaires = new QuestionnaireRepository($db);
        $this->users = new UserRepository($db);
    }

    public function all(): array
    {
        return array_map(function (array $row): array {
            $row['hours'] = $this->formateurs->getHoursSummary(intval($row['id']));

            return $row;
        }, $this->formateurs->all());
    }

    public function find(int $id): array
    {
        $formateur = $this->formateurs->find($id);
        if (!$formateur) {
            throw new NotFoundException('Formateur introuvable.');
        }

        $formateur['hours'] = $this->formateurs->getHoursSummary($id);

        return $formateur;
    }

    public function create(array $data): array
    {
        if ($this->formateurs->findByEmail($data['email'])) {
            throw new ConflictException('Un formateur existe deja avec cet email.');
        }

        $this->db->beginTransaction();

        try {
            $formateurId = $this->formateurs->create($data);

            $this->users->create([
                'formateur_id' => $formateurId,
                'nom' => $data['nom'],
                'email' => $data['email'],
                'mot_de_passe' => password_hash($data['mot_de_passe'] ?? 'changeme123', PASSWORD_DEFAULT),
                'role_id' => 3,
                'statut' => 'actif',
            ]);

            $this->db->commit();

            return $this->find($formateurId);
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }

    public function update(int $id, array $data): array
    {
        $existing = $this->find($id);

        if ($this->formateurs->findByEmail($data['email'], $id)) {
            throw new ConflictException('Un autre formateur utilise deja cet email.');
        }

        $this->db->beginTransaction();

        try {
            $this->formateurs->update($id, $data);
            $user = $this->users->findByFormateurId($id);

            if ($user) {
                $this->users->updateByFormateurId($id, [
                    'nom' => $data['nom'],
                    'email' => $data['email'],
                    'statut' => 'actif',
                ]);

                if (!empty($data['mot_de_passe'])) {
                    $this->users->updatePassword(intval($user['id']), password_hash($data['mot_de_passe'], PASSWORD_DEFAULT));
                }
            } else {
                $this->users->create([
                    'formateur_id' => $id,
                    'nom' => $data['nom'],
                    'email' => $data['email'],
                    'mot_de_passe' => password_hash($data['mot_de_passe'] ?? 'changeme123', PASSWORD_DEFAULT),
                    'role_id' => 3,
                    'statut' => 'actif',
                ]);
            }

            $this->db->commit();

            return $this->find($id);
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }

    public function delete(int $id): void
    {
        $this->find($id);

        if ($this->formateurs->hasDependencies($id)) {
            throw new ConflictException('Suppression impossible: ce formateur possede deja des affectations ou du planning.');
        }

        $this->db->beginTransaction();

        try {
            $this->users->deleteByFormateurId($id);
            $this->formateurs->delete($id);
            $this->db->commit();
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }

    public function hours(int $id): array
    {
        $this->find($id);

        return $this->formateurs->getHoursSummary($id);
    }

    public function findByUserId(int $userId): array
    {
        $user = $this->users->findById($userId);

        if (!$user || empty($user['formateur_id'])) {
            throw new NotFoundException('Aucun formateur rattache a cet utilisateur.');
        }

        return $this->find(intval($user['formateur_id']));
    }

    public function moduleQuestionnaires(int $formateurId, int $academicYear): array
    {
        $this->find($formateurId);

        $rows = $this->questionnaires->getFormateurModuleQuestionnaireRows($formateurId, $academicYear);
        $rankings = $this->questionnaires->getModuleScoreRankings(array_map(
            static fn(array $row): int => intval($row['module_id'] ?? 0),
            $rows
        ));

        $rankingMap = [];
        $rankingTotals = [];

        foreach ($rankings as $rankingRow) {
            $moduleId = intval($rankingRow['module_id'] ?? 0);
            $currentRank = ($rankingTotals[$moduleId] ?? 0) + 1;
            $rankingTotals[$moduleId] = $currentRank;
            $rankingMap[$moduleId][intval($rankingRow['formateur_id'] ?? 0)] = $currentRank;
        }

        return array_map(function (array $row) use ($formateurId, $rankingMap, $rankingTotals): array {
            $moduleId = intval($row['module_id'] ?? 0);
            $score = $row['score'] !== null ? round(floatval($row['score']), 2) : null;

            return [
                'module_id' => $moduleId,
                'module_name' => $row['module_name'] ?? '',
                'questionnaire_token' => trim((string) ($row['questionnaire_token'] ?? '')) !== ''
                    ? trim((string) $row['questionnaire_token'])
                    : null,
                'status' => $score !== null ? 'completed' : 'not_started',
                'score' => $score,
                'rank_in_module' => $score !== null ? ($rankingMap[$moduleId][$formateurId] ?? null) : null,
                'total_formateurs' => intval($rankingTotals[$moduleId] ?? 0),
            ];
        }, $rows);
    }
}
