<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Bootstrap;

$bootstrap = new Bootstrap(dirname(__DIR__));
$config = $bootstrap->config();

$sqlitePath = $argv[1] ?? dirname(__DIR__) . '/../proje_yonetimi/db.sqlite3';
if (!file_exists($sqlitePath)) {
    fwrite(STDERR, "SQLite DB bulunamadı: $sqlitePath\n");
    exit(1);
}

$pdo = new PDO('sqlite:' . $sqlitePath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db = $bootstrap->mongo()->selectDatabase($config['mongodb_db']);
$db->users->drop();
$db->projects->drop();
$db->tasks->drop();
$db->counters->drop();

$users = $pdo->query('SELECT id, email, first_name, last_name, role, is_staff, password, date_joined FROM users_user')->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $user) {
    $db->users->insertOne([
        '_id' => (int)$user['id'],
        'email' => strtolower($user['email']),
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'role' => $user['role'],
        'is_staff' => (bool)$user['is_staff'],
        'password_hash' => $user['password'],
        'date_joined' => $user['date_joined'],
    ]);
}

$projects = $pdo->query('SELECT * FROM projects_project')->fetchAll(PDO::FETCH_ASSOC);
foreach ($projects as $project) {
    $db->projects->insertOne([
        '_id' => (int)$project['id'],
        'name' => $project['name'],
        'description' => $project['description'],
        'owner_id' => (int)$project['owner_id'],
        'status' => $project['status'],
        'progress' => (int)$project['progress'],
        'start_date' => $project['start_date'],
        'end_date' => $project['end_date'],
        'location_name' => $project['location_name'],
        'city' => $project['city'],
        'district' => $project['district'],
        'neighborhood' => $project['neighborhood'],
        'street' => $project['street'],
        'avenue' => $project['avenue'],
        'building_no' => $project['building_no'],
        'postal_code' => $project['postal_code'],
        'latitude' => $project['latitude'] !== null ? (float)$project['latitude'] : null,
        'longitude' => $project['longitude'] !== null ? (float)$project['longitude'] : null,
        'geofence_radius' => $project['geofence_radius'] !== null ? (int)$project['geofence_radius'] : null,
        'created_at' => $project['created_at'],
        'task_assignees' => [],
    ]);
}

$tasks = $pdo->query('SELECT * FROM tasks_task')->fetchAll(PDO::FETCH_ASSOC);
$dependencies = $pdo->query('SELECT from_task_id, to_task_id FROM tasks_task_dependencies')->fetchAll(PDO::FETCH_ASSOC);
$depsByTask = [];
foreach ($dependencies as $dep) {
    $from = (int)$dep['from_task_id'];
    $depsByTask[$from][] = (int)$dep['to_task_id'];
}

foreach ($tasks as $task) {
    $project = $db->projects->findOne(['_id' => (int)$task['project_id']]);
    $db->tasks->insertOne([
        '_id' => (int)$task['id'],
        'project_id' => (int)$task['project_id'],
        'project_owner_id' => $project['owner_id'] ?? null,
        'title' => $task['title'],
        'description' => $task['description'],
        'assignee_id' => $task['assignee_id'] !== null ? (int)$task['assignee_id'] : null,
        'start_date' => $task['start_date'],
        'end_date' => $task['end_date'],
        'due_date' => $task['due_date'],
        'status' => $task['status'],
        'progress' => (int)$task['progress'],
        'dependencies' => $depsByTask[(int)$task['id']] ?? [],
    ]);
}

$projectAssignees = [];
foreach ($db->tasks->find() as $task) {
    if ($task['assignee_id']) {
        $projectAssignees[$task['project_id']][] = (int)$task['assignee_id'];
    }
}
foreach ($projectAssignees as $projectId => $assignees) {
    $db->projects->updateOne(['_id' => (int)$projectId], ['$set' => ['task_assignees' => array_values(array_unique($assignees))]]);
}

$userMax = $users ? max(array_map(fn($u) => (int)$u['id'], $users)) : 0;
$projectMax = $projects ? max(array_map(fn($p) => (int)$p['id'], $projects)) : 0;
$taskMax = $tasks ? max(array_map(fn($t) => (int)$t['id'], $tasks)) : 0;

$db->counters->insertMany([
    ['_id' => 'users', 'seq' => $userMax + 1],
    ['_id' => 'projects', 'seq' => $projectMax + 1],
    ['_id' => 'tasks', 'seq' => $taskMax + 1],
]);

fwrite(STDOUT, "Migration tamamlandı.\n");
