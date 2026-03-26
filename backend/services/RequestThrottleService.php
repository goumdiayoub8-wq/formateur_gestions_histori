<?php

require_once __DIR__ . '/../core/HttpException.php';

class RequestThrottleService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function assertAllowed(string $actionKey, string $scopeKey, int $windowSeconds, string $message): void
    {
        $record = $this->findRecord($actionKey, $scopeKey);

        if (!$record) {
            return;
        }

        $now = time();
        $blockedUntil = $this->timestamp($record['blocked_until'] ?? null);
        if ($blockedUntil !== null && $blockedUntil > $now) {
            throw new TooManyRequestsException($message, max(1, $blockedUntil - $now));
        }

        $windowStartedAt = $this->timestamp($record['window_started_at'] ?? null);
        if ($windowStartedAt !== null && ($windowStartedAt + $windowSeconds) <= $now) {
            $this->clear($actionKey, $scopeKey);
        }
    }

    public function hit(
        string $actionKey,
        string $scopeKey,
        int $maxAttempts,
        int $windowSeconds,
        int $blockSeconds,
        string $message
    ): void {
        $record = $this->findRecord($actionKey, $scopeKey);
        $now = time();
        $windowStartedAt = $record ? $this->timestamp($record['window_started_at'] ?? null) : null;
        $attemptCount = $record ? intval($record['attempt_count'] ?? 0) : 0;

        if ($record && $windowStartedAt !== null && ($windowStartedAt + $windowSeconds) > $now) {
            $attemptCount++;
            $windowStartedAtString = $record['window_started_at'];
        } else {
            $attemptCount = 1;
            $windowStartedAtString = date('Y-m-d H:i:s', $now);
        }

        $blockedUntil = null;
        if ($attemptCount >= $maxAttempts) {
            $blockedUntil = date('Y-m-d H:i:s', $now + $blockSeconds);
        }

        $this->upsertRecord(
            $actionKey,
            $scopeKey,
            $attemptCount,
            $windowStartedAtString,
            date('Y-m-d H:i:s', $now),
            $blockedUntil
        );

        if ($blockedUntil !== null) {
            throw new TooManyRequestsException($message, $blockSeconds);
        }
    }

    public function registerFailure(
        string $actionKey,
        string $scopeKey,
        int $maxAttempts,
        int $windowSeconds,
        int $blockSeconds
    ): void {
        try {
            $this->hit(
                $actionKey,
                $scopeKey,
                $maxAttempts,
                $windowSeconds,
                $blockSeconds,
                'Trop de tentatives. Veuillez reessayer plus tard.'
            );
        } catch (TooManyRequestsException $exception) {
            // The caller decides how to surface the block.
        }
    }

    public function isCoolingDown(string $actionKey, string $scopeKey, int $cooldownSeconds): bool
    {
        $record = $this->findRecord($actionKey, $scopeKey);
        if (!$record) {
            return false;
        }

        $lastAttemptAt = $this->timestamp($record['last_attempt_at'] ?? null);

        return $lastAttemptAt !== null && ($lastAttemptAt + $cooldownSeconds) > time();
    }

    public function touch(string $actionKey, string $scopeKey): void
    {
        $now = date('Y-m-d H:i:s');
        $record = $this->findRecord($actionKey, $scopeKey);
        $attemptCount = $record ? intval($record['attempt_count'] ?? 0) : 1;
        $windowStartedAt = $record['window_started_at'] ?? $now;

        $this->upsertRecord($actionKey, $scopeKey, max(1, $attemptCount), $windowStartedAt, $now, null);
    }

    public function clear(string $actionKey, string $scopeKey): void
    {
        $statement = $this->db->prepare(
            'DELETE FROM request_throttles
             WHERE action_key = :action_key
               AND scope_key = :scope_key'
        );
        $statement->execute([
            'action_key' => $actionKey,
            'scope_key' => $scopeKey,
        ]);
    }

    private function findRecord(string $actionKey, string $scopeKey): ?array
    {
        $statement = $this->db->prepare(
            'SELECT action_key, scope_key, attempt_count, window_started_at, last_attempt_at, blocked_until
             FROM request_throttles
             WHERE action_key = :action_key
               AND scope_key = :scope_key
             LIMIT 1'
        );
        $statement->execute([
            'action_key' => $actionKey,
            'scope_key' => $scopeKey,
        ]);
        $row = $statement->fetch();

        return $row ?: null;
    }

    private function upsertRecord(
        string $actionKey,
        string $scopeKey,
        int $attemptCount,
        string $windowStartedAt,
        string $lastAttemptAt,
        ?string $blockedUntil
    ): void {
        $statement = $this->db->prepare(
            'INSERT INTO request_throttles (
                action_key,
                scope_key,
                attempt_count,
                window_started_at,
                last_attempt_at,
                blocked_until
             ) VALUES (
                :action_key,
                :scope_key,
                :attempt_count,
                :window_started_at,
                :last_attempt_at,
                :blocked_until
             )
             ON DUPLICATE KEY UPDATE
                attempt_count = VALUES(attempt_count),
                window_started_at = VALUES(window_started_at),
                last_attempt_at = VALUES(last_attempt_at),
                blocked_until = VALUES(blocked_until)'
        );
        $statement->execute([
            'action_key' => $actionKey,
            'scope_key' => $scopeKey,
            'attempt_count' => $attemptCount,
            'window_started_at' => $windowStartedAt,
            'last_attempt_at' => $lastAttemptAt,
            'blocked_until' => $blockedUntil,
        ]);
    }

    private function timestamp(?string $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $timestamp = strtotime($value);

        return $timestamp === false ? null : $timestamp;
    }
}
