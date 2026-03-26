<?php

require_once __DIR__ . '/../core/helpers.php';

function checkAuth(): int
{
    return requireAuthentication();
}

function checkRole($allowedRoles): int
{
    return requireRole(array_map('intval', $allowedRoles));
}
