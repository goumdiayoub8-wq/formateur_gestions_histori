<?php

class SentryMonitor
{
    private static bool $initialized = false;
    private static bool $enabled = false;

    public static function init(): void
    {
        if (self::$initialized) {
            return;
        }

        self::$initialized = true;

        $environment = strtolower(trim((string) (getenv('APP_ENV') ?: 'development')));
        $dsn = trim((string) (getenv('SENTRY_DSN') ?: ''));

        if ($environment !== 'production' || $dsn === '') {
            return;
        }

        $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
        if (is_file($autoloadPath)) {
            require_once $autoloadPath;
        }

        if (!function_exists('\Sentry\init')) {
            return;
        }

        \Sentry\init([
            'dsn' => $dsn,
            'environment' => $environment,
            'send_default_pii' => false,
            'max_breadcrumbs' => 20,
            'before_send' => static function ($event) {
                if (method_exists($event, 'setUser')) {
                    $user = method_exists($event, 'getUser') ? $event->getUser() : [];
                    $event->setUser([
                        'id' => $user['id'] ?? null,
                    ]);
                }

                if (method_exists($event, 'setRequest') && method_exists($event, 'getRequest')) {
                    $request = $event->getRequest() ?? [];
                    if (is_array($request)) {
                        unset($request['data'], $request['cookies']);
                        if (isset($request['headers']) && is_array($request['headers'])) {
                            $request['headers'] = self::sanitizeContext($request['headers']);
                        }
                        $event->setRequest($request);
                    }
                }

                return $event;
            },
        ]);

        self::$enabled = true;
    }

    public static function captureException(Throwable $exception, array $context = []): void
    {
        if (!self::$enabled || !function_exists('\Sentry\withScope')) {
            return;
        }

        \Sentry\withScope(static function ($scope) use ($exception, $context): void {
            if (method_exists($scope, 'setContext')) {
                $scope->setContext('request', self::sanitizeContext($context));
            }

            \Sentry\captureException($exception);
        });
    }

    private static function sanitizeContext(array $context): array
    {
        $sanitized = [];

        foreach ($context as $key => $value) {
            if (preg_match('/authorization|cookie|password|token|secret/i', (string) $key)) {
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeContext($value);
                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }
}
