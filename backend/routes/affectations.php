<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/AffectationController.php';

$controller = new AffectationController($conn);
$segments = routeSegmentsAfterRoot();
$method = requestMethod();
$id = !empty($segments[0]) ? intval($segments[0]) : null;

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

if ($id !== null && $method === 'DELETE') {
    requireRole([1, 2]);
    $controller->destroy($id);
    return;
}

throw new NotFoundException('Route affectations non trouvee.');
