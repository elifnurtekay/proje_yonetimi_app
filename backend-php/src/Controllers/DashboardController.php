<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ProjectRepository;
use App\Repositories\TaskRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Utils\Progress;
use App\Utils\Request;
use App\Utils\Response;

class DashboardController extends BaseController
{
    private ProjectRepository $projects;
    private TaskRepository $tasks;
    private UserRepository $users;

    public function __construct(AuthService $auth, ProjectRepository $projects, TaskRepository $tasks, UserRepository $users, array $config)
    {
        parent::__construct($auth, $config);
        $this->projects = $projects;
        $this->tasks = $tasks;
        $this->users = $users;
    }

    public function summary(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }

        $projects = $this->projects->listForUser($user);
        $tasks = $this->tasks->listForUser($user);

        $totalProjects = count($projects);
        $activeTasks = 0;
        $completed = 0;
        foreach ($tasks as $task) {
            if ($task['status'] === 'Tamamlandı') {
                $completed++;
            } else {
                $activeTasks++;
            }
        }

        $members = $this->users->list([], 1, 1)['total'];

        usort($projects, fn($a, $b) => strtotime($b['created_at'] ?? 'now') <=> strtotime($a['created_at'] ?? 'now'));
        $recentProjects = [];
        foreach (array_slice($projects, 0, 3) as $project) {
            $projectTasks = $this->tasks->listByProject((int)$project['_id']);
            $progress = Progress::projectProgress($project, $projectTasks);
            $recentProjects[] = [
                'id' => $project['_id'],
                'name' => $project['name'],
                'description' => $project['description'],
                'status' => $project['status'],
                'start_date' => $project['start_date'] ?? null,
                'end_date' => $project['end_date'] ?? null,
                'progress' => $progress['effective'],
                'manual_progress' => $progress['manual'],
                'dynamic_progress' => $progress['dynamic'],
            ];
        }

        $upcomingTasks = [];
        $today = strtotime('today');
        foreach ($tasks as $task) {
            if (!$task['due_date']) {
                continue;
            }
            $due = strtotime($task['due_date']);
            if ($due >= $today) {
                $progress = Progress::taskProgress($task);
                $project = $this->projects->findById((int)$task['project_id']);
                $assignee = $task['assignee_id'] ? $this->users->findById((int)$task['assignee_id']) : null;
                $upcomingTasks[] = [
                    'id' => $task['_id'],
                    'title' => $task['title'],
                    'start_date' => $task['start_date'] ?? null,
                    'end_date' => $task['end_date'] ?? null,
                    'due_date' => $task['due_date'],
                    'status' => $task['status'],
                    'project_name' => $project['name'] ?? null,
                    'assignee_name' => $assignee ? trim(($assignee['first_name'] ?? '') . ' ' . ($assignee['last_name'] ?? '')) : null,
                    'progress' => $progress['effective'],
                    'manual_progress' => $progress['manual'],
                    'dynamic_progress' => $progress['dynamic'],
                ];
            }
        }
        usort($upcomingTasks, fn($a, $b) => strtotime($a['due_date']) <=> strtotime($b['due_date']));
        $upcomingTasks = array_slice($upcomingTasks, 0, 3);

        Response::json([
            'total_projects' => $totalProjects,
            'active_tasks' => $activeTasks,
            'completed' => $completed,
            'members' => $members,
            'recent_projects' => $recentProjects,
            'upcoming_tasks' => $upcomingTasks,
        ]);
    }
}
