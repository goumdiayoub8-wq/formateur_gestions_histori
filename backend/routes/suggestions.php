<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/SmartAssignmentController.php';

requireRole([2]);

$controller = new SmartAssignmentController($conn);

if (requestMethod() === 'GET') {
    $controller->suggestions();
    return;
}

throw new NotFoundException('Route suggestions non trouvee.');
