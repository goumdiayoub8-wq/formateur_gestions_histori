<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/PlanningController.php';

$controller = new PlanningController($conn);
$segments = routeSegmentsAfterRoot();
$method = requestMethod();
$action = requestQuery('action');
$id = !empty($segments[0]) ? intval($segments[0]) : null;

if ($action === 'validation-dashboard' && $method === 'GET') {
    requireRole([1, 2]);
    $controller->validationDashboard();
    return;
}

if ($action === 'validation-summary' && $method === 'GET') {
    requireRole([1, 2]);
    $controller->validationSummary();
    return;
}

if ($action === 'validation-history' && $method === 'GET') {
    requireRole([1, 2]);
    $controller->validationHistory();
    return;
}

if ($action === 'validation-queue' && $method === 'GET') {
    requireRole([1, 2]);
    $controller->validationQueue();
    return;
}

if ($action === 'validation-detail' && $method === 'GET') {
    requireRole([1, 2]);
    $controller->submissionDetail();
    return;
}

if ($action === 'validation-status' && $method === 'POST') {
    requireRole([1, 2]);
    $controller->updateValidationStatus();
    return;
}

if ($action === 'validation-bulk' && $method === 'POST') {
    requireRole([1, 2]);
    $controller->bulkUpdateValidationStatus();
    return;
}

if ($action === 'weekly' && $method === 'GET') {
    $controller->getWeeklyPlanning();
    return;
}

if ($action === 'sessions' && $method === 'GET') {
    requireAuth();
    $controller->getSessions();
    return;
}

if ($action === 'session-options' && $method === 'GET') {
    requireRole([1, 2]);
    $controller->getSessionOptions();
    return;
}

if ($action === 'visibility' && $method === 'GET') {
    requireAuth();
    $controller->getTrainerVisibility();
    return;
}

if ($action === 'team-visibility' && $method === 'GET') {
    $controller->getTeamVisibility();
    return;
}

if ($action === 'stats' && $method === 'GET') {
    $controller->getWeeklyStats();
    return;
}

if ($action === 'session-status' && $method === 'POST') {
    requireAuth();
    $controller->updateSessionStatus();
    return;
}

if ($action === 'entry-decision' && $method === 'POST') {
    $controller->createEntryDecisionRequest();
    return;
}

if ($action === 'entry-status' && $method === 'POST') {
    requireRole([1, 2]);
    $controller->reviewEntryDecisionRequest();
    return;
}

if ($action === 'entry' && in_array($method, ['POST', 'PUT'], true)) {
    requireAuth();
    $controller->saveWeeklyEntry();
    return;
}

if ($action === 'delete-entry' && in_array($method, ['POST', 'DELETE'], true)) {
    requireAuth();
    $controller->deleteWeeklyEntry();
    return;
}

if ($action === 'mes-modules' && $method === 'GET') {
    $controller->getMesModules();
    return;
}

if ($method === 'GET' && $id === null) {
    $controller->index();
    return;
}

if ($method === 'POST' && $id === null) {
    requireAuth();
    $controller->store();
    return;
}

if ($id !== null && $method === 'GET') {
    $controller->show($id);
    return;
}

if ($id !== null && in_array($method, ['PUT', 'PATCH'], true)) {
    requireAuth();
    $controller->update($id);
    return;
}

if ($id !== null && $method === 'DELETE') {
    requireAuth();
    $controller->destroy($id);
    return;
}

throw new NotFoundException('Route planning non trouvee.');
