<?php

declare(strict_types=1);

namespace App\Utils;

class Request
{
    public string $method;
    public string $path;
    public array $query;
    public array $headers;
    public ?array $json;

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->path = parse_url($uri, PHP_URL_PATH) ?? '/';
        $this->query = $_GET ?? [];
        $this->headers = function_exists('getallheaders') ? getallheaders() : [];
        $this->json = null;

        $raw = file_get_contents('php://input');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->json = $decoded;
            }
        }
    }
}
