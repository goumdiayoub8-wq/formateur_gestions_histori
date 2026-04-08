<?php

require_once __DIR__ . '/../repositories/ModuleRepository.php';
require_once __DIR__ . '/../core/HttpException.php';
require_once __DIR__ . '/../core/JsonCache.php';

class ModuleService
{
    private ModuleRepository $modules;

    public function __construct(PDO $db)
    {
        $this->modules = new ModuleRepository($db);
    }

    public function all(array $filters = []): array
    {
        return $this->modules->all($filters);
    }

    public function paginate(int $page = 1, int $limit = 5, array $filters = []): array
    {
        return $this->modules->paginate($page, $limit, $filters);
    }

    public function progressSummary(?int $annee = null): array
    {
        return $this->modules->progressSummary($annee);
    }

    public function progressList(array $filters = []): array
    {
        return $this->modules->progressList($filters);
    }

    public function progressPaginate(int $page = 1, int $limit = 5, array $filters = []): array
    {
        return $this->modules->progressPaginate($page, $limit, $filters);
    }

    public function find(int $id): array
    {
        $module = $this->modules->find($id);
        if (!$module) {
            throw new NotFoundException('Module introuvable.');
        }

        return $module;
    }

    public function create(array $data): array
    {
        if ($this->modules->findDuplicate($data)) {
            throw new ConflictException('Un module equivalent existe deja pour cette filiere et ce semestre.');
        }

        $id = $this->modules->create($data);
        JsonCache::forgetByPrefix('dashboard-');

        return $this->find($id);
    }

    public function update(int $id, array $data): array
    {
        $this->find($id);

        if ($this->modules->findDuplicate($data, $id)) {
            throw new ConflictException('Un autre module equivalent existe deja pour cette filiere et ce semestre.');
        }

        $this->modules->update($id, $data);
        JsonCache::forgetByPrefix('dashboard-');

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $this->find($id);

        if ($this->modules->hasDependencies($id)) {
            throw new ConflictException('Suppression impossible: ce module possede deja des affectations ou du planning.');
        }

        $this->modules->delete($id);
        JsonCache::forgetByPrefix('dashboard-');
    }
}
