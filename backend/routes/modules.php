<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/ModuleController.php';

$controller = new ModuleController($conn);
$segments = routeSegmentsAfterRoot();
$method = requestMethod();
$action = requestQuery('action');
$id = !empty($segments[0]) ? intval($segments[0]) : null;

if ($method === 'GET' && $action === 'progress-summary') {
    requireRole([1, 2]);
    $controller->progressSummary();
    return;
}

if ($method === 'GET' && $action === 'progress-list') {
    requireRole([1, 2]);
    $controller->progressList();
    return;
}

if ($method === 'GET' && $id === null) {
    $controller->index();
    return;
}

if ($method === 'POST' && $id === null) {
    requireRole([1, 2]);
    $controller->store();
    return;
}

if ($id !== null && $method === 'GET') {
    $controller->show($id);
    return;
}

if ($id !== null && in_array($method, ['PUT', 'PATCH'], true)) {
    requireRole([1, 2]);
    $controller->update($id);
    return;
}

if ($id !== null && $method === 'DELETE') {
    requireRole([1, 2]);
    $controller->destroy($id);
    return;
}

throw new NotFoundException('Route modules non trouvee.');
