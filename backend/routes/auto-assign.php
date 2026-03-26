<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/SmartAssignmentController.php';

requireRole([2]);

$controller = new SmartAssignmentController($conn);

if (in_array(requestMethod(), ['GET', 'POST'], true)) {
    $controller->autoAssign();
    return;
}

throw new NotFoundException('Route auto-assign non trouvee.');
