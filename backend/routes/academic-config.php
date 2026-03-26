<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/AcademicConfigController.php';

$controller = new AcademicConfigController($conn);
$method = requestMethod();

if ($method === 'GET') {
    requireAuth();
    $controller->show();
    return;
}

if ($method === 'POST') {
    requireRole([1]);
    $controller->store();
    return;
}

throw new NotFoundException('Route academic-config non trouvee.');
