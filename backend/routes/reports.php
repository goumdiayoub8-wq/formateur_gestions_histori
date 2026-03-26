<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/ReportController.php';

requireRole([1, 2]);

$controller = new ReportController($conn);
$method = requestMethod();
$action = requestQuery('action');

if ($method === 'GET' && $action === 'recent') {
    $controller->recent();
    return;
}

if ($method === 'GET' && $action === 'download') {
    $controller->download();
    return;
}

if ($method === 'POST' && $action === 'generate-workload') {
    $controller->generateWorkload();
    return;
}

if ($method === 'POST' && $action === 'generate-module-progress') {
    $controller->generateModuleProgress();
    return;
}

throw new NotFoundException('Route reports non trouvee.');
