<h2><?php echo $user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'; ?></h2>
<div class="card">
    <form method="post" action="<?php echo $user ? '/admin/users/' . (int)$user['_id'] . '/edit' : '/admin/users/new'; ?>">
        <label>E-posta</label><br>
        <input type="email" name="email" required value="<?php echo htmlspecialchars($user['email'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Ad</label><br>
        <input type="text" name="first_name" value="<?php echo htmlspecialchars($user['first_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Soyad</label><br>
        <input type="text" name="last_name" value="<?php echo htmlspecialchars($user['last_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Rol</label><br>
        <input type="text" name="role" value="<?php echo htmlspecialchars($user['role'] ?? 'üye', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Admin</label>
        <input type="checkbox" name="is_staff" <?php echo !empty($user['is_staff']) ? 'checked' : ''; ?>><br><br>

        <label><?php echo $user ? 'Yeni Şifre (opsiyonel)' : 'Şifre'; ?></label><br>
        <input type="password" name="password" <?php echo $user ? '' : 'required'; ?>><br><br>

        <button class="btn btn-primary" type="submit">Kaydet</button>
        <a class="btn btn-secondary" href="/admin/users">İptal</a>
    </form>
</div>
