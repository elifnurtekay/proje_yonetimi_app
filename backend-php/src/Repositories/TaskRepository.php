<?php

declare(strict_types=1);

namespace App\Repositories;

use MongoDB\Database;

class TaskRepository extends BaseRepository
{
    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findById(int $id): ?array
    {
        $doc = $this->db->tasks->findOne(['_id' => $id]);
        return $doc ? $doc->getArrayCopy() : null;
    }

    public function listForUser(array $user, array $filters = []): array
    {
        $query = [];
        if (!($user['is_staff'] ?? false)) {
            $query['$or'] = [
                ['project_owner_id' => $user['_id']],
                ['assignee_id' => $user['_id']],
            ];
        }

        if (!empty($filters['project'])) {
            $query['project_id'] = (int)$filters['project'];
        }
        if (!empty($filters['status'])) {
            $query['status'] = $filters['status'];
        }
        if (!empty($filters['assignee'])) {
            $query['assignee_id'] = (int)$filters['assignee'];
        }

        $cursor = $this->db->tasks->find($query, ['sort' => ['_id' => -1]]);
        $items = [];
        foreach ($cursor as $doc) {
            $items[] = $doc->getArrayCopy();
        }
        return $items;
    }

    public function listByProject(int $projectId): array
    {
        $cursor = $this->db->tasks->find(['project_id' => $projectId], ['sort' => ['_id' => -1]]);
        $items = [];
        foreach ($cursor as $doc) {
            $items[] = $doc->getArrayCopy();
        }
        return $items;
    }

    public function create(array $data): array
    {
        $id = $this->nextId('tasks');
        $data['_id'] = $id;
        $this->db->tasks->insertOne($data);
        return $data;
    }

    public function update(int $id, array $data): ?array
    {
        $result = $this->db->tasks->findOneAndUpdate(
            ['_id' => $id],
            ['$set' => $data],
            ['returnDocument' => \MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER]
        );
        return $result ? $result->getArrayCopy() : null;
    }
}
