<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\UserRepository;

class UserService
{
    private UserRepository $users;

    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    public function sanitize(?array $user): ?array
    {
        if (!$user) {
            return null;
        }
        $user['id'] = $user['_id'] ?? null;
        unset($user['_id']);
        unset($user['password_hash']);
        return $user;
    }
}
