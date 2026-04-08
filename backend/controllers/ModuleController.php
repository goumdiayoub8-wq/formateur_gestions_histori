<?php

require_once __DIR__ . '/../services/ModuleService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class ModuleController
{
    private ModuleService $modules;

    public function __construct(PDO $db)
    {
        $this->modules = new ModuleService($db);
    }

    private function modulePayload(array $payload): array
    {
        $intitule = $payload['intitule'] ?? $payload['nom'] ?? null;
        $filiere = $payload['filiere'] ?? $payload['filiere_nom'] ?? null;

        if ($filiere === null && !empty($payload['filiere_id'])) {
            $filiere = 'Filiere ' . intval($payload['filiere_id']);
        }

        return [
            'code' => isset($payload['code']) ? InputValidator::string(['code' => $payload['code']], 'code', 'code', false, 30) : null,
            'intitule' => InputValidator::string(['intitule' => $intitule], 'intitule', 'intitule'),
            'filiere' => InputValidator::string(['filiere' => $filiere], 'filiere', 'filiere'),
            'semestre' => InputValidator::oneOf(['semestre' => $payload['semestre'] ?? null], 'semestre', 'semestre', ['S1', 'S2']),
            'volume_horaire' => InputValidator::integer(
                ['volume_horaire' => $payload['volume_horaire'] ?? $payload['mh_totale'] ?? null],
                'volume_horaire',
                'volume horaire',
                true,
                1
            ),
            'has_efm' => InputValidator::boolean(['has_efm' => $payload['has_efm'] ?? $payload['efm'] ?? null], 'has_efm', false),
        ];
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
        $filters = [
            'search' => trim((string) (requestQuery('search') ?? requestQuery('q') ?? '')),
            'filiere' => requestQuery('filiere'),
            'semestre' => requestQuery('semestre'),
            'has_efm' => requestQuery('has_efm') !== null ? parseBoolean(requestQuery('has_efm')) : null,
            'formateur_id' => requestQuery('formateur_id'),
            'annee' => requestQuery('annee') !== null ? intval(requestQuery('annee')) : currentAcademicYear(),
        ];
        $payload = $this->modules->paginate($page, $limit, $filters);
        $rows = $payload['data'];

        jsonResponse([
            'data' => $rows,
            'total_items' => $payload['total_items'],
            'total_pages' => $payload['total_pages'],
            'current_page' => $payload['current_page'],
        ]);
    }

    public function show(int $id): void
    {
        $row = $this->modules->find($id);

        jsonResponse([
            'status' => 'success',
            'data' => $row,
            'module' => $row,
        ]);
    }

    public function store(): void
    {
        $created = $this->modules->create($this->modulePayload(readJsonBody()));

        jsonResponse([
            'status' => 'success',
            'message' => 'Module cree.',
            'data' => $created,
            'module' => $created,
        ], 201);
    }

    public function update(int $id): void
    {
        $updated = $this->modules->update($id, $this->modulePayload(readJsonBody()));

        jsonResponse([
            'status' => 'success',
            'message' => 'Module mis a jour.',
            'data' => $updated,
            'module' => $updated,
        ]);
    }

    public function destroy(int $id): void
    {
        $this->modules->delete($id);
        noContentResponse();
    }

    public function progressSummary(): void
    {
        $summary = $this->modules->progressSummary(currentAcademicYear());

        jsonResponse([
            'status' => 'success',
            'data' => $summary,
            'summary' => $summary,
        ]);
    }

    public function progressList(): void
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
        $filters = [
            'annee' => currentAcademicYear(),
            'q' => requestQuery('q'),
            'module_id' => requestQuery('module_id'),
            'groupe_id' => requestQuery('groupe_id'),
        ];
        $payload = $this->modules->progressPaginate($page, $limit, $filters);

        jsonResponse([
            'data' => $payload['data'],
            'total_items' => $payload['total_items'],
            'total_pages' => $payload['total_pages'],
            'current_page' => $payload['current_page'],
        ]);
    }
}
