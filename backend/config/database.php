<?php

require_once __DIR__ . '/env.php';
require_once __DIR__ . '/../core/AppLogger.php';
require_once __DIR__ . '/../core/HttpException.php';

$envPath = __DIR__ . '/../.env';
$envExamplePath = __DIR__ . '/../.env.example';
loadEnvironment($envPath);

if (!is_file($envPath)) {
    loadEnvironment($envExamplePath);
}

const APP_BOOTSTRAP_VERSION = '2026-03-31-questionnaire-module-scope';

function readLegacyDatabaseConfig(string $filePath): array
{
    if (!is_file($filePath)) {
        return [];
    }

    $content = file_get_contents($filePath);
    if ($content === false || trim($content) === '') {
        return [];
    }

    $config = [];

    foreach (['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_PASSWORD'] as $key) {
        $pattern = sprintf(
            '/define\(\s*[\'"]%s[\'"]\s*,\s*([\'"])(.*?)\1\s*\)/s',
            preg_quote($key, '/')
        );

        if (preg_match($pattern, $content, $matches) === 1) {
            $config[$key] = stripcslashes($matches[2]);
        }
    }

    return $config;
}

function readEnvironmentSetting(string $name): array
{
    $value = getenv($name);
    if ($value !== false) {
        return ['found' => true, 'value' => strval($value)];
    }

    if (array_key_exists($name, $_ENV)) {
        return ['found' => true, 'value' => strval($_ENV[$name])];
    }

    if (array_key_exists($name, $_SERVER)) {
        return ['found' => true, 'value' => strval($_SERVER[$name])];
    }

    return ['found' => false, 'value' => ''];
}

function databaseSetting(string $envName, array $legacyNames, string $default, array $legacyConfig): string
{
    $envSetting = readEnvironmentSetting($envName);
    if ($envSetting['found']) {
        return $envSetting['value'];
    }

    foreach ($legacyNames as $legacyName) {
        if (array_key_exists($legacyName, $legacyConfig)) {
            return strval($legacyConfig[$legacyName]);
        }
    }

    return $default;
}

