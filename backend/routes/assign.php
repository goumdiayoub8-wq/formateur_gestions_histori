<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/SmartAssignmentController.php';

requireRole([2]);

$controller = new SmartAssignmentController($conn);

if (requestMethod() === 'POST') {
    $controller->assign();
    return;
}

throw new NotFoundException('Route assign non trouvee.');
