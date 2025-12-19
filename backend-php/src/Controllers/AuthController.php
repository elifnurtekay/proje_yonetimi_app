<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\UserService;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\Validator;

class AuthController extends BaseController
{
    private UserRepository $users;
    private UserService $userService;

    public function __construct(AuthService $auth, UserRepository $users, UserService $userService, array $config)
    {
        parent::__construct($auth, $config);
        $this->users = $users;
        $this->userService = $userService;
    }

    public function login(Request $request): void
    {
        $data = $request->json ?? [];
        $errors = Validator::required($data, ['email', 'password']);
        if ($errors) {
            Response::json(['detail' => 'Eksik alanlar', 'errors' => $errors], 400);
            return;
        }

        $user = $this->users->findByEmail($data['email']);
        if (!$user || empty($user['password_hash']) || !$this->verifyPassword($data['password'], $user['password_hash'])) {
            Response::json(['detail' => 'Geçersiz kimlik bilgisi.'], 401);
            return;
        }

        $tokens = $this->auth->issueTokens($user);
        Response::json(array_merge($tokens, ['user' => $this->userService->sanitize($user)]));
    }

    public function register(Request $request): void
    {
        $data = $request->json ?? [];
        $errors = Validator::required($data, ['email', 'password']);
        if ($errors) {
            Response::json(['detail' => 'Eksik alanlar', 'errors' => $errors], 400);
            return;
        }

        if ($this->users->findByEmail($data['email'])) {
            Response::json(['detail' => 'Bu e-posta zaten kayıtlı.'], 409);
            return;
        }

        $user = $this->users->create([
            'email' => $data['email'],
            'first_name' => $data['first_name'] ?? '',
            'last_name' => $data['last_name'] ?? '',
            'role' => $data['role'] ?? 'üye',
            'is_staff' => false,
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
            'date_joined' => date('c'),
        ]);

        $tokens = $this->auth->issueTokens($user);
        Response::json(array_merge($tokens, ['user' => $this->userService->sanitize($user)]), 201);
    }

    public function refresh(Request $request): void
    {
        $data = $request->json ?? [];
        $refresh = $data['refresh'] ?? null;
        if (!$refresh) {
            Response::json(['detail' => 'Refresh token gerekli.'], 400);
            return;
        }

        $payload = $this->auth->decodeToken($refresh);
        if (!$payload || ($payload['type'] ?? '') !== 'refresh') {
            Response::json(['detail' => 'Geçersiz refresh token.'], 401);
            return;
        }

        $user = $this->users->findById((int)($payload['sub'] ?? 0));
        if (!$user) {
            Response::json(['detail' => 'Kullanıcı bulunamadı.'], 404);
            return;
        }

        $tokens = $this->auth->issueTokens($user);
        Response::json($tokens);
    }

    public function googleConfig(): void
    {
        $clientId = $this->config['google_client_id'] ?? '';
        Response::json(['client_id' => $clientId, 'enabled' => (bool)$clientId]);
    }

    public function googleLogin(Request $request): void
    {
        $data = $request->json ?? [];
        $credential = $data['credential'] ?? $data['id_token'] ?? null;
        if (!$credential) {
            Response::json(['detail' => 'Google kimlik belirteci bulunamadı.'], 400);
            return;
        }

        $clientId = $this->config['google_client_id'] ?? '';
        if (!$clientId) {
            Response::json(['detail' => 'Google sağlayıcısı yapılandırılmadı.'], 503);
            return;
        }

        $tokenInfo = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential));
        if (!$tokenInfo) {
            Response::json(['detail' => 'Google token doğrulanamadı.'], 400);
            return;
        }
        $payload = json_decode($tokenInfo, true);
        if (json_last_error() !== JSON_ERROR_NONE || ($payload['aud'] ?? '') !== $clientId) {
            Response::json(['detail' => 'Google token doğrulanamadı.'], 400);
            return;
        }

        $email = $payload['email'] ?? '';
        if (!$email) {
            Response::json(['detail' => 'Google hesabı e-posta bilgisi içermiyor.'], 400);
            return;
        }

        $user = $this->users->findByEmail($email);
        $created = false;
        if (!$user) {
            $created = true;
            $user = $this->users->create([
                'email' => $email,
                'first_name' => $payload['given_name'] ?? '',
                'last_name' => $payload['family_name'] ?? '',
                'role' => 'üye',
                'is_staff' => false,
                'password_hash' => null,
                'date_joined' => date('c'),
            ]);
        } else {
            $updates = [];
            if (!empty($payload['given_name']) && ($user['first_name'] ?? '') !== $payload['given_name']) {
                $updates['first_name'] = $payload['given_name'];
            }
            if (!empty($payload['family_name']) && ($user['last_name'] ?? '') !== $payload['family_name']) {
                $updates['last_name'] = $payload['family_name'];
            }
            if ($updates) {
                $user = $this->users->update((int)$user['_id'], $updates) ?? $user;
            }
        }

        $tokens = $this->auth->issueTokens($user);
        Response::json(array_merge($tokens, ['user' => $this->userService->sanitize($user), 'created' => $created]));
    }

    private function verifyPassword(string $password, string $hash): bool
    {
        if (str_starts_with($hash, 'pbkdf2_sha256$')) {
            $parts = explode('$', $hash, 4);
            if (count($parts) !== 4) {
                return false;
            }
            [, $iterations, $salt, $stored] = $parts;
            $derived = base64_encode(hash_pbkdf2('sha256', $password, $salt, (int)$iterations, 32, true));
            return hash_equals($stored, $derived);
        }

        return password_verify($password, $hash);
    }
}
