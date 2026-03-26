<?php

require_once __DIR__ . '/../services/SmartAssignmentService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class SmartAssignmentController
{
    private SmartAssignmentService $service;

    public function __construct(PDO $db)
    {
        $this->service = new SmartAssignmentService($db);
    }

    public function suggestions(): void
    {
        $moduleId = InputValidator::integer(
            ['module_id' => requestQuery('module_id')],
            'module_id',
            'module',
            true,
            1
        );

        jsonResponse($this->service->suggestions($moduleId));
    }

    public function assign(): void
    {
        $payload = readJsonBody();

        jsonResponse($this->service->assign(
            InputValidator::integer($payload, 'formateur_id', 'formateur', true, 1),
            InputValidator::integer($payload, 'module_id', 'module', true, 1),
        ));
    }

    public function autoAssign(): void
    {
        $payload = requestMethod() === 'GET' ? ['module_id' => requestQuery('module_id')] : readJsonBody();
        $moduleId = InputValidator::integer($payload, 'module_id', 'module', true, 1);

        jsonResponse($this->service->autoAssignPreview($moduleId));
    }
}
