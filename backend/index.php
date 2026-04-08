<?php

require_once __DIR__ . '/core/helpers.php';
require_once __DIR__ . '/core/InputValidator.php';
require_once __DIR__ . '/core/AppLogger.php';
require_once __DIR__ . '/core/SentryMonitor.php';
require_once __DIR__ . '/config/env.php';

loadEnvironment(__DIR__ . '/.env');
SentryMonitor::init();

$appDebug = filter_var(getenv('APP_DEBUG') ?: false, FILTER_VALIDATE_BOOL);

// Renforce la securite des sessions
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.cookie_httponly', '1');

ini_set('display_errors', $appDebug ? '1' : '0');
ini_set('display_startup_errors', $appDebug ? '1' : '0');
error_reporting(E_ALL);

if (requestMethod() === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $segments = requestSegments();

    if (empty($segments)) {
        jsonResponse([
            'status' => 'success',
            'message' => 'API backend',
            'resources' => ['auth', 'formateur', 'formateurs', 'modules', 'affectations', 'planning', 'dashboard', 'chef', 'reports', 'search', 'academic-config', 'suggestions', 'assign', 'auto-assign', 'questionnaire'],
        ]);
        exit();
    }

    $route = $segments[0];
    $allowedRoutes = ['auth', 'formateur', 'formateurs', 'modules', 'affectations', 'planning', 'dashboard', 'chef', 'reports', 'search', 'academic-config', 'suggestions', 'assign', 'auto-assign', 'questionnaire'];

    if (!in_array($route, $allowedRoutes, true)) {
        throw new NotFoundException('Route non trouvee.');
    }

    $file = __DIR__ . "/routes/{$route}.php";

    if (!file_exists($file)) {
        throw new NotFoundException('Route non trouvee.');
    }

    require $file;
} catch (HttpException $exception) {
    jsonResponse([
        'status' => 'error',
        'message' => $exception->getMessage(),
        'errors' => $exception->getErrors(),
    ], $exception->getStatusCode());
} catch (Throwable $exception) {
    AppLogger::error('Unhandled server error', [
        'method' => requestMethod(),
        'path' => currentRequestPath(),
        'message' => $exception->getMessage(),
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
    ]);
    SentryMonitor::captureException($exception, [
        'method' => requestMethod(),
        'path' => currentRequestPath(),
    ]);

    $payload = [
        'status' => 'error',
        'message' => 'Erreur interne du serveur.',
    ];

    if ($appDebug) {
        $payload['details'] = $exception->getMessage();
    }

    jsonResponse($payload, 500);
}
