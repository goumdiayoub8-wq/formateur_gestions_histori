<?php
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$fullPath = __DIR__ . $requestPath;

if ($requestPath !== '/' && file_exists($fullPath) && !is_dir($fullPath)) {
    return false;
}

require __DIR__ . '/index.php';
