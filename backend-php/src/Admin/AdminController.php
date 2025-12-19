<?php

declare(strict_types=1);

namespace App\Admin;

use App\Repositories\ProjectRepository;
use App\Repositories\TaskRepository;
use App\Repositories\UserRepository;
use App\Utils\Response;

class AdminController
{
    private UserRepository $users;
    private ProjectRepository $projects;
    private TaskRepository $tasks;
    private array $config;

    public function __construct(UserRepository $users, ProjectRepository $projects, TaskRepository $tasks, array $config)
    {
        $this->users = $users;
        $this->projects = $projects;
        $this->tasks = $tasks;
        $this->config = $config;
    }

    public function handle(string $path, string $method): void
    {
        session_name($this->config['admin_session_name']);
        session_start();

        if ($path === '/admin/login' && $method === 'GET') {
            $this->render('login', ['error' => null]);
            return;
        }
        if ($path === '/admin/login' && $method === 'POST') {
            $this->login();
            return;
        }
        if ($path === '/admin/logout') {
            session_destroy();
            Response::redirect('/admin/login');
            return;
        }

        if (!$this->isAuthenticated()) {
            Response::redirect('/admin/login');
            return;
        }

        if ($path === '/admin' || $path === '/admin/') {
            Response::redirect('/admin/projects');
            return;
        }

        if ($path === '/admin/users') {
            $this->usersIndex();
            return;
        }
        if ($path === '/admin/users/new' && $method === 'GET') {
            $this->userForm();
            return;
        }
        if ($path === '/admin/users/new' && $method === 'POST') {
            $this->userCreate();
            return;
        }
        if (preg_match('#^/admin/users/(\d+)/edit$#', $path, $matches)) {
            $userId = (int)$matches[1];
            if ($method === 'GET') {
                $this->userForm($userId);
                return;
            }
            if ($method === 'POST') {
                $this->userUpdate($userId);
                return;
            }
        }
        if (preg_match('#^/admin/users/(\d+)/delete$#', $path, $matches) && $method === 'POST') {
            $this->userDelete((int)$matches[1]);
            return;
        }

        if ($path === '/admin/projects') {
            $this->projectsIndex();
            return;
        }
        if ($path === '/admin/projects/new' && $method === 'GET') {
            $this->projectForm();
            return;
        }
        if ($path === '/admin/projects/new' && $method === 'POST') {
            $this->projectCreate();
            return;
        }
        if (preg_match('#^/admin/projects/(\d+)/edit$#', $path, $matches)) {
            $projectId = (int)$matches[1];
            if ($method === 'GET') {
                $this->projectForm($projectId);
                return;
            }
            if ($method === 'POST') {
                $this->projectUpdate($projectId);
                return;
            }
        }
        if (preg_match('#^/admin/projects/(\d+)/delete$#', $path, $matches) && $method === 'POST') {
            $this->projectDelete((int)$matches[1]);
            return;
        }

        if ($path === '/admin/tasks') {
            $this->tasksIndex();
            return;
        }
        if ($path === '/admin/tasks/new' && $method === 'GET') {
            $this->taskForm();
            return;
        }
        if ($path === '/admin/tasks/new' && $method === 'POST') {
            $this->taskCreate();
            return;
        }
        if (preg_match('#^/admin/tasks/(\d+)/edit$#', $path, $matches)) {
            $taskId = (int)$matches[1];
            if ($method === 'GET') {
                $this->taskForm($taskId);
                return;
            }
            if ($method === 'POST') {
                $this->taskUpdate($taskId);
                return;
            }
        }
        if (preg_match('#^/admin/tasks/(\d+)/delete$#', $path, $matches) && $method === 'POST') {
            $this->taskDelete((int)$matches[1]);
            return;
        }

        http_response_code(404);
        echo 'Not Found';
    }

    private function isAuthenticated(): bool
    {
        return !empty($_SESSION['admin_user']);
    }

    private function login(): void
    {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $user = $this->users->findByEmail($email);
        $error = null;
        if (!$user || empty($user['password_hash']) || !$this->verifyPassword($password, $user['password_hash'])) {
            $error = 'Geçersiz giriş.';
        } elseif (!($user['is_staff'] ?? false) && ($user['role'] ?? '') !== 'admin') {
            $error = 'Yönetici yetkisi gerekli.';
        }

        if ($error) {
            $this->render('login', ['error' => $error]);
            return;
        }

        $_SESSION['admin_user'] = [
            'id' => $user['_id'],
            'email' => $user['email'],
        ];
        Response::redirect('/admin/projects');
    }

