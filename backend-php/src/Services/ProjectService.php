<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ProjectRepository;
use App\Repositories\TaskRepository;
use App\Utils\Progress;

class ProjectService
{
    private ProjectRepository $projects;
    private TaskRepository $tasks;

    public function __construct(ProjectRepository $projects, TaskRepository $tasks)
    {
        $this->projects = $projects;
        $this->tasks = $tasks;
    }

    public function attachProgress(array $project): array
    {
        $tasks = $this->tasks->listByProject((int)$project['_id']);
        $progress = Progress::projectProgress($project, $tasks);
        $project['id'] = $project['_id'] ?? null;
        $project['owner'] = $project['owner_id'] ?? null;
        unset($project['_id']);
        unset($project['owner_id']);
        $project['dynamic_progress'] = $progress['dynamic'];
        $project['effective_progress'] = $progress['effective'];
        return $project;
    }
}
