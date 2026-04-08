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
        $page = InputValidator::integer(
            ['page' => requestQuery('page')],
            'page',
            'page',
            false,
            1
        ) ?? 1;
        $limit = InputValidator::integer(
            ['limit' => requestQuery('limit')],
            'limit',
            'limit',
            false,
            1,
            100
        ) ?? 5;
        $payload = $this->affectations->paginate($page, $limit, [
            'search' => trim((string) (requestQuery('search') ?? requestQuery('q') ?? '')),
            'formateur_id' => requestQuery('formateur_id'),
            'module_id' => requestQuery('module_id'),
            'annee' => requestQuery('annee'),
        ]);
        $rows = $payload['data'];

        jsonResponse([
            'data' => $rows,
            'total_items' => $payload['total_items'],
            'total_pages' => $payload['total_pages'],
            'current_page' => $payload['current_page'],
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
