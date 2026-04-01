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

if ($method === 'POST' && $action === 'generate-assignment-coverage') {
    $controller->generateAssignmentCoverage();
    return;
}

if ($method === 'POST' && $action === 'generate-validation-status') {
    $controller->generateValidationStatus();
    return;
}

if ($method === 'POST' && $action === 'generate-trainer-performance') {
    $controller->generateTrainerPerformance();
    return;
}

if ($method === 'POST' && $action === 'generate-teaching-hours') {
    $controller->generateTeachingHours();
    return;
}

if ($method === 'POST' && $action === 'generate-questionnaire-results') {
    $controller->generateQuestionnaireResults();
    return;
}

if ($method === 'POST' && $action === 'generate-global-platform-summary') {
    $controller->generateGlobalPlatformSummary();
    return;
}

if ($method === 'POST' && $action === 'generate-hours-by-department') {
    $controller->generateHoursByDepartment();
    return;
}

if ($method === 'POST' && $action === 'generate-top-trainers') {
    $controller->generateTopTrainers();
    return;
}

if ($method === 'POST' && $action === 'generate-module-success-rates') {
    $controller->generateModuleSuccessRates();
    return;
}

throw new NotFoundException('Route reports non trouvee.');
