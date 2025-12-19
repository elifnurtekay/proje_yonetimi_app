<?php

declare(strict_types=1);

namespace App\Repositories;

use MongoDB\Database;

class UserRepository extends BaseRepository
{
    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findById(int $id): ?array
    {
        $doc = $this->db->users->findOne(['_id' => $id]);
        return $doc ? $doc->getArrayCopy() : null;
    }

    public function findByEmail(string $email): ?array
    {
        $doc = $this->db->users->findOne(['email' => strtolower($email)]);
        return $doc ? $doc->getArrayCopy() : null;
    }

    public function list(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $query = [];
        if (!empty($filters['role'])) {
            $query['role'] = $filters['role'];
        }
        if (!empty($filters['q'])) {
            $regex = new \MongoDB\BSON\Regex($filters['q'], 'i');
            $query['$or'] = [
                ['email' => $regex],
                ['first_name' => $regex],
                ['last_name' => $regex],
            ];
        }

        $options = [
            'sort' => ['_id' => -1],
            'skip' => ($page - 1) * $limit,
            'limit' => $limit,
        ];

        $cursor = $this->db->users->find($query, $options);
        $items = [];
        foreach ($cursor as $doc) {
            $items[] = $doc->getArrayCopy();
        }
        $total = $this->db->users->countDocuments($query);

        return ['items' => $items, 'total' => $total];
    }

    public function create(array $data): array
    {
        $id = $this->nextId('users');
        $data['_id'] = $id;
        $data['email'] = strtolower($data['email']);
        $this->db->users->insertOne($data);
        return $data;
    }

    public function update(int $id, array $data): ?array
    {
        $result = $this->db->users->findOneAndUpdate(
            ['_id' => $id],
            ['$set' => $data],
            ['returnDocument' => \MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER]
        );
        return $result ? $result->getArrayCopy() : null;
    }
}
