<?php

date_default_timezone_set('Africa/Casablanca');

require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/services/DashboardService.php';
require_once __DIR__ . '/../backend/services/PlanningService.php';
require_once __DIR__ . '/../backend/repositories/DashboardRepository.php';

$GLOBALS['test_db_connection'] = $conn;

function resetBackendTestState(PDO $connection): void
{
    $connection->exec('DELETE FROM request_throttles');
}

function beginBackendTestTransaction(PDO $connection): void
{
    if ($connection->inTransaction()) {
        $connection->rollBack();
    }

    resetBackendTestState($connection);
    $connection->beginTransaction();
}

function rollbackBackendTestTransaction(PDO $connection): void
{
    if ($connection->inTransaction()) {
        $connection->rollBack();
    }
}

resetBackendTestState($conn);
