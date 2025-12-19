<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\UserService;
use App\Utils\Request;
use App\Utils\Response;

class UsersController extends BaseController
{
    private UserRepository $users;
    private UserService $userService;

    public function __construct(AuthService $auth, UserRepository $users, UserService $userService, array $config)
    {
        parent::__construct($auth, $config);
        $this->users = $users;
        $this->userService = $userService;
    }

    public function list(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $filters = [
            'role' => $request->query['role'] ?? null,
            'q' => $request->query['q'] ?? null,
        ];
        $page = max(1, (int)($request->query['page'] ?? 1));
        $limit = min(100, max(1, (int)($request->query['limit'] ?? 50)));

        $result = $this->users->list($filters, $page, $limit);
        $items = array_map(fn($u) => $this->userService->sanitize($u), $result['items']);
        Response::json($items);
    }

    public function me(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        Response::json($this->userService->sanitize($user));
    }

    public function update(Request $request, int $id): void
    {
        $current = $this->requireAuth($request);
        if (!$current) {
            return;
        }

        if (!($current['is_staff'] ?? false) && (int)$current['_id'] !== $id) {
            Response::json(['detail' => 'Yetkisiz.'], 403);
            return;
        }

        $data = $request->json ?? [];
        $updates = [];
        foreach (['first_name', 'last_name', 'email'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }
        if (($current['is_staff'] ?? false) && array_key_exists('role', $data)) {
            $updates['role'] = $data['role'];
        }

        $user = $this->users->update($id, $updates);
        if (!$user) {
            Response::json(['detail' => 'Kullanıcı bulunamadı.'], 404);
            return;
        }
        Response::json($this->userService->sanitize($user));
    }

    public function findByEmail(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }

        $email = $request->query['email'] ?? '';
        if (!$email) {
            Response::json(['detail' => 'Email parametresi gerekli.'], 400);
            return;
        }
        $found = $this->users->findByEmail($email);
        if (!$found) {
            Response::json(['error' => 'Kullanıcı bulunamadı.'], 404);
            return;
        }
        Response::json([
            'id' => $found['_id'],
            'email' => $found['email'],
            'first_name' => $found['first_name'] ?? '',
            'last_name' => $found['last_name'] ?? '',
        ]);
    }
}
