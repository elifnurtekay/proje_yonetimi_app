<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Admin\AdminController;
use App\Bootstrap;
use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\ProjectsController;
use App\Controllers\TasksController;
use App\Controllers\UsersController;
use App\Repositories\ProjectRepository;
use App\Repositories\TaskRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\ProjectService;
use App\Services\TaskService;
use App\Services\UserService;
use App\Utils\Request;
use App\Utils\Response;
use FastRoute\RouteCollector;

$bootstrap = new Bootstrap(dirname(__DIR__));
$config = $bootstrap->config();
$request = new Request();

if ($request->path === '/health') {
    Response::json(['status' => 'ok']);
    return;
}

if (str_starts_with($request->path, '/api')) {
    $origin = $request->headers['Origin'] ?? $request->headers['origin'] ?? '';
    if ($origin && in_array($origin, $config['cors_allowed_origins'], true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Credentials: true');

    if ($request->method === 'OPTIONS') {
        http_response_code(204);
        return;
    }
}

$db = $bootstrap->mongo()->selectDatabase($config['mongodb_db']);
$usersRepo = new UserRepository($db);
$projectsRepo = new ProjectRepository($db);
$tasksRepo = new TaskRepository($db);
$authService = new AuthService($usersRepo, $config);
$userService = new UserService($usersRepo);
$projectService = new ProjectService($projectsRepo, $tasksRepo);
$taskService = new TaskService($tasksRepo, $projectsRepo, $usersRepo);

if (str_starts_with($request->path, '/admin')) {
    $admin = new AdminController($usersRepo, $projectsRepo, $tasksRepo, $config);
    $admin->handle($request->path, $request->method);
    return;
}

$dispatcher = FastRoute\simpleDispatcher(function (RouteCollector $r) {
    $r->addRoute('POST', '/api/users/login/', ['AuthController', 'login']);
    $r->addRoute('POST', '/api/users/register/', ['AuthController', 'register']);
    $r->addRoute('POST', '/api/users/google-login/', ['AuthController', 'googleLogin']);
    $r->addRoute('GET', '/api/users/google-config/', ['AuthController', 'googleConfig']);
    $r->addRoute('POST', '/api/users/refresh/', ['AuthController', 'refresh']);

    $r->addRoute('GET', '/api/users/', ['UsersController', 'list']);
    $r->addRoute('GET', '/api/users/me/', ['UsersController', 'me']);
    $r->addRoute('GET', '/api/users/find-by-email/', ['UsersController', 'findByEmail']);
    $r->addRoute('PATCH', '/api/users/{id:\\d+}/', ['UsersController', 'update']);

    $r->addRoute('GET', '/api/projects/', ['ProjectsController', 'list']);
    $r->addRoute('POST', '/api/projects/', ['ProjectsController', 'create']);
    $r->addRoute('GET', '/api/projects/{id:\\d+}/', ['ProjectsController', 'detail']);
    $r->addRoute('PATCH', '/api/projects/{id:\\d+}/', ['ProjectsController', 'update']);
    $r->addRoute('DELETE', '/api/projects/{id:\\d+}/', ['ProjectsController', 'delete']);
    $r->addRoute('GET', '/api/projects/dashboard-summary/', ['DashboardController', 'summary']);

    $r->addRoute('GET', '/api/tasks/', ['TasksController', 'list']);
    $r->addRoute('POST', '/api/tasks/', ['TasksController', 'create']);
    $r->addRoute('GET', '/api/tasks/gantt/', ['TasksController', 'gantt']);
    $r->addRoute('GET', '/api/tasks/reports/summary/', ['TasksController', 'reportsSummary']);
    $r->addRoute('GET', '/api/tasks/{id:\\d+}/', ['TasksController', 'detail']);
    $r->addRoute('PATCH', '/api/tasks/{id:\\d+}/', ['TasksController', 'update']);
    $r->addRoute('DELETE', '/api/tasks/{id:\\d+}/', ['TasksController', 'delete']);

    $r->addRoute('GET', '/api/dashboard/summary/', ['DashboardController', 'summary']);
});

$routeInfo = $dispatcher->dispatch($request->method, $request->path);

switch ($routeInfo[0]) {
    case FastRoute\Dispatcher::NOT_FOUND:
        Response::json(['detail' => 'Not found'], 404);
        break;
    case FastRoute\Dispatcher::METHOD_NOT_ALLOWED:
        Response::json(['detail' => 'Method not allowed'], 405);
        break;
    case FastRoute\Dispatcher::FOUND:
        [$class, $method] = $routeInfo[1];
        $vars = $routeInfo[2];

        switch ($class) {
            case 'AuthController':
                $controller = new AuthController($authService, $usersRepo, $userService, $config);
                break;
            case 'UsersController':
                $controller = new UsersController($authService, $usersRepo, $userService, $config);
                break;
            case 'ProjectsController':
                $controller = new ProjectsController($authService, $projectsRepo, $tasksRepo, $projectService, $config);
                break;
            case 'TasksController':
                $controller = new TasksController($authService, $tasksRepo, $projectsRepo, $usersRepo, $taskService, $config);
                break;
            case 'DashboardController':
                $controller = new DashboardController($authService, $projectsRepo, $tasksRepo, $usersRepo, $config);
                break;
            default:
                Response::json(['detail' => 'Not found'], 404);
                return;
        }

        $controller->$method($request, ...array_values($vars));
        break;
}
