<?php

require_once __DIR__ . '/env.php';

loadEnvironment(__DIR__ . '/../.env');

const APP_BOOTSTRAP_VERSION = '2026-03-25-hardening';

function createServerConnection(string $host, string $port, string $username, string $password): PDO
{
    return new PDO(
        sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $host, $port),
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
}

function ensureDatabaseExists(PDO $serverConnection, string $database): void
{
    $escapedDatabase = str_replace('`', '``', $database);
    $serverConnection->exec(sprintf(
        'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        $escapedDatabase
    ));
}

function tableExists(PDO $connection, string $table): bool
{
    $statement = $connection->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name'
    );
    $statement->execute(['table_name' => $table]);

    return intval($statement->fetchColumn()) > 0;
}

function hasRequiredTables(PDO $connection): bool
{
    $requiredTables = [
        'academic_config',
        'formateurs',
        'modules',
        'groupes',
        'salles',
        'utilisateurs',
        'module_groupes',
        'affectations',
        'planning',
        'planning_submissions',
        'planning_change_requests',
        'planning_sessions',
        'recent_activities',
        'reports',
        'formateur_modules',
        'ai_scores',
        'evaluation_questionnaires',
        'evaluation_questions',
        'evaluation_answers',
        'evaluation_scores',
    ];

    foreach ($requiredTables as $table) {
        if (!tableExists($connection, $table)) {
            return false;
        }
    }

    return true;
}

function ensureSystemMetaTable(PDO $connection): void
{
    $connection->exec(
        'CREATE TABLE IF NOT EXISTS system_meta (
            meta_key varchar(120) NOT NULL,
            meta_value text DEFAULT NULL,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (meta_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function ensureRequestThrottlesTable(PDO $connection): void
{
    $connection->exec(
        'CREATE TABLE IF NOT EXISTS request_throttles (
            id int NOT NULL AUTO_INCREMENT,
            action_key varchar(80) NOT NULL,
            scope_key char(64) NOT NULL,
            attempt_count int NOT NULL DEFAULT 0,
            window_started_at datetime NOT NULL,
            last_attempt_at datetime NOT NULL,
            blocked_until datetime DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_request_throttles_action_scope (action_key, scope_key),
            KEY idx_request_throttles_blocked_until (blocked_until),
            KEY idx_request_throttles_last_attempt (last_attempt_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function getSystemMeta(PDO $connection, string $key): ?string
{
    $statement = $connection->prepare(
        'SELECT meta_value
         FROM system_meta
         WHERE meta_key = :meta_key
         LIMIT 1'
    );
    $statement->execute(['meta_key' => $key]);
    $value = $statement->fetchColumn();

    return $value === false ? null : strval($value);
}

function setSystemMeta(PDO $connection, string $key, string $value): void
{
    $statement = $connection->prepare(
        'INSERT INTO system_meta (meta_key, meta_value)
         VALUES (:meta_key, :meta_value)
         ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)'
    );
    $statement->execute([
        'meta_key' => $key,
        'meta_value' => $value,
    ]);
}

function bootstrapSchema(PDO $connection): void
{
    $schemaPath = dirname(__DIR__, 2) . '/database/final_database.sql';

    if (!is_file($schemaPath)) {
        throw new RuntimeException('Schema SQL introuvable: database/final_database.sql');
    }

    $sql = file_get_contents($schemaPath);
    if ($sql === false || trim($sql) === '') {
        throw new RuntimeException('Le schema SQL est vide.');
    }

    $connection->exec($sql);
}

function getDatabaseConnection(): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $database = getenv('DB_NAME') ?: 'gestion_formateurs';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';

    $serverConnection = createServerConnection($host, $port, $username, $password);
    ensureDatabaseExists($serverConnection, $database);

    $connection = new PDO(
        sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database),
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    ensureSystemMetaTable($connection);
    ensureRequestThrottlesTable($connection);

    if (!hasRequiredTables($connection)) {
        bootstrapSchema($connection);
        ensureSystemMetaTable($connection);
        ensureRequestThrottlesTable($connection);
        setSystemMeta($connection, 'app_bootstrap_version', APP_BOOTSTRAP_VERSION);
    } elseif (getSystemMeta($connection, 'app_bootstrap_version') === null) {
        setSystemMeta($connection, 'app_bootstrap_version', APP_BOOTSTRAP_VERSION);
    }

    return $connection;
}

$conn = getDatabaseConnection();
