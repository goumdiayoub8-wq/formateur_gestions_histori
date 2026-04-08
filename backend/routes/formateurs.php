<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/FormateurController.php';

$segments = routeSegmentsAfterRoot();
$method = requestMethod();

$controller = new FormateurController($conn);
$id = !empty($segments[0]) ? intval($segments[0]) : null;
$child = $segments[1] ?? null;

if ($method === 'GET' && $id === null) {
    requireAuth();
    $controller->index();
    return;
}

if ($method === 'POST' && $id === null) {
    requireRole([1, 2]);
    $controller->store();
    return;
}

if ($id !== null && $child === 'hours' && $method === 'GET') {
    requireAuth();
    $controller->hours($id);
    return;
}

if ($id !== null && $child === 'module-preferences' && $method === 'GET') {
    requireRole([1, 2]);
    $controller->getTrainerModulePreferences($id);
    return;
}

if ($id !== null && $child === 'module-preferences' && in_array($method, ['PUT', 'PATCH'], true)) {
    requireRole([1, 2]);
    $controller->reviewTrainerModulePreferences($id);
    return;
}

if ($id !== null && $method === 'GET') {
    requireAuth();
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

throw new NotFoundException('Route formateurs non trouvee.');
