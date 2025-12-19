<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ProjectRepository;
use App\Repositories\TaskRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\TaskService;
use App\Utils\Progress;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\Validator;

class TasksController extends BaseController
{
    private TaskRepository $tasks;
    private ProjectRepository $projects;
    private UserRepository $users;
    private TaskService $taskService;

    public function __construct(
        AuthService $auth,
        TaskRepository $tasks,
        ProjectRepository $projects,
        UserRepository $users,
        TaskService $taskService,
        array $config
    ) {
        parent::__construct($auth, $config);
        $this->tasks = $tasks;
        $this->projects = $projects;
        $this->users = $users;
        $this->taskService = $taskService;
    }

    public function list(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $tasks = $this->tasks->listForUser($user, $request->query);
        $tasks = array_map(fn($t) => $this->taskService->attachMeta($t), $tasks);
        Response::json($tasks);
    }

    public function create(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }

        $data = $request->json ?? [];
        $errors = Validator::required($data, ['project', 'title']);
        $errors = array_merge($errors, Validator::range($data['progress'] ?? null, 0, 100, 'progress'));
        $errors = array_merge($errors, Validator::dateOrder($data['start_date'] ?? null, $data['end_date'] ?? null, 'dates'));
        if ($errors) {
            Response::json(['detail' => 'Doğrulama hatası.', 'errors' => $errors], 400);
            return;
        }

        $project = $this->projects->findById((int)$data['project']);
        if (!$project) {
            Response::json(['detail' => 'Proje bulunamadı.'], 404);
            return;
        }
        $projectOwnerId = $project['owner_id'] ?? null;
        if (!($user['is_staff'] ?? false) && $projectOwnerId !== $user['_id']) {
            Response::json(['detail' => 'Yetkisiz.'], 403);
            return;
        }

        $task = $this->tasks->create([
            'project_id' => (int)$data['project'],
            'project_owner_id' => $project['owner_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'assignee_id' => isset($data['assignee']) ? (int)$data['assignee'] : null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'status' => $data['status'] ?? 'Devam Ediyor',
            'progress' => (int)($data['progress'] ?? 0),
            'dependencies' => array_map('intval', $data['dependencies'] ?? []),
        ]);

        $this->syncProjectAssignees((int)$data['project']);
        $task = $this->taskService->attachMeta($task);
        Response::json($task, 201);
    }

