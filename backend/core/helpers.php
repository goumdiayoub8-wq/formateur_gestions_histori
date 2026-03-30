<?php

require_once __DIR__ . '/HttpException.php';

const SYSTEM_WEEK_MIN = 1;
const SYSTEM_WEEK_MAX = 44;
const ACADEMIC_WEEKS = 35;
const VALIDATION_START_WEEK = 26;

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
        return max(SYSTEM_WEEK_MIN, min(SYSTEM_WEEK_MAX, intval($requestedWeek)));
    }

    $config = currentAcademicConfig();
    if (!$config || empty($config['start_date'])) {
        return max(SYSTEM_WEEK_MIN, min(SYSTEM_WEEK_MAX, intval(date('W'))));
    }

    $start = DateTimeImmutable::createFromFormat('Y-m-d', (string) $config['start_date']);
    if (!$start) {
        return max(SYSTEM_WEEK_MIN, min(SYSTEM_WEEK_MAX, intval(date('W'))));
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
        return SYSTEM_WEEK_MIN;
    }

    return max(SYSTEM_WEEK_MIN, min(SYSTEM_WEEK_MAX, intdiv($diffDays, 7) + 1));
}

function formatWeekRangeLabel(array $weeks): string
{
    $normalized = array_values(array_unique(array_filter(array_map(
        static fn ($week): int => intval($week),
        $weeks
    ), static fn (int $week): bool => $week > 0)));

    if ($normalized === []) {
        return '';
    }

    sort($normalized, SORT_NUMERIC);

    $ranges = [];
    $start = $normalized[0];
    $previous = $normalized[0];

    foreach (array_slice($normalized, 1) as $week) {
        if ($week === $previous + 1) {
            $previous = $week;
            continue;
        }

        $ranges[] = $start === $previous ? (string) $start : sprintf('%d-%d', $start, $previous);
        $start = $week;
        $previous = $week;
    }

    $ranges[] = $start === $previous ? (string) $start : sprintf('%d-%d', $start, $previous);

    return implode(', ', $ranges);
}

function normalizeSqlAlias(string $alias, string $fallback = 's'): string
{
    return preg_replace('/[^a-zA-Z0-9_]/', '', $alias) ?: $fallback;
}

function planningSessionHoursExpression(string $alias = 's'): string
{
    $normalizedAlias = normalizeSqlAlias($alias, 's');

    return sprintf('SUM(TIMESTAMPDIFF(MINUTE, %1$s.start_time, %1$s.end_time)) / 60', $normalizedAlias);
}

function completedPlanningSessionCondition(string $alias = 's'): string
{
    $normalizedAlias = normalizeSqlAlias($alias, 's');

    return sprintf(
        '(%1$s.status IN ("done", "completed") AND %1$s.status <> "cancelled" AND %1$s.session_date IS NOT NULL AND %1$s.session_date <= CURDATE())',
        $normalizedAlias,
    );
}

function completedPlanningSessionHoursExpression(string $alias = 's'): string
{
    $normalizedAlias = normalizeSqlAlias($alias, 's');

    return planningSessionHoursExpression($normalizedAlias);
}

function validatedPlanningSubmissionCondition(string $alias = 'ps'): string
{
    $normalizedAlias = normalizeSqlAlias($alias, 'ps');

    return sprintf(
        '(%1$s.status IN ("approved", "validated", "planned"))',
        $normalizedAlias
    );
}

function validatedPlanningSessionExistsCondition(
    string $sessionAlias = 's',
    string $submissionAlias = 'ps',
    ?int $academicYear = null
): string {
    $normalizedSessionAlias = normalizeSqlAlias($sessionAlias, 's');
    $normalizedSubmissionAlias = normalizeSqlAlias($submissionAlias, 'ps');
    $latestSubmissionAlias = $normalizedSubmissionAlias . '_latest';
    $conditions = [
        sprintf('%s.formateur_id = %s.formateur_id', $normalizedSubmissionAlias, $normalizedSessionAlias),
        sprintf('%s.semaine = %s.week_number', $normalizedSubmissionAlias, $normalizedSessionAlias),
    ];
    $latestConditions = [
        sprintf('%s.formateur_id = %s.formateur_id', $latestSubmissionAlias, $normalizedSessionAlias),
        sprintf('%s.semaine = %s.week_number', $latestSubmissionAlias, $normalizedSessionAlias),
    ];

    if ($academicYear !== null) {
        $conditions[] = sprintf('%s.academic_year = %d', $normalizedSubmissionAlias, max(0, $academicYear));
        $latestConditions[] = sprintf('%s.academic_year = %d', $latestSubmissionAlias, max(0, $academicYear));
    }

    return sprintf(
        'EXISTS (
            SELECT 1
            FROM planning_submissions %1$s
            WHERE %2$s
              AND %3$s
              AND %1$s.id = (
                SELECT %4$s.id
                FROM planning_submissions %4$s
                WHERE %5$s
                ORDER BY %4$s.id DESC
                LIMIT 1
              )
        )',
        $normalizedSubmissionAlias,
        implode(' AND ', $conditions)
        ,
        validatedPlanningSubmissionCondition($normalizedSubmissionAlias),
        $latestSubmissionAlias,
        implode(' AND ', $latestConditions)
    );
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
