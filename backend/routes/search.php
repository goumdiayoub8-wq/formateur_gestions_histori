<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/SearchController.php';

requireRole([1, 2]);

$controller = new SearchController($conn);
$method = requestMethod();

if ($method === 'GET') {
    $controller->index();
    return;
}

throw new NotFoundException('Route search non trouvee.');
