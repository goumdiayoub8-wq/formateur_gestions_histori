<?php

class JsonCache
{
    private static function cacheDirectory(): string
    {
        return dirname(__DIR__) . '/storage/cache';
    }

    private static function cachePath(string $key): string
    {
        return self::cacheDirectory() . '/' . sha1($key) . '.json';
    }

    public static function remember(string $key, int $ttlSeconds, callable $resolver): array
    {
        $cached = self::get($key, $ttlSeconds);
        if ($cached !== null) {
            return $cached;
        }

        $value = $resolver();
        if (!is_array($value)) {
            $value = [];
        }

        self::put($key, $value);

        return $value;
    }

    public static function get(string $key, int $ttlSeconds): ?array
    {
        $cachePath = self::cachePath($key);

        if (!is_file($cachePath)) {
            return null;
        }

        $raw = file_get_contents($cachePath);
        if ($raw === false || trim($raw) === '') {
            return null;
        }

        $payload = json_decode($raw, true);
        if (!is_array($payload)) {
            return null;
        }

        $storedAt = intval($payload['stored_at'] ?? 0);
        if ($storedAt <= 0 || ($storedAt + $ttlSeconds) < time()) {
            @unlink($cachePath);
            return null;
        }

        return is_array($payload['value'] ?? null) ? $payload['value'] : null;
    }

    public static function put(string $key, array $value): void
    {
        $cacheDirectory = self::cacheDirectory();

        if (!is_dir($cacheDirectory)) {
            mkdir($cacheDirectory, 0775, true);
        }

        file_put_contents(self::cachePath($key), json_encode([
            'key' => $key,
            'stored_at' => time(),
            'value' => $value,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    }

    public static function forgetByPrefix(string $prefix): void
    {
        $cacheDirectory = self::cacheDirectory();

        if (!is_dir($cacheDirectory)) {
            return;
        }

        foreach (glob($cacheDirectory . '/*.json') ?: [] as $path) {
            $raw = file_get_contents($path);
            if ($raw === false || trim($raw) === '') {
                continue;
            }

            $payload = json_decode($raw, true);
            $cacheKey = strval($payload['key'] ?? '');

            if ($cacheKey !== '' && str_starts_with($cacheKey, $prefix)) {
                @unlink($path);
            }
        }
    }
}
