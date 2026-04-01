<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/FormateurController.php';

$controller = new FormateurController($conn);
$method = requestMethod();
$action = requestQuery('action');
$segments = routeSegmentsAfterRoot();
$child = $segments[0] ?? null;

if ($method === 'GET' && $action === 'profil') {
    $controller->getProfil();
    return;
}

if ($method === 'GET' && $action === 'notifications') {
    $controller->getNotifications();
    return;
}

if ($method === 'GET' && $action === 'demandes') {
    $controller->getDemandesOverview();
    return;
}

if ($method === 'GET' && $action === 'modules-questionnaires') {
    $controller->getModulesQuestionnaires();
    return;
}

if ($method === 'GET' && $child === 'modules-questionnaires') {
    $controller->getModulesQuestionnaires();
    return;
}

if ($method === 'POST' && $action === 'demandes') {
    $controller->createDemande();
    return;
}

throw new NotFoundException('Route formateur non trouvee.');
