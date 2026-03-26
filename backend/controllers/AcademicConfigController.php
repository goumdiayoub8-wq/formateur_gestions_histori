<?php

require_once __DIR__ . '/../services/AcademicConfigService.php';
require_once __DIR__ . '/../core/helpers.php';

class AcademicConfigController
{
    private AcademicConfigService $service;

    public function __construct(PDO $db)
    {
        $this->service = new AcademicConfigService($db);
    }

    public function show(): void
    {
        $config = $this->service->current();

        jsonResponse([
            'status' => 'success',
            'data' => $config,
            'config' => $config,
        ]);
    }

    public function store(): void
    {
        $config = $this->service->save(readJsonBody());

        jsonResponse([
            'status' => 'success',
            'message' => 'Configuration academique enregistree.',
            'data' => $config,
            'config' => $config,
        ]);
    }
}
