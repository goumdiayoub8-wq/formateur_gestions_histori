<?php

require_once __DIR__ . '/../services/AffectationService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class AffectationController
{
    private AffectationService $affectations;

    public function __construct(PDO $db)
    {
        $this->affectations = new AffectationService($db);
    }

    public function index(): void
    {
        $rows = $this->affectations->all([
            'formateur_id' => requestQuery('formateur_id'),
            'module_id' => requestQuery('module_id'),
            'annee' => requestQuery('annee'),
        ]);

        jsonResponse([
            'status' => 'success',
            'data' => $rows,
            'affectations' => $rows,
        ]);
    }

    public function store(): void
    {
        $payload = readJsonBody();
        $created = $this->affectations->create([
            'formateur_id' => InputValidator::integer($payload, 'formateur_id', 'formateur', true, 1),
            'module_id' => InputValidator::integer($payload, 'module_id', 'module', true, 1),
            'annee' => InputValidator::integer($payload, 'annee', 'annee', false, 2000) ?? currentAcademicYear(),
        ]);

        jsonResponse([
            'status' => 'success',
            'message' => 'Affectation creee.',
            'data' => $created,
            'affectation' => $created,
        ], 201);
    }

    public function destroy(int $id): void
    {
        $this->affectations->delete($id);
        noContentResponse();
    }
}
