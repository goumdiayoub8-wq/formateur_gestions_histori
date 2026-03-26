<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/DashboardController.php';

$controller = new DashboardController($conn);
$method = requestMethod();
$segments = routeSegmentsAfterRoot();
$action = $segments[0] ?? requestQuery('action');

if ($method === 'GET' && $action === null && currentUserRoleId() === 3) {
    requireRole([3]);
    $controller->trainerOverview();
    return;
}

if ($method === 'GET' && in_array($action, ['stats', null], true)) {
    requireRole([1, 2]);
    $controller->stats();
    return;
}

if ($method === 'GET' && $action === 'director-overview') {
    requireRole([1, 2]);
    $controller->directorOverview();
    return;
}

throw new NotFoundException('Route dashboard non trouvee.');
