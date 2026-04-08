<?php

require_once __DIR__ . '/config/database.php';

$connection = getDatabaseConnection();

ensureSystemMetaTable($connection);
ensureRequestThrottlesTable($connection);
ensurePlanningSubmissionSnapshotColumns($connection);
ensurePlanningSubmissionCompatibilityColumns($connection);
ensureAffectationIndexes($connection);
ensureModuleQuestionnairesTable($connection);
ensureEvaluationSubmissionScopeColumns($connection);
ensureFormateurModuleScoresTable($connection);
ensureFormateurModulePreferencesTable($connection);
ensureModuleQuestionnaireMappings($connection);

if (!hasRequiredTables($connection)) {
    bootstrapSchema($connection);
    ensureSystemMetaTable($connection);
    ensureRequestThrottlesTable($connection);
    ensurePlanningSubmissionSnapshotColumns($connection);
    ensurePlanningSubmissionCompatibilityColumns($connection);
    ensureAffectationIndexes($connection);
    ensureModuleQuestionnairesTable($connection);
    ensureEvaluationSubmissionScopeColumns($connection);
    ensureFormateurModuleScoresTable($connection);
    ensureFormateurModulePreferencesTable($connection);
    ensureModuleQuestionnaireMappings($connection);
    setSystemMeta($connection, 'app_bootstrap_version', APP_BOOTSTRAP_VERSION);
    echo "Tables created and bootstrapped successfully.\n";
} elseif (getSystemMeta($connection, 'app_bootstrap_version') === null) {
    setSystemMeta($connection, 'app_bootstrap_version', APP_BOOTSTRAP_VERSION);
    echo "Bootstrap version updated.\n";
} else {
    echo "Database is already initialized.\n";
}
