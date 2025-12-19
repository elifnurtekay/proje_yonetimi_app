<?php

declare(strict_types=1);

namespace App\Repositories;

use MongoDB\Database;

class ProjectRepository extends BaseRepository
{
    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findById(int $id): ?array
    {
        $doc = $this->db->projects->findOne(['_id' => $id]);
        return $doc ? $doc->getArrayCopy() : null;
    }

    public function listForUser(array $user, array $filters = []): array
    {
        if (!($user['is_staff'] ?? false)) {
            $userId = $user['_id'];
            $query = [
                '$or' => [
                    ['owner_id' => $userId],
                    ['task_assignees' => $userId],
                ],
            ];
        } else {
            $query = [];
        }

        if (!empty($filters['status'])) {
            $query['status'] = $filters['status'];
        }

        $cursor = $this->db->projects->find($query, ['sort' => ['_id' => -1]]);
        $items = [];
        foreach ($cursor as $doc) {
            $items[] = $doc->getArrayCopy();
        }
        return $items;
    }

    public function create(array $data): array
    {
        $id = $this->nextId('projects');
        $data['_id'] = $id;
        $this->db->projects->insertOne($data);
        return $data;
    }

    public function update(int $id, array $data): ?array
    {
        $result = $this->db->projects->findOneAndUpdate(
            ['_id' => $id],
            ['$set' => $data],
            ['returnDocument' => \MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER]
        );
        return $result ? $result->getArrayCopy() : null;
    }

    public function delete(int $id): bool
    {
        $result = $this->db->projects->deleteOne(['_id' => $id]);
        return $result->getDeletedCount() > 0;
    }

    public function updateTaskAssignees(int $projectId, array $assigneeIds): void
    {
        $this->db->projects->updateOne(['_id' => $projectId], ['$set' => ['task_assignees' => array_values(array_unique($assigneeIds))]]);
    }
}
