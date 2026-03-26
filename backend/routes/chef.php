<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/ChefPoleController.php';

requireRole([1, 2]);

$controller = new ChefPoleController($conn);
$method = requestMethod();
$action = requestQuery('action');

if ($method === 'GET' && $action === 'notifications') {
    $controller->notifications();
    return;
}

throw new NotFoundException('Route chef non trouvee.');
