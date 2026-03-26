<?php

require_once __DIR__ . '/../services/FormateurService.php';
require_once __DIR__ . '/../services/ModuleService.php';
require_once __DIR__ . '/../services/DashboardService.php';
require_once __DIR__ . '/../core/helpers.php';

class ChefPoleController
{
    private DashboardService $dashboard;

    public function __construct(PDO $db)
    {
        $this->dashboard = new DashboardService($db);
    }

    public function notifications(): void
    {
        $payload = $this->dashboard->chefNotifications();

        jsonResponse([
            'status' => 'success',
            'data' => $payload,
            'count' => $payload['count'],
            'notifications' => $payload['notifications'],
        ]);
    }
}
