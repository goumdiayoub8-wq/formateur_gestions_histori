<?php

date_default_timezone_set('Africa/Casablanca');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/DashboardService.php';
require_once __DIR__ . '/../services/PlanningService.php';
require_once __DIR__ . '/../repositories/DashboardRepository.php';

$GLOBALS['test_db_connection'] = $conn;
