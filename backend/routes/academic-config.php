<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/AcademicConfigController.php';

$controller = new AcademicConfigController($conn);
$method = requestMethod();

if ($method === 'GET') {
    requireRole([1, 2, 3]);
    $controller->show();
    return;
}

if ($method === 'POST') {
    requireRole([1]);
    $controller->store();
    return;
}

throw new NotFoundException('Route academic-config non trouvee.');