function createServerConnection(string $host, string $port, string $username, string $password): PDO
{
    try {
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
    } catch (PDOException $exception) {
        AppLogger::error('Database connection failed', [
            'host' => $host,
            'port' => $port,
            'database' => null,
            'username' => $username,
            'message' => $exception->getMessage(),
        ]);

        throw new HttpException(
            503,
            'Connexion a la base de donnees impossible. Verifiez backend/.env ou backend/config/config.php.',
            [
                'config_files' => [
                    'backend/.env',
                    'backend/.env.example',
                    'backend/config/config.php',
                ],
            ]
        );
    }
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

function columnExists(PDO $connection, string $table, string $column): bool
{
    $statement = $connection->query(sprintf(
        "SHOW COLUMNS FROM `%s` LIKE %s",
        str_replace('`', '``', $table),
        $connection->quote($column)
    ));

    return (bool) $statement->fetch();
}

function indexExists(PDO $connection, string $table, string $index): bool
{
    $statement = $connection->query(sprintf(
        "SHOW INDEX FROM `%s` WHERE Key_name = %s",
        str_replace('`', '``', $table),
        $connection->quote($index)
    ));

    return (bool) $statement->fetch();
}

function ensurePlanningSubmissionSnapshotColumns(PDO $connection): void
{
    if (!tableExists($connection, 'planning_submissions')) {
        return;
    }

    if (!columnExists($connection, 'planning_submissions', 'snapshot_entries')) {
        $connection->exec(
            'ALTER TABLE planning_submissions
             ADD COLUMN snapshot_entries LONGTEXT DEFAULT NULL AFTER decision_note'
        );
    }

    if (!columnExists($connection, 'planning_submissions', 'snapshot_total_hours')) {
        $connection->exec(
            'ALTER TABLE planning_submissions
             ADD COLUMN snapshot_total_hours DECIMAL(6,2) DEFAULT NULL AFTER snapshot_entries'
        );
    }

    if (!columnExists($connection, 'planning_submissions', 'snapshot_captured_at')) {
        $connection->exec(
            'ALTER TABLE planning_submissions
             ADD COLUMN snapshot_captured_at DATETIME DEFAULT NULL AFTER snapshot_total_hours'
        );
    }
}

function ensureModuleQuestionnairesTable(PDO $connection): void
{
    if (!tableExists($connection, 'modules')) {
        return;
    }

    $connection->exec(
        'CREATE TABLE IF NOT EXISTS module_questionnaires (
            id int NOT NULL AUTO_INCREMENT,
            module_id int NOT NULL,
            questionnaire_id varchar(120) NOT NULL,
            questionnaire_token varchar(64) DEFAULT NULL,
            google_form_id varchar(191) DEFAULT NULL,
            total_questions int NOT NULL DEFAULT 20,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_module_questionnaires_module (module_id),
            UNIQUE KEY uq_module_questionnaires_questionnaire (questionnaire_id),
            UNIQUE KEY uq_module_questionnaires_token (questionnaire_token),
            UNIQUE KEY uq_module_questionnaires_google_form (google_form_id),
            CONSTRAINT fk_module_questionnaires_module
                FOREIGN KEY (module_id) REFERENCES modules (id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    if (!columnExists($connection, 'module_questionnaires', 'last_synced_at')) {
        $connection->exec(
            'ALTER TABLE module_questionnaires
             ADD COLUMN last_synced_at DATETIME DEFAULT NULL AFTER total_questions'
        );
    }

    if (!columnExists($connection, 'module_questionnaires', 'questionnaire_token')) {
        $connection->exec(
            'ALTER TABLE module_questionnaires
             ADD COLUMN questionnaire_token VARCHAR(64) DEFAULT NULL AFTER questionnaire_id'
        );
    }

    $connection->exec(
        'UPDATE module_questionnaires
         SET questionnaire_token = SUBSTRING(
             SHA2(CONCAT("mq:", module_id, ":", questionnaire_id, ":", UUID()), 256),
             1,
             48
         )
         WHERE questionnaire_token IS NULL OR TRIM(questionnaire_token) = ""'
    );

    if (!indexExists($connection, 'module_questionnaires', 'uq_module_questionnaires_token')) {
        $connection->exec(
            'ALTER TABLE module_questionnaires
             ADD UNIQUE KEY uq_module_questionnaires_token (questionnaire_token)'
        );
    }
}

function ensureEvaluationSubmissionScopeColumns(PDO $connection): void
{
    if (!tableExists($connection, 'evaluation_answers') || !tableExists($connection, 'evaluation_scores')) {
        return;
    }

    if (!columnExists($connection, 'evaluation_answers', 'module_id')) {
        $connection->exec(
            'ALTER TABLE evaluation_answers
             ADD COLUMN module_id INT DEFAULT NULL AFTER formateur_id'
        );
    }

    if (!indexExists($connection, 'evaluation_answers', 'idx_answers_formateur')) {
        $connection->exec(
            'ALTER TABLE evaluation_answers
             ADD KEY idx_answers_formateur (formateur_id)'
        );
    }

    if (!columnExists($connection, 'evaluation_scores', 'module_id')) {
        $connection->exec(
            'ALTER TABLE evaluation_scores
             ADD COLUMN module_id INT DEFAULT NULL AFTER formateur_id'
        );
    }

    if (!indexExists($connection, 'evaluation_scores', 'idx_scores_formateur')) {
        $connection->exec(
            'ALTER TABLE evaluation_scores
             ADD KEY idx_scores_formateur (formateur_id)'
        );
    }

    if (!indexExists($connection, 'evaluation_answers', 'uq_answers_formateur_module_question')) {
        $connection->exec(
            'ALTER TABLE evaluation_answers
             ADD UNIQUE KEY uq_answers_formateur_module_question (formateur_id, module_id, question_id)'
        );
    }

    if (!indexExists($connection, 'evaluation_answers', 'idx_answers_module')) {
        $connection->exec(
            'ALTER TABLE evaluation_answers
             ADD KEY idx_answers_module (module_id)'
        );
    }

    if (!indexExists($connection, 'evaluation_scores', 'uq_scores_formateur_module')) {
        $connection->exec(
            'ALTER TABLE evaluation_scores
             ADD UNIQUE KEY uq_scores_formateur_module (formateur_id, module_id)'
        );
    }

    if (!indexExists($connection, 'evaluation_scores', 'idx_scores_module')) {
        $connection->exec(
            'ALTER TABLE evaluation_scores
             ADD KEY idx_scores_module (module_id)'
        );
    }

    if (indexExists($connection, 'evaluation_answers', 'uq_answers_formateur_question')) {
        $connection->exec(
            'ALTER TABLE evaluation_answers
             DROP INDEX uq_answers_formateur_question'
        );
    }

    if (indexExists($connection, 'evaluation_scores', 'uq_scores_formateur')) {
        $connection->exec(
            'ALTER TABLE evaluation_scores
             DROP INDEX uq_scores_formateur'
        );
    }
}

function ensureFormateurModuleScoresTable(PDO $connection): void
{
    if (!tableExists($connection, 'formateurs') || !tableExists($connection, 'modules')) {
        return;
    }

    $connection->exec(
        'CREATE TABLE IF NOT EXISTS formateur_module_scores (
            id int NOT NULL AUTO_INCREMENT,
            formateur_id int NOT NULL,
            module_id int NOT NULL,
            score decimal(5,2) NOT NULL DEFAULT 0.00,
            last_updated_at datetime NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_formateur_module_scores_pair (formateur_id, module_id),
            KEY idx_formateur_module_scores_module (module_id),
            CONSTRAINT fk_formateur_module_scores_formateur
                FOREIGN KEY (formateur_id) REFERENCES formateurs (id)
                ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_formateur_module_scores_module
                FOREIGN KEY (module_id) REFERENCES modules (id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function ensureModuleQuestionnaireMappings(PDO $connection): void
{
    if (!tableExists($connection, 'modules') || !tableExists($connection, 'module_questionnaires')) {
        return;
    }

    $connection->exec(
        'INSERT INTO module_questionnaires (module_id, questionnaire_id, questionnaire_token, total_questions)
         SELECT
            m.id,
            CONCAT("module-", m.id),
            SUBSTRING(SHA2(CONCAT("mq:", m.id, ":", UUID()), 256), 1, 48),
            20
         FROM modules m
         LEFT JOIN module_questionnaires mq ON mq.module_id = m.id
         WHERE mq.id IS NULL'
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

    $legacyConfig = readLegacyDatabaseConfig(__DIR__ . '/config.php');

    $host = databaseSetting('DB_HOST', ['DB_HOST'], '127.0.0.1', $legacyConfig);
    $port = databaseSetting('DB_PORT', ['DB_PORT'], '3306', $legacyConfig);
    $database = databaseSetting('DB_NAME', ['DB_NAME'], 'gestion_formateurs', $legacyConfig);
    $username = databaseSetting('DB_USER', ['DB_USER'], 'root', $legacyConfig);
    $password = databaseSetting('DB_PASSWORD', ['DB_PASSWORD', 'DB_PASS'], '', $legacyConfig);

    $serverConnection = createServerConnection($host, $port, $username, $password);
    ensureDatabaseExists($serverConnection, $database);

    try {
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
    } catch (PDOException $exception) {
        AppLogger::error('Database selection failed', [
            'host' => $host,
            'port' => $port,
            'database' => $database,
            'username' => $username,
            'message' => $exception->getMessage(),
        ]);

        throw new HttpException(
            503,
            'La connexion MySQL fonctionne mais la base de donnees demandee est inaccessible. Verifiez DB_NAME dans backend/.env ou backend/config/config.php.'
        );
    }

    ensureSystemMetaTable($connection);
    ensureRequestThrottlesTable($connection);
    ensurePlanningSubmissionSnapshotColumns($connection);
    ensureModuleQuestionnairesTable($connection);
    ensureEvaluationSubmissionScopeColumns($connection);
    ensureFormateurModuleScoresTable($connection);
    ensureModuleQuestionnaireMappings($connection);

    if (!hasRequiredTables($connection)) {
        bootstrapSchema($connection);
        ensureSystemMetaTable($connection);
        ensureRequestThrottlesTable($connection);
        ensurePlanningSubmissionSnapshotColumns($connection);
        ensureModuleQuestionnairesTable($connection);
        ensureEvaluationSubmissionScopeColumns($connection);
        ensureFormateurModuleScoresTable($connection);
        ensureModuleQuestionnaireMappings($connection);
        setSystemMeta($connection, 'app_bootstrap_version', APP_BOOTSTRAP_VERSION);
    } elseif (getSystemMeta($connection, 'app_bootstrap_version') === null) {
        setSystemMeta($connection, 'app_bootstrap_version', APP_BOOTSTRAP_VERSION);
    }

    return $connection;
}

$conn = getDatabaseConnection();
