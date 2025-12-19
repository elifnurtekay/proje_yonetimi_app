<h2>Kullanıcılar</h2>
<div class="filters">
    <form method="get" action="/admin/users">
        <input type="text" name="q" placeholder="Ara" value="<?php echo htmlspecialchars($filters['q'] ?? '', ENT_QUOTES, 'UTF-8'); ?>">
        <select name="role">
            <option value="">Rol</option>
            <option value="admin" <?php echo ($filters['role'] ?? '') === 'admin' ? 'selected' : ''; ?>>admin</option>
            <option value="üye" <?php echo ($filters['role'] ?? '') === 'üye' ? 'selected' : ''; ?>>üye</option>
        </select>
        <button class="btn btn-secondary" type="submit">Filtrele</button>
    </form>
    <a class="btn btn-primary" href="/admin/users/new">Yeni Kullanıcı</a>
</div>
<table>
    <thead>
    <tr>
        <th>ID</th>
        <th>E-posta</th>
        <th>Ad</th>
        <th>Rol</th>
        <th>İşlem</th>
    </tr>
    </thead>
    <tbody>
    <?php foreach ($users as $user): ?>
        <tr>
            <td><?php echo (int)$user['_id']; ?></td>
            <td><?php echo htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8'); ?></td>
            <td><?php echo htmlspecialchars(trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? '')), ENT_QUOTES, 'UTF-8'); ?></td>
            <td><?php echo htmlspecialchars($user['role'] ?? '', ENT_QUOTES, 'UTF-8'); ?></td>
            <td class="actions">
                <a class="btn btn-secondary" href="/admin/users/<?php echo (int)$user['_id']; ?>/edit">Düzenle</a>
                <form class="inline" method="post" action="/admin/users/<?php echo (int)$user['_id']; ?>/delete">
                    <button class="btn btn-danger" type="submit">Pasifleştir</button>
                </form>
            </td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<div class="pagination">Toplam: <?php echo (int)$total; ?></div>
