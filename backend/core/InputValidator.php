<?php

require_once __DIR__ . '/HttpException.php';
require_once __DIR__ . '/helpers.php';

class InputValidator
{
    public static function string(array $data, string $field, string $label, bool $required = true, int $maxLength = 255): ?string
    {
        $value = $data[$field] ?? null;

        if ($value === null || trim((string) $value) === '') {
            if ($required) {
                throw new ValidationException("Le champ {$label} est obligatoire.");
            }

            return null;
        }

        $value = trim((string) $value);
        if (mb_strlen($value) > $maxLength) {
            throw new ValidationException("Le champ {$label} depasse {$maxLength} caracteres.");
        }

        return $value;
    }

    public static function integer(array $data, string $field, string $label, bool $required = true, ?int $min = null, ?int $max = null): ?int
    {
        $value = $data[$field] ?? null;

        if ($value === null || $value === '') {
            if ($required) {
                throw new ValidationException("Le champ {$label} est obligatoire.");
            }

            return null;
        }

        if (filter_var($value, FILTER_VALIDATE_INT) === false) {
            throw new ValidationException("Le champ {$label} doit etre un entier valide.");
        }

        $value = intval($value);

        if ($min !== null && $value < $min) {
            throw new ValidationException("Le champ {$label} doit etre superieur ou egal a {$min}.");
        }

        if ($max !== null && $value > $max) {
            throw new ValidationException("Le champ {$label} doit etre inferieur ou egal a {$max}.");
        }

        return $value;
    }

    public static function decimal(array $data, string $field, string $label, bool $required = true, ?float $min = null, ?float $max = null): ?float
    {
        $value = $data[$field] ?? null;

        if ($value === null || $value === '') {
            if ($required) {
                throw new ValidationException("Le champ {$label} est obligatoire.");
            }

            return null;
        }

        if (!is_numeric($value)) {
            throw new ValidationException("Le champ {$label} doit etre numerique.");
        }

        $value = round(floatval($value), 2);

        if ($min !== null && $value < $min) {
            throw new ValidationException("Le champ {$label} doit etre superieur ou egal a {$min}.");
        }

        if ($max !== null && $value > $max) {
            throw new ValidationException("Le champ {$label} doit etre inferieur ou egal a {$max}.");
        }

        return $value;
    }

    public static function boolean(array $data, string $field, bool $default = false): bool
    {
        return parseBoolean($data[$field] ?? null, $default);
    }

    public static function oneOf(array $data, string $field, string $label, array $allowedValues, bool $required = true): ?string
    {
        $value = $data[$field] ?? null;

        if ($value === null || $value === '') {
            if ($required) {
                throw new ValidationException("Le champ {$label} est obligatoire.");
            }

            return null;
        }

        $value = trim((string) $value);

        if (!in_array($value, $allowedValues, true)) {
            throw new ValidationException("Le champ {$label} doit etre une des valeurs suivantes: " . implode(', ', $allowedValues) . '.');
        }

        return $value;
    }

    public static function email(array $data, string $field, string $label = 'email', bool $required = true, int $maxLength = 150): ?string
    {
        $value = self::string($data, $field, $label, $required, $maxLength);

        if ($value === null) {
            return null;
        }

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException("Le champ {$label} doit etre une adresse email valide.");
        }

        return strtolower($value);
    }
}
