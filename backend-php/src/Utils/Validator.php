<?php

declare(strict_types=1);

namespace App\Utils;

class Validator
{
    public static function required(array $data, array $fields): array
    {
        $errors = [];
        foreach ($fields as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === '' || $data[$field] === null) {
                $errors[$field][] = 'Bu alan zorunludur.';
            }
        }
        return $errors;
    }

    public static function range(?int $value, int $min, int $max, string $field): array
    {
        if ($value === null) {
            return [];
        }
        if ($value < $min || $value > $max) {
            return [$field => ["$field $min-$max arasında olmalıdır."]];
        }
        return [];
    }

    public static function dateOrder(?string $start, ?string $end, string $field = 'date'): array
    {
        if ($start && $end && strtotime($start) > strtotime($end)) {
            return [$field => ['Başlangıç tarihi bitiş tarihinden büyük olamaz.']];
        }
        return [];
    }
}
