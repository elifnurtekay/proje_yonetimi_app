<?php

declare(strict_types=1);

namespace App\Utils;

class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function redirect(string $location): void
    {
        header('Location: ' . $location);
        exit;
    }
}
