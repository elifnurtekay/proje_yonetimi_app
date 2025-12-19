<h2>Projeler</h2>
<div class="filters">
    <form method="get" action="/admin/projects">
        <select name="status">
            <option value="">Durum</option>
            <option value="Aktif" <?php echo ($status ?? '') === 'Aktif' ? 'selected' : ''; ?>>Aktif</option>
            <option value="Tamamlandı" <?php echo ($status ?? '') === 'Tamamlandı' ? 'selected' : ''; ?>>Tamamlandı</option>
            <option value="Beklemede" <?php echo ($status ?? '') === 'Beklemede' ? 'selected' : ''; ?>>Beklemede</option>
        </select>
        <button class="btn btn-secondary" type="submit">Filtrele</button>
    </form>
    <a class="btn btn-primary" href="/admin/projects/new">Yeni Proje</a>
</div>
<table>
    <thead>
    <tr>
        <th>ID</th>
        <th>Ad</th>
        <th>Sahip</th>
        <th>Durum</th>
        <th>İlerleme</th>
        <th>İşlem</th>
    </tr>
    </thead>
    <tbody>
    <?php foreach ($projects as $project): ?>
        <tr>
            <td><?php echo (int)$project['_id']; ?></td>
            <td><?php echo htmlspecialchars($project['name'], ENT_QUOTES, 'UTF-8'); ?></td>
            <td><?php echo (int)($project['owner_id'] ?? 0); ?></td>
            <td><?php echo htmlspecialchars($project['status'] ?? '', ENT_QUOTES, 'UTF-8'); ?></td>
            <td><?php echo (int)($project['progress'] ?? 0); ?>%</td>
            <td class="actions">
                <a class="btn btn-secondary" href="/admin/projects/<?php echo (int)$project['_id']; ?>/edit">Düzenle</a>
                <form class="inline" method="post" action="/admin/projects/<?php echo (int)$project['_id']; ?>/delete">
                    <button class="btn btn-danger" type="submit">Sil</button>
                </form>
            </td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<div class="pagination">Toplam: <?php echo (int)$total; ?></div>
