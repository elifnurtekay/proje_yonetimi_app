<div class="card" style="max-width: 420px; margin: 40px auto;">
    <h2>Admin Girişi</h2>
    <?php if (!empty($error)): ?>
        <p style="color: #ef4444;"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
    <?php endif; ?>
    <form method="post" action="/admin/login">
        <div style="margin-bottom: 12px;">
            <label>E-posta</label><br>
            <input type="email" name="email" required style="width: 100%;">
        </div>
        <div style="margin-bottom: 12px;">
            <label>Şifre</label><br>
            <input type="password" name="password" required style="width: 100%;">
        </div>
        <button class="btn btn-primary" type="submit">Giriş</button>
    </form>
</div>