    public function detail(Request $request, int $id): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $task = $this->tasks->findById($id);
        if (!$task) {
            Response::json(['detail' => 'Görev bulunamadı.'], 404);
            return;
        }
        $projectOwnerId = $task['project_owner_id'] ?? null;
        $assigneeId = $task['assignee_id'] ?? null;
        if (!($user['is_staff'] ?? false) && $projectOwnerId !== $user['_id'] && $assigneeId !== $user['_id']) {
            Response::json(['detail' => 'Yetkisiz.'], 403);
            return;
        }
        $task = $this->taskService->attachMeta($task);
        Response::json($task);
    }

    public function update(Request $request, int $id): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $task = $this->tasks->findById($id);
        if (!$task) {
            Response::json(['detail' => 'Görev bulunamadı.'], 404);
            return;
        }
        $projectOwnerId = $task['project_owner_id'] ?? null;
        if (!($user['is_staff'] ?? false) && $projectOwnerId !== $user['_id']) {
            Response::json(['detail' => 'Yetkisiz.'], 403);
            return;
        }

        $data = $request->json ?? [];
        $errors = [];
        if (array_key_exists('progress', $data)) {
            $errors = array_merge($errors, Validator::range((int)$data['progress'], 0, 100, 'progress'));
        }
        $errors = array_merge($errors, Validator::dateOrder($data['start_date'] ?? $task['start_date'] ?? null, $data['end_date'] ?? $task['end_date'] ?? null, 'dates'));
        if ($errors) {
            Response::json(['detail' => 'Doğrulama hatası.', 'errors' => $errors], 400);
            return;
        }

        $updates = [];
        foreach (['title', 'description', 'start_date', 'end_date', 'due_date', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }
        if (array_key_exists('progress', $data)) {
            $updates['progress'] = (int)$data['progress'];
        }
        if (array_key_exists('assignee', $data)) {
            $updates['assignee_id'] = $data['assignee'] !== null ? (int)$data['assignee'] : null;
        }
        if (array_key_exists('dependencies', $data)) {
            $updates['dependencies'] = array_map('intval', $data['dependencies'] ?? []);
        }

        $task = $this->tasks->update($id, $updates);
        if (!$task) {
            Response::json(['detail' => 'Görev bulunamadı.'], 404);
            return;
        }
        $this->syncProjectAssignees((int)$task['project_id']);
        $task = $this->taskService->attachMeta($task);
        Response::json($task);
    }

    public function delete(Request $request, int $id): void
    {
        $this->requireAuth($request);
        Response::json(['detail' => 'Silme devre dışı.'], 405);
    }

    public function gantt(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $filters = [];
        if (!empty($request->query['project_id'])) {
            $filters['project'] = $request->query['project_id'];
        }
        $tasks = $this->tasks->listForUser($user, $filters);
        $data = [];
        foreach ($tasks as $task) {
            $progress = Progress::taskProgress($task);
            $assignee = $task['assignee_id'] ? $this->users->findById((int)$task['assignee_id']) : null;
            $project = $this->projects->findById((int)$task['project_id']);
            $data[] = [
                'id' => $task['_id'],
                'title' => $task['title'],
                'start' => $task['start_date'],
                'end' => $task['end_date'],
                'progress' => $progress['effective'],
                'manual_progress' => $progress['manual'],
                'dynamic_progress' => $progress['dynamic'],
                'status' => $task['status'],
                'assignee' => $assignee['email'] ?? null,
                'dependencies' => array_values($task['dependencies'] ?? []),
                'project_name' => $project['name'] ?? null,
                'assignee_name' => $assignee ? trim(($assignee['first_name'] ?? '') . ' ' . ($assignee['last_name'] ?? '')) : null,
            ];
        }
        Response::json($data);
    }

    public function reportsSummary(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $tasks = $this->tasks->listForUser($user);
        $statusCounts = [
            'Tamamlandı' => 0,
            'Devam Ediyor' => 0,
            'Beklemede' => 0,
        ];
        foreach ($tasks as $task) {
            if (isset($statusCounts[$task['status']])) {
                $statusCounts[$task['status']]++;
            }
        }

        $users = $this->users->list([], 1, 200)['items'];
        $usersData = [];
        foreach ($users as $u) {
            $total = 0;
            $done = 0;
            foreach ($tasks as $task) {
                if (($task['assignee_id'] ?? null) === $u['_id']) {
                    $total++;
                    if ($task['status'] === 'Tamamlandı') {
                        $done++;
                    }
                }
            }
            $rate = $total ? (int)round(100 * $done / $total) : 0;
            $usersData[] = [
                'id' => $u['_id'],
                'name' => trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? '')) ?: ($u['email'] ?? ''),
                'total' => $total,
                'done' => $done,
                'rate' => $rate,
            ];
        }

        usort($usersData, fn($a, $b) => [$b['total'], $b['rate']] <=> [$a['total'], $a['rate']]);

        Response::json([
            'status_counts' => $statusCounts,
            'users' => $usersData,
        ]);
    }

    private function syncProjectAssignees(int $projectId): void
    {
        $tasks = $this->tasks->listByProject($projectId);
        $assignees = [];
        foreach ($tasks as $task) {
            if (!empty($task['assignee_id'])) {
                $assignees[] = (int)$task['assignee_id'];
            }
        }
        $this->projects->updateTaskAssignees($projectId, $assignees);
    }
}
