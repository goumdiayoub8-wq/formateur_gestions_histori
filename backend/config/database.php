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

const APP_BOOTSTRAP_VERSION = '2026-04-06-database-only-schema';

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
        'system_meta',
        'request_throttles',
        'academic_config',
        'formateurs',
        'modules',
        'groupes',
        'salles',
        'utilisateurs',
        'module_groupes',
        'module_questionnaires',
        'affectations',
        'planning',
        'planning_submissions',
        'planning_change_requests',
        'planning_sessions',
        'recent_activities',
        'reports',
        'formateur_modules',
        'formateur_module_preferences',
        'formateur_module_scores',
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

function foreignKeyExists(PDO $connection, string $table, string $constraint): bool
{
    $statement = $connection->prepare(
        'SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND CONSTRAINT_NAME = :constraint_name
           AND CONSTRAINT_TYPE = "FOREIGN KEY"'
    );
    $statement->execute([
        'table_name' => $table,
        'constraint_name' => $constraint,
    ]);

    return intval($statement->fetchColumn()) > 0;
}

function dropIndexIfExists(PDO $connection, string $table, string $index): void
{
    if (!indexExists($connection, $table, $index)) {
        return;
    }

    $connection->exec(sprintf(
        'ALTER TABLE `%s` DROP INDEX `%s`',
        str_replace('`', '``', $table),
        str_replace('`', '``', $index)
    ));
}

function generateSecureQuestionnaireToken(): string
{
    return strtolower(bin2hex(random_bytes(24)));
}

function moduleQuestionnaireTokenExists(PDO $connection, string $token): bool
{
    $statement = $connection->prepare(
        'SELECT 1
         FROM module_questionnaires
         WHERE questionnaire_token = :questionnaire_token
         LIMIT 1'
    );
    $statement->execute(['questionnaire_token' => $token]);

    return $statement->fetchColumn() !== false;
}

function generateUniqueQuestionnaireToken(PDO $connection): string
{
    do {
        $token = generateSecureQuestionnaireToken();
    } while (moduleQuestionnaireTokenExists($connection, $token));

    return $token;
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

function ensurePlanningSubmissionCompatibilityColumns(PDO $connection): void
{
    if (!tableExists($connection, 'planning_submissions')) {
        return;
    }

    if (!columnExists($connection, 'planning_submissions', 'reviewed_at')) {
        $connection->exec(
            'ALTER TABLE planning_submissions
             ADD COLUMN reviewed_at DATETIME DEFAULT NULL AFTER submitted_at'
        );
    }

    if (!columnExists($connection, 'planning_submissions', 'created_at')) {
        $connection->exec(
            'ALTER TABLE planning_submissions
             ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER reviewed_at'
        );
    }

    if (!columnExists($connection, 'planning_submissions', 'updated_at')) {
        $connection->exec(
            'ALTER TABLE planning_submissions
             ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
        );
    }

    $connection->exec(
        'UPDATE planning_submissions
         SET processed_at = COALESCE(processed_at, reviewed_at),
             reviewed_at = COALESCE(reviewed_at, processed_at),
             created_at = COALESCE(created_at, submitted_at),
             updated_at = COALESCE(updated_at, processed_at, reviewed_at, submitted_at)'
    );
}

function ensureAffectationIndexes(PDO $connection): void
{
    if (!tableExists($connection, 'affectations')) {
        return;
    }

    dropIndexIfExists($connection, 'affectations', 'uq_affectation_module_annee');

    if (!indexExists($connection, 'affectations', 'uq_affectation_formateur_module_annee')) {
        $connection->exec(
            'ALTER TABLE affectations
             ADD UNIQUE KEY uq_affectation_formateur_module_annee (formateur_id, module_id, annee)'
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
            total_questions int NOT NULL DEFAULT 20,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_module_questionnaires_module (module_id),
            UNIQUE KEY uq_module_questionnaires_questionnaire (questionnaire_id),
            UNIQUE KEY uq_module_questionnaires_token (questionnaire_token),
            CONSTRAINT fk_module_questionnaires_module
                FOREIGN KEY (module_id) REFERENCES modules (id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    if (!columnExists($connection, 'module_questionnaires', 'questionnaire_token')) {
        $connection->exec(
            'ALTER TABLE module_questionnaires
             ADD COLUMN questionnaire_token VARCHAR(64) DEFAULT NULL AFTER questionnaire_id'
        );
    }

    $rows = $connection->query(
        'SELECT id
         FROM module_questionnaires
         WHERE questionnaire_token IS NULL OR TRIM(questionnaire_token) = ""'
    );
    if ($rows !== false) {
        $updateToken = $connection->prepare(
            'UPDATE module_questionnaires
             SET questionnaire_token = :questionnaire_token
             WHERE id = :id'
        );
        foreach ($rows->fetchAll() as $row) {
            $updateToken->execute([
                'questionnaire_token' => generateUniqueQuestionnaireToken($connection),
                'id' => intval($row['id']),
            ]);
        }
    }

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

    if (!foreignKeyExists($connection, 'evaluation_answers', 'fk_evaluation_answers_module')) {
        $connection->exec(
            'ALTER TABLE evaluation_answers
             ADD CONSTRAINT fk_evaluation_answers_module
             FOREIGN KEY (module_id) REFERENCES modules (id)
             ON DELETE SET NULL ON UPDATE CASCADE'
        );
    }

    if (!foreignKeyExists($connection, 'evaluation_scores', 'fk_evaluation_scores_module')) {
        $connection->exec(
            'ALTER TABLE evaluation_scores
             ADD CONSTRAINT fk_evaluation_scores_module
             FOREIGN KEY (module_id) REFERENCES modules (id)
             ON DELETE CASCADE ON UPDATE CASCADE'
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

function ensureFormateurModulePreferencesTable(PDO $connection): void
{
    if (!tableExists($connection, 'formateurs') || !tableExists($connection, 'modules')) {
        return;
    }

    $connection->exec(
        'CREATE TABLE IF NOT EXISTS formateur_module_preferences (
            id int NOT NULL AUTO_INCREMENT,
            formateur_id int NOT NULL,
            module_id int NOT NULL,
            status enum("pending","accepted","rejected") NOT NULL DEFAULT "pending",
            message_chef text DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_formateur_module_preferences_pair (formateur_id, module_id),
            KEY idx_formateur_module_preferences_status (status),
            KEY idx_formateur_module_preferences_module (module_id),
            CONSTRAINT fk_formateur_module_preferences_formateur
                FOREIGN KEY (formateur_id) REFERENCES formateurs (id)
                ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_formateur_module_preferences_module
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

    $rows = $connection->query(
        'SELECT m.id
         FROM modules m
         LEFT JOIN module_questionnaires mq ON mq.module_id = m.id
         WHERE mq.id IS NULL'
    );
    if ($rows === false) {
        return;
    }

    $insertMapping = $connection->prepare(
        'INSERT INTO module_questionnaires (module_id, questionnaire_id, questionnaire_token, total_questions)
         VALUES (:module_id, :questionnaire_id, :questionnaire_token, 20)'
    );
    foreach ($rows->fetchAll() as $row) {
        $moduleId = intval($row['id']);
        $insertMapping->execute([
            'module_id' => $moduleId,
            'questionnaire_id' => 'module-' . $moduleId,
            'questionnaire_token' => generateUniqueQuestionnaireToken($connection),
        ]);
    }
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

    return $connection;
}

$conn = getDatabaseConnection();
