<?php

require_once __DIR__ . '/../repositories/AffectationRepository.php';
require_once __DIR__ . '/../repositories/SmartAssignmentRepository.php';
require_once __DIR__ . '/../services/ValidationService.php';
require_once __DIR__ . '/../core/HttpException.php';
require_once __DIR__ . '/../core/JsonCache.php';

class AffectationService
{
    private PDO $db;
    private AffectationRepository $affectations;
    private SmartAssignmentRepository $smartAssignments;
    private ValidationService $validation;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->affectations = new AffectationRepository($db);
        $this->smartAssignments = new SmartAssignmentRepository($db);
        $this->validation = new ValidationService($db);
    }

    public function all(array $filters = []): array
    {
        return $this->affectations->all($filters);
    }

    public function paginate(int $page = 1, int $limit = 5, array $filters = []): array
    {
        return $this->affectations->paginate($page, $limit, $filters);
    }

    public function create(array $data): array
    {
        $this->validation->validateAssignment(
            intval($data['formateur_id']),
            intval($data['module_id']),
            intval($data['annee'])
        );

        $this->db->beginTransaction();

        try {
            $id = $this->affectations->create($data);
            $this->smartAssignments->updateTrainerCurrentHours(intval($data['formateur_id']));
            $this->smartAssignments->clearScoreCacheForTrainer(intval($data['formateur_id']));
            $this->smartAssignments->clearScoreCacheForModule(intval($data['module_id']));

            $created = $this->affectations->find($id);

            if (!$created) {
                throw new RuntimeException('Impossible de recuperer l affectation creee.');
            }

            $this->db->commit();
            JsonCache::forgetByPrefix('dashboard-');

            return $created;
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }

    public function delete(int $id): void
    {
        $affectation = $this->affectations->find($id);
        if (!$affectation) {
            throw new NotFoundException('Affectation introuvable.');
        }

        $this->db->beginTransaction();

        try {
            $this->affectations->delete($id);
            $this->smartAssignments->updateTrainerCurrentHours(intval($affectation['formateur_id']));
            $this->smartAssignments->clearScoreCacheForTrainer(intval($affectation['formateur_id']));
            $this->smartAssignments->clearScoreCacheForModule(intval($affectation['module_id']));
            $this->db->commit();
            JsonCache::forgetByPrefix('dashboard-');
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $exception;
        }
    }
}
