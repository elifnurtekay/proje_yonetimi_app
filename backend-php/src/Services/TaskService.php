<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ProjectRepository;
use App\Repositories\TaskRepository;
use App\Repositories\UserRepository;
use App\Utils\Progress;

class TaskService
{
    private TaskRepository $tasks;
    private ProjectRepository $projects;
    private UserRepository $users;

    public function __construct(TaskRepository $tasks, ProjectRepository $projects, UserRepository $users)
    {
        $this->tasks = $tasks;
        $this->projects = $projects;
        $this->users = $users;
    }

    public function attachMeta(array $task): array
    {
        $projectId = $task['project_id'] ?? null;
        $assigneeId = $task['assignee_id'] ?? null;
        $project = $projectId !== null ? $this->projects->findById((int)$projectId) : null;
        $assignee = $assigneeId ? $this->users->findById((int)$assigneeId) : null;
        $progress = Progress::taskProgress($task);

        $task['id'] = $task['_id'] ?? null;
        $task['project'] = $projectId;
        $task['assignee'] = $assigneeId;
        unset($task['_id']);
        unset($task['project_id']);
        unset($task['assignee_id']);
        $task['project_name'] = $project['name'] ?? null;
        $task['assignee_name'] = $assignee ? trim(($assignee['first_name'] ?? '') . ' ' . ($assignee['last_name'] ?? '')) : null;
        if (!$task['assignee_name']) {
            $task['assignee_name'] = $assignee['email'] ?? null;
        }
        $task['dynamic_progress'] = $progress['dynamic'];
        $task['effective_progress'] = $progress['effective'];

        return $task;
    }

    public function attachProjectOwner(array $task): array
    {
        $projectId = $task['project_id'] ?? null;
        $project = $projectId !== null ? $this->projects->findById((int)$projectId) : null;
        $task['project_owner_id'] = $project['owner_id'] ?? null;
        return $task;
    }
}
