<?php

declare(strict_types=1);

namespace App\Repositories;

use MongoDB\Database;

class BaseRepository
{
    protected Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    protected function nextId(string $collection): int
    {
        $counters = $this->db->selectCollection('counters');
        $result = $counters->findOneAndUpdate(
            ['_id' => $collection],
            ['$inc' => ['seq' => 1]],
            ['upsert' => true, 'returnDocument' => \MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER]
        );
        return (int)($result['seq'] ?? 1);
    }
}
