<?php

require_once __DIR__ . '/HttpException.php';

const ACADEMIC_MAX_WEEKS = 35;

function ensureSessionStarted(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function jsonResponse(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function noContentResponse(): void
{
    http_response_code(204);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new ValidationException('Le corps JSON est invalide.');
    }

    return $decoded;
}

function requestQuery(string $key, $default = null)
{
    return $_GET[$key] ?? $default;
}

function requestMethod(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function clientIp(): string
{
    $forwardedFor = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwardedFor !== '') {
        $parts = explode(',', $forwardedFor);
        $candidate = trim($parts[0] ?? '');
        if ($candidate !== '') {
            return $candidate;
        }
    }

    $remoteAddr = trim($_SERVER['REMOTE_ADDR'] ?? '');

    return $remoteAddr !== '' ? $remoteAddr : 'unknown';
}

function currentRequestPath(): string
{
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $scriptBaseName = basename($scriptName);
    $requestPath = $uriPath;

    if (in_array($scriptBaseName, ['index.php', 'router.php'], true)) {
        $basePath = rtrim(dirname($scriptName), '/');

        if ($basePath !== '' && $basePath !== '/' && str_starts_with($uriPath, $basePath . '/')) {
            $requestPath = substr($uriPath, strlen($basePath));
        } elseif ($basePath !== '' && $basePath !== '/' && $uriPath === $basePath) {
            $requestPath = '/';
        }
    }

    return $requestPath === '' ? '/' : $requestPath;
}

function requestSegments(): array
{
    return array_values(array_filter(explode('/', trim(currentRequestPath(), '/'))));
}

function routeSegmentsAfterRoot(): array
{
    $segments = requestSegments();
    array_shift($segments);

    return array_values($segments);
}

function parseBoolean($value, bool $default = false): bool
{
    if ($value === null || $value === '') {
        return $default;
    }

    if (is_bool($value)) {
        return $value;
    }

    $normalized = strtolower(trim((string) $value));

    if (in_array($normalized, ['1', 'true', 'yes', 'oui'], true)) {
        return true;
    }

    if (in_array($normalized, ['0', 'false', 'no', 'non'], true)) {
        return false;
    }

    return $default;
}

function currentAcademicYear(): int
{
    $year = requestQuery('annee');
    if ($year !== null && $year !== '') {
        return max(2000, intval($year));
    }

    $config = currentAcademicConfig();
    if ($config && !empty($config['end_date'])) {
        $timestamp = strtotime((string) $config['end_date']);
        if ($timestamp !== false) {
            return intval(date('Y', $timestamp));
        }
    }

    return intval(date('Y'));
}

function currentAcademicConfig(): ?array
{
    global $conn;

    if (!isset($conn) || !($conn instanceof PDO)) {
        return null;
    }

    try {
        $stmt = $conn->query(
            'SELECT
                id,
                start_date,
                end_date,
                s2_start_date,
                stage_start_date,
                stage_end_date,
                exam_regional_date
             FROM academic_config
             ORDER BY id DESC
             LIMIT 1'
        );
        $row = $stmt->fetch();

        return $row ?: null;
    } catch (Throwable $exception) {
        return null;
    }
}

function currentAcademicWeek(): int
{
    $requestedWeek = requestQuery('week') ?? requestQuery('semaine');
    if ($requestedWeek !== null && $requestedWeek !== '') {
        return max(1, min(ACADEMIC_MAX_WEEKS, intval($requestedWeek)));
    }

    $config = currentAcademicConfig();
    if (!$config || empty($config['start_date'])) {
        return max(1, min(ACADEMIC_MAX_WEEKS, intval(date('W'))));
    }

    $start = DateTimeImmutable::createFromFormat('Y-m-d', (string) $config['start_date']);
    if (!$start) {
        return max(1, min(ACADEMIC_MAX_WEEKS, intval(date('W'))));
    }

    $current = new DateTimeImmutable('today');

    if (!empty($config['end_date'])) {
        $end = DateTimeImmutable::createFromFormat('Y-m-d', (string) $config['end_date']);
        if ($end && $current > $end) {
            $current = $end;
        }
    }

    $diffDays = intval($start->diff($current)->format('%r%a'));
    if ($diffDays < 0) {
        return 1;
    }

    return max(1, min(ACADEMIC_MAX_WEEKS, intdiv($diffDays, 7) + 1));
}

function currentUserId(): ?int
{
    ensureSessionStarted();

    return isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
}

function currentUserRoleId(): ?int
{
    ensureSessionStarted();

    return isset($_SESSION['role']) ? intval($_SESSION['role']) : null;
}

function requireAuthentication(): int
{
    $userId = currentUserId();
    if (!$userId) {
        throw new UnauthorizedException();
    }

    return $userId;
}

function requireAuth(): int
{
    return requireAuthentication();
}

function requireRole(array $allowedRoles): int
{
    $userId = requireAuthentication();
    $roleId = currentUserRoleId();

    if (!in_array($roleId, $allowedRoles, true)) {
        throw new ForbiddenException();
    }

    return $userId;
}
