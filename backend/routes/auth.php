<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$controller = new AuthController($conn);
$method = requestMethod();
$action = requestQuery('action');

if ($method === 'POST' && $action === 'login') {
    $controller->login();
    return;
}

if ($method === 'POST' && $action === 'register') {
    $controller->register();
    return;
}

if ($method === 'POST' && $action === 'forgot-password') {
    $controller->forgotPassword();
    return;
}

if ($method === 'POST' && $action === 'reset-password') {
    $controller->resetPassword();
    return;
}

if ($method === 'POST' && $action === 'logout') {
    $controller->logout();
    return;
}

if ($method === 'GET' && $action === 'check') {
    $controller->check();
    return;
}

if (in_array($method, ['PUT', 'PATCH'], true) && $action === 'update-profile') {
    $controller->updateProfile();
    return;
}

if (in_array($method, ['PUT', 'PATCH'], true) && $action === 'theme') {
    $controller->updateThemePreference();
    return;
}

throw new NotFoundException('Route auth non trouvee.');
