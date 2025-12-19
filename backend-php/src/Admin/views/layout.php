<?php
$loggedIn = !empty($_SESSION['admin_user'] ?? null);
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Proje Yönetimi Admin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f4f6fb; color: #222; }
        header { background: #1f2937; color: #fff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
        header a { color: #fff; text-decoration: none; margin-right: 12px; }
        nav { display: flex; gap: 12px; }
        main { padding: 20px; }
        table { width: 100%; border-collapse: collapse; background: #fff; }
        th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { background: #f9fafb; }
        form.inline { display: inline; }
        .card { background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
        .actions { display: flex; gap: 8px; }
        .btn { padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; }
        .btn-primary { background: #2563eb; color: #fff; }
        .btn-danger { background: #ef4444; color: #fff; }
        .btn-secondary { background: #6b7280; color: #fff; }
        .filters { margin-bottom: 12px; display: flex; gap: 12px; flex-wrap: wrap; }
        input, select, textarea { padding: 6px; border-radius: 4px; border: 1px solid #d1d5db; }
        .pagination { margin-top: 12px; }
    </style>
</head>
<body>
<header>
    <div>Admin Panel</div>
    <?php if ($loggedIn): ?>
        <nav>
            <a href="/admin/projects">Projeler</a>
            <a href="/admin/tasks">Görevler</a>
            <a href="/admin/users">Kullanıcılar</a>
            <a href="/admin/logout">Çıkış</a>
        </nav>
    <?php endif; ?>
</header>
<main>
    <?php require $content; ?>
</main>
</body>
</html>
