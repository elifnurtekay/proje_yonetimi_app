<h2>Görevler</h2>
<div class="filters">
    <form method="get" action="/admin/tasks">
        <select name="status">
            <option value="">Durum</option>
            <option value="Devam Ediyor" <?php echo ($filters['status'] ?? '') === 'Devam Ediyor' ? 'selected' : ''; ?>>Devam Ediyor</option>
            <option value="Tamamlandı" <?php echo ($filters['status'] ?? '') === 'Tamamlandı' ? 'selected' : ''; ?>>Tamamlandı</option>
            <option value="Beklemede" <?php echo ($filters['status'] ?? '') === 'Beklemede' ? 'selected' : ''; ?>>Beklemede</option>
        </select>
        <select name="project">
            <option value="">Proje</option>
            <?php foreach ($projects as $project): ?>
                <option value="<?php echo (int)$project['_id']; ?>" <?php echo ($filters['project'] ?? '') == $project['_id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($project['name'], ENT_QUOTES, 'UTF-8'); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <select name="assignee">
            <option value="">Atanan</option>
            <?php foreach ($users as $user): ?>
                <option value="<?php echo (int)$user['_id']; ?>" <?php echo ($filters['assignee'] ?? '') == $user['_id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8'); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <button class="btn btn-secondary" type="submit">Filtrele</button>
    </form>
    <a class="btn btn-primary" href="/admin/tasks/new">Yeni Görev</a>
</div>
<table>
    <thead>
    <tr>
        <th>ID</th>
        <th>Başlık</th>
        <th>Proje</th>
        <th>Durum</th>
        <th>İlerleme</th>
        <th>İşlem</th>
    </tr>
    </thead>
    <tbody>
    <?php foreach ($tasks as $task): ?>
        <tr>
            <td><?php echo (int)$task['_id']; ?></td>
            <td><?php echo htmlspecialchars($task['title'], ENT_QUOTES, 'UTF-8'); ?></td>
            <td><?php echo (int)($task['project_id'] ?? 0); ?></td>
            <td><?php echo htmlspecialchars($task['status'] ?? '', ENT_QUOTES, 'UTF-8'); ?></td>
            <td><?php echo (int)($task['progress'] ?? 0); ?>%</td>
            <td class="actions">
                <a class="btn btn-secondary" href="/admin/tasks/<?php echo (int)$task['_id']; ?>/edit">Düzenle</a>
                <form class="inline" method="post" action="/admin/tasks/<?php echo (int)$task['_id']; ?>/delete">
                    <button class="btn btn-danger" type="submit">Sil</button>
                </form>
            </td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<div class="pagination">Toplam: <?php echo (int)$total; ?></div>