    private function usersIndex(): void
    {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = 20;
        $filters = [
            'role' => $_GET['role'] ?? null,
            'q' => $_GET['q'] ?? null,
        ];
        $result = $this->users->list($filters, $page, $limit);
        $this->render('users/index', [
            'users' => $result['items'],
            'total' => $result['total'],
            'page' => $page,
            'limit' => $limit,
            'filters' => $filters,
        ]);
    }

    private function userForm(?int $id = null): void
    {
        $user = $id ? $this->users->findById($id) : null;
        $this->render('users/form', ['user' => $user]);
    }

    private function userCreate(): void
    {
        $data = [
            'email' => $_POST['email'] ?? '',
            'first_name' => $_POST['first_name'] ?? '',
            'last_name' => $_POST['last_name'] ?? '',
            'role' => $_POST['role'] ?? 'üye',
            'is_staff' => isset($_POST['is_staff']),
            'password_hash' => password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT),
            'date_joined' => date('c'),
        ];
        $this->users->create($data);
        Response::redirect('/admin/users');
    }

    private function userUpdate(int $id): void
    {
        $data = [
            'email' => $_POST['email'] ?? '',
            'first_name' => $_POST['first_name'] ?? '',
            'last_name' => $_POST['last_name'] ?? '',
            'role' => $_POST['role'] ?? 'üye',
            'is_staff' => isset($_POST['is_staff']),
        ];
        if (!empty($_POST['password'])) {
            $data['password_hash'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
        }
        $this->users->update($id, $data);
        Response::redirect('/admin/users');
    }

    private function userDelete(int $id): void
    {
        $this->users->update($id, ['is_active' => false]);
        Response::redirect('/admin/users');
    }

    private function projectsIndex(): void
    {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = 20;
        $status = $_GET['status'] ?? null;
        $query = [];
        if ($status) {
            $query['status'] = $status;
        }
        $projects = $this->projects->listForUser(['is_staff' => true], $query);
        $total = count($projects);
        $projects = array_slice($projects, ($page - 1) * $limit, $limit);

        $this->render('projects/index', [
            'projects' => $projects,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'status' => $status,
        ]);
    }

    private function projectForm(?int $id = null): void
    {
        $project = $id ? $this->projects->findById($id) : null;
        $owners = $this->users->list([], 1, 200)['items'];
        $this->render('projects/form', ['project' => $project, 'owners' => $owners]);
    }

    private function projectCreate(): void
    {
        $data = [
            'name' => $_POST['name'] ?? '',
            'description' => $_POST['description'] ?? '',
            'owner_id' => (int)($_POST['owner_id'] ?? 0),
            'status' => $_POST['status'] ?? 'Aktif',
            'progress' => (int)($_POST['progress'] ?? 0),
            'start_date' => $_POST['start_date'] ?? null,
            'end_date' => $_POST['end_date'] ?? null,
            'location_name' => $_POST['location_name'] ?? '',
            'city' => $_POST['city'] ?? '',
            'district' => $_POST['district'] ?? '',
            'neighborhood' => $_POST['neighborhood'] ?? '',
            'street' => $_POST['street'] ?? '',
            'avenue' => $_POST['avenue'] ?? '',
            'building_no' => $_POST['building_no'] ?? '',
            'postal_code' => $_POST['postal_code'] ?? '',
            'latitude' => $_POST['latitude'] !== '' ? (float)$_POST['latitude'] : null,
            'longitude' => $_POST['longitude'] !== '' ? (float)$_POST['longitude'] : null,
            'geofence_radius' => $_POST['geofence_radius'] !== '' ? (int)$_POST['geofence_radius'] : null,
            'created_at' => date('c'),
            'task_assignees' => [],
        ];
        $this->projects->create($data);
        Response::redirect('/admin/projects');
    }

    private function projectUpdate(int $id): void
    {
        $data = [
            'name' => $_POST['name'] ?? '',
            'description' => $_POST['description'] ?? '',
            'owner_id' => (int)($_POST['owner_id'] ?? 0),
            'status' => $_POST['status'] ?? 'Aktif',
            'progress' => (int)($_POST['progress'] ?? 0),
            'start_date' => $_POST['start_date'] ?? null,
            'end_date' => $_POST['end_date'] ?? null,
            'location_name' => $_POST['location_name'] ?? '',
            'city' => $_POST['city'] ?? '',
            'district' => $_POST['district'] ?? '',
            'neighborhood' => $_POST['neighborhood'] ?? '',
            'street' => $_POST['street'] ?? '',
            'avenue' => $_POST['avenue'] ?? '',
            'building_no' => $_POST['building_no'] ?? '',
            'postal_code' => $_POST['postal_code'] ?? '',
            'latitude' => $_POST['latitude'] !== '' ? (float)$_POST['latitude'] : null,
            'longitude' => $_POST['longitude'] !== '' ? (float)$_POST['longitude'] : null,
            'geofence_radius' => $_POST['geofence_radius'] !== '' ? (int)$_POST['geofence_radius'] : null,
        ];
        $this->projects->update($id, $data);
        Response::redirect('/admin/projects');
    }

    private function projectDelete(int $id): void
    {
        $this->projects->delete($id);
        Response::redirect('/admin/projects');
    }

    private function tasksIndex(): void
    {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = 20;
        $filters = [
            'status' => $_GET['status'] ?? null,
            'project' => $_GET['project'] ?? null,
            'assignee' => $_GET['assignee'] ?? null,
        ];
        $tasks = $this->tasks->listForUser(['is_staff' => true], $filters);
        $total = count($tasks);
        $tasks = array_slice($tasks, ($page - 1) * $limit, $limit);
        $projects = $this->projects->listForUser(['is_staff' => true]);
        $users = $this->users->list([], 1, 200)['items'];

        $this->render('tasks/index', [
            'tasks' => $tasks,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'filters' => $filters,
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    private function taskForm(?int $id = null): void
    {
        $task = $id ? $this->tasks->findById($id) : null;
        $projects = $this->projects->listForUser(['is_staff' => true]);
        $users = $this->users->list([], 1, 200)['items'];
        $this->render('tasks/form', ['task' => $task, 'projects' => $projects, 'users' => $users]);
    }

    private function taskCreate(): void
    {
        $data = [
            'project_id' => (int)($_POST['project_id'] ?? 0),
            'title' => $_POST['title'] ?? '',
            'description' => $_POST['description'] ?? '',
            'assignee_id' => $_POST['assignee_id'] !== '' ? (int)$_POST['assignee_id'] : null,
            'start_date' => $_POST['start_date'] ?? null,
            'end_date' => $_POST['end_date'] ?? null,
            'due_date' => $_POST['due_date'] ?? null,
            'status' => $_POST['status'] ?? 'Devam Ediyor',
            'progress' => (int)($_POST['progress'] ?? 0),
            'dependencies' => array_values(array_filter(array_map('intval', explode(',', $_POST['dependencies'] ?? '')))),
        ];
        $project = $this->projects->findById($data['project_id']);
        $data['project_owner_id'] = $project['owner_id'] ?? null;
        $this->tasks->create($data);
        Response::redirect('/admin/tasks');
    }

    private function taskUpdate(int $id): void
    {
        $data = [
            'project_id' => (int)($_POST['project_id'] ?? 0),
            'title' => $_POST['title'] ?? '',
            'description' => $_POST['description'] ?? '',
            'assignee_id' => $_POST['assignee_id'] !== '' ? (int)$_POST['assignee_id'] : null,
            'start_date' => $_POST['start_date'] ?? null,
            'end_date' => $_POST['end_date'] ?? null,
            'due_date' => $_POST['due_date'] ?? null,
            'status' => $_POST['status'] ?? 'Devam Ediyor',
            'progress' => (int)($_POST['progress'] ?? 0),
            'dependencies' => array_values(array_filter(array_map('intval', explode(',', $_POST['dependencies'] ?? '')))),
        ];
        $project = $this->projects->findById($data['project_id']);
        $data['project_owner_id'] = $project['owner_id'] ?? null;
        $this->tasks->update($id, $data);
        Response::redirect('/admin/tasks');
    }

    private function taskDelete(int $id): void
    {
        $this->tasks->update($id, ['status' => 'Silindi']);
        Response::redirect('/admin/tasks');
    }

    private function render(string $view, array $data = []): void
    {
        extract($data, EXTR_SKIP);
        $base = __DIR__ . '/views/';
        $content = $base . $view . '.php';
        require $base . 'layout.php';
    }

    private function verifyPassword(string $password, string $hash): bool
    {
        if (str_starts_with($hash, 'pbkdf2_sha256$')) {
            $parts = explode('$', $hash, 4);
            if (count($parts) !== 4) {
                return false;
            }
            [, $iterations, $salt, $stored] = $parts;
            $derived = base64_encode(hash_pbkdf2('sha256', $password, $salt, (int)$iterations, 32, true));
            return hash_equals($stored, $derived);
        }

        return password_verify($password, $hash);
    }
}
