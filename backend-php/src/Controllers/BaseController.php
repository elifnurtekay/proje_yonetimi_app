<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Utils\Request;
use App\Utils\Response;

class BaseController
{
    protected AuthService $auth;
    protected array $config;

    public function __construct(AuthService $auth, array $config)
    {
        $this->auth = $auth;
        $this->config = $config;
    }

    protected function requireAuth(Request $request): ?array
    {
        $header = $request->headers['Authorization'] ?? $request->headers['authorization'] ?? '';
        $token = null;
        if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            $token = trim($matches[1]);
        }
        $user = $this->auth->currentUser($token);
        if (!$user) {
            Response::json(['detail' => 'Kimlik doğrulama gerekli.'], 401);
            return null;
        }
        return $user;
    }

    protected function ensureAdmin(array $user): bool
    {
        if (!($user['is_staff'] ?? false) && ($user['role'] ?? '') !== 'admin') {
            Response::json(['detail' => 'Yetkisiz erişim.'], 403);
            return false;
        }
        return true;
    }
}
