<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthService
{
    private UserRepository $users;
    private array $config;

    public function __construct(UserRepository $users, array $config)
    {
        $this->users = $users;
        $this->config = $config;
    }

    public function issueTokens(array $user): array
    {
        $now = time();
        $payload = [
            'iss' => $this->config['jwt_issuer'],
            'aud' => $this->config['jwt_audience'],
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $this->config['jwt_ttl'],
            'sub' => (string)$user['_id'],
        ];
        $refreshPayload = $payload;
        $refreshPayload['exp'] = $now + $this->config['jwt_refresh_ttl'];
        $refreshPayload['type'] = 'refresh';

        return [
            'access' => JWT::encode($payload, $this->config['jwt_secret'], 'HS256'),
            'refresh' => JWT::encode($refreshPayload, $this->config['jwt_secret'], 'HS256'),
        ];
    }

    public function decodeToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->config['jwt_secret'], 'HS256'));
            return (array)$decoded;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function currentUser(?string $token): ?array
    {
        if (!$token) {
            return null;
        }
        $payload = $this->decodeToken($token);
        if (!$payload || empty($payload['sub'])) {
            return null;
        }
        return $this->users->findById((int)$payload['sub']);
    }
}
