<?php

class HttpException extends RuntimeException
{
    private int $statusCode;
    private array $errors;

    public function __construct(int $statusCode, string $message, array $errors = [])
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errors = $errors;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}

class ValidationException extends HttpException
{
    public function __construct(string $message, array $errors = [])
    {
        parent::__construct(422, $message, $errors);
    }
}

class UnauthorizedException extends HttpException
{
    public function __construct(string $message = 'Non authentifie')
    {
        parent::__construct(401, $message);
    }
}

class ForbiddenException extends HttpException
{
    public function __construct(string $message = 'Acces interdit')
    {
        parent::__construct(403, $message);
    }
}

class NotFoundException extends HttpException
{
    public function __construct(string $message = 'Ressource introuvable')
    {
        parent::__construct(404, $message);
    }
}

class ConflictException extends HttpException
{
    public function __construct(string $message, array $errors = [])
    {
        parent::__construct(409, $message, $errors);
    }
}

class TooManyRequestsException extends HttpException
{
    public function __construct(string $message, int $retryAfterSeconds, array $errors = [])
    {
        parent::__construct(429, $message, array_merge($errors, [
            'retry_after' => max(1, $retryAfterSeconds),
        ]));
    }
}
