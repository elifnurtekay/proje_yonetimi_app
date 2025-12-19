<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ProjectRepository;
use App\Repositories\TaskRepository;
use App\Services\AuthService;
use App\Services\ProjectService;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\Validator;

class ProjectsController extends BaseController
{
    private ProjectRepository $projects;
    private TaskRepository $tasks;
    private ProjectService $projectService;

    public function __construct(AuthService $auth, ProjectRepository $projects, TaskRepository $tasks, ProjectService $projectService, array $config)
    {
        parent::__construct($auth, $config);
        $this->projects = $projects;
        $this->tasks = $tasks;
        $this->projectService = $projectService;
    }

    public function list(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $projects = $this->projects->listForUser($user, $request->query);
        $projects = array_map(fn($p) => $this->projectService->attachProgress($p), $projects);
        Response::json($projects);
    }

    public function create(Request $request): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }

        $data = $request->json ?? [];
        $errors = Validator::required($data, ['name']);
        $errors = array_merge($errors, Validator::range($data['progress'] ?? null, 0, 100, 'progress'));
        if (!empty($data['latitude']) && ((float)$data['latitude'] < -90 || (float)$data['latitude'] > 90)) {
            $errors['latitude'][] = 'Enlem -90 ile 90 arasında olmalıdır.';
        }
        if (!empty($data['longitude']) && ((float)$data['longitude'] < -180 || (float)$data['longitude'] > 180)) {
            $errors['longitude'][] = 'Boylam -180 ile 180 arasında olmalıdır.';
        }
        if (!empty($data['geofence_radius']) && (int)$data['geofence_radius'] <= 0) {
            $errors['geofence_radius'][] = 'Geofence yarıçapı pozitif olmalıdır.';
        }

        if ($errors) {
            Response::json(['detail' => 'Doğrulama hatası.', 'errors' => $errors], 400);
            return;
        }

        $project = $this->projects->create([
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'owner_id' => $user['_id'],
            'status' => $data['status'] ?? 'Aktif',
            'progress' => (int)($data['progress'] ?? 0),
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'location_name' => $data['location_name'] ?? '',
            'city' => $data['city'] ?? '',
            'district' => $data['district'] ?? '',
            'neighborhood' => $data['neighborhood'] ?? '',
            'street' => $data['street'] ?? '',
            'avenue' => $data['avenue'] ?? '',
            'building_no' => $data['building_no'] ?? '',
            'postal_code' => $data['postal_code'] ?? '',
            'latitude' => isset($data['latitude']) ? (float)$data['latitude'] : null,
            'longitude' => isset($data['longitude']) ? (float)$data['longitude'] : null,
            'geofence_radius' => isset($data['geofence_radius']) ? (int)$data['geofence_radius'] : null,
            'created_at' => date('c'),
            'task_assignees' => [],
        ]);

        $project = $this->projectService->attachProgress($project);
        Response::json($project, 201);
    }

    public function detail(Request $request, int $id): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $project = $this->projects->findById($id);
        if (!$project) {
            Response::json(['detail' => 'Proje bulunamadı.'], 404);
            return;
        }
        if (!($user['is_staff'] ?? false) && $project['owner_id'] !== $user['_id'] && !in_array($user['_id'], $project['task_assignees'] ?? [], true)) {
            Response::json(['detail' => 'Yetkisiz.'], 403);
            return;
        }
        $project = $this->projectService->attachProgress($project);
        Response::json($project);
    }

    public function update(Request $request, int $id): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $project = $this->projects->findById($id);
        if (!$project) {
            Response::json(['detail' => 'Proje bulunamadı.'], 404);
            return;
        }
        if (!($user['is_staff'] ?? false) && $project['owner_id'] !== $user['_id']) {
            Response::json(['detail' => 'Yetkisiz.'], 403);
            return;
        }

        $data = $request->json ?? [];
        $errors = [];
        if (array_key_exists('progress', $data)) {
            $errors = array_merge($errors, Validator::range((int)$data['progress'], 0, 100, 'progress'));
        }
        if (array_key_exists('latitude', $data) && $data['latitude'] !== null) {
            $lat = (float)$data['latitude'];
            if ($lat < -90 || $lat > 90) {
                $errors['latitude'][] = 'Enlem -90 ile 90 arasında olmalıdır.';
            }
        }
        if (array_key_exists('longitude', $data) && $data['longitude'] !== null) {
            $lng = (float)$data['longitude'];
            if ($lng < -180 || $lng > 180) {
                $errors['longitude'][] = 'Boylam -180 ile 180 arasında olmalıdır.';
            }
        }
        if (array_key_exists('geofence_radius', $data) && $data['geofence_radius'] !== null && (int)$data['geofence_radius'] <= 0) {
            $errors['geofence_radius'][] = 'Geofence yarıçapı pozitif olmalıdır.';
        }
        if ($errors) {
            Response::json(['detail' => 'Doğrulama hatası.', 'errors' => $errors], 400);
            return;
        }

        $updates = $data;
        unset($updates['owner_id'], $updates['created_at']);
        $project = $this->projects->update($id, $updates);
        if (!$project) {
            Response::json(['detail' => 'Proje bulunamadı.'], 404);
            return;
        }
        $project = $this->projectService->attachProgress($project);
        Response::json($project);
    }

    public function delete(Request $request, int $id): void
    {
        $user = $this->requireAuth($request);
        if (!$user) {
            return;
        }
        $project = $this->projects->findById($id);
        if (!$project) {
            Response::json(['detail' => 'Proje bulunamadı.'], 404);
            return;
        }
        if (!($user['is_staff'] ?? false) && $project['owner_id'] !== $user['_id']) {
            Response::json(['detail' => 'Yetkisiz.'], 403);
            return;
        }

        $this->projects->delete($id);
        Response::json(['detail' => 'Silindi.']);
    }
}
