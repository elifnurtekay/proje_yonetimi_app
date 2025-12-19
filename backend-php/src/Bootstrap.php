<?php

declare(strict_types=1);

namespace App;

use Dotenv\Dotenv;
use MongoDB\Client;

class Bootstrap
{
    private array $config = [];
    private Client $mongoClient;

    public function __construct(string $basePath)
    {
        $dotenvPath = $basePath . '/.env';
        if (file_exists($dotenvPath)) {
            Dotenv::createImmutable($basePath)->load();
        }

        $this->config = [
            'app_env' => $_ENV['APP_ENV'] ?? 'local',
            'app_debug' => filter_var($_ENV['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOLEAN),
            'app_url' => $_ENV['APP_URL'] ?? 'http://localhost:8080',
            'jwt_secret' => $_ENV['JWT_SECRET'] ?? 'change-me',
            'jwt_issuer' => $_ENV['JWT_ISSUER'] ?? 'proje-yonetimi',
            'jwt_audience' => $_ENV['JWT_AUDIENCE'] ?? 'proje-yonetimi-frontend',
            'jwt_ttl' => (int)($_ENV['JWT_TTL_SECONDS'] ?? 3600),
            'jwt_refresh_ttl' => (int)($_ENV['JWT_REFRESH_TTL_SECONDS'] ?? 1209600),
            'mongodb_uri' => $_ENV['MONGODB_URI'] ?? 'mongodb://mongo:27017',
            'mongodb_db' => $_ENV['MONGODB_DB'] ?? 'proje_yonetimi',
            'cors_allowed_origins' => array_filter(array_map('trim', explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000'))),
            'google_client_id' => $_ENV['GOOGLE_CLIENT_ID'] ?? '',
            'admin_session_name' => $_ENV['ADMIN_SESSION_NAME'] ?? 'proje_yonetimi_admin',
        ];

        $this->mongoClient = new Client($this->config['mongodb_uri']);
    }

    public function config(): array
    {
        return $this->config;
    }

    public function mongo(): Client
    {
        return $this->mongoClient;
    }
}
