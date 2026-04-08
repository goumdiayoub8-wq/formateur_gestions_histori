<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/QuestionnaireController.php';

$controller = new QuestionnaireController($conn);
$method = requestMethod();
$segments = routeSegmentsAfterRoot();
$child = $segments[0] ?? null;

requireAuth();

if ($method === 'GET' && $child === null) {
    $controller->getQuestionnaire();
    return;
}

if ($method === 'POST' && $child === 'submit') {
    $controller->submit();
    return;
}

if ($method === 'GET' && $child === 'score') {
    $controller->getScore();
    return;
}

throw new NotFoundException('Route questionnaire non trouvee.');
