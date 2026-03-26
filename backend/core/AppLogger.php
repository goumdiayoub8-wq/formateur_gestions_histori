<?php

class AppLogger
{
    private const LOG_FILE = 'storage/logs/app.log';

    public static function info(string $message, array $context = []): void
    {
        self::write('info', $message, $context);
    }

    public static function warning(string $message, array $context = []): void
    {
        self::write('warning', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::write('error', $message, $context);
    }

    private static function write(string $level, string $message, array $context): void
    {
        $logPath = dirname(__DIR__) . '/' . self::LOG_FILE;
        $logDir = dirname($logPath);

        try {
            if (!is_dir($logDir) && !mkdir($logDir, 0775, true) && !is_dir($logDir)) {
                throw new RuntimeException('Impossible de creer le dossier de logs.');
            }

            $line = sprintf(
                "[%s] %-7s %s %s\n",
                date('c'),
                strtoupper($level),
                $message,
                self::encodeContext($context)
            );

            file_put_contents($logPath, $line, FILE_APPEND | LOCK_EX);
        } catch (Throwable $exception) {
            error_log(sprintf(
                'AppLogger failure: %s | %s',
                $exception->getMessage(),
                json_encode([
                    'level' => $level,
                    'message' => $message,
                    'context' => $context,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ));
        }
    }

    private static function encodeContext(array $context): string
    {
        if ($context === []) {
            return '{}';
        }

        $normalized = array_map(static function ($value) {
            if (is_string($value) && mb_strlen($value) > 1000) {
                return mb_substr($value, 0, 1000) . '...';
            }

            return $value;
        }, $context);

        $json = json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return $json !== false ? $json : '{}';
    }
}
