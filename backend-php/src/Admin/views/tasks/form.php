<h2><?php echo $task ? 'Görev Düzenle' : 'Yeni Görev'; ?></h2>
<div class="card">
    <form method="post" action="<?php echo $task ? '/admin/tasks/' . (int)$task['_id'] . '/edit' : '/admin/tasks/new'; ?>">
        <label>Başlık</label><br>
        <input type="text" name="title" required value="<?php echo htmlspecialchars($task['title'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Proje</label><br>
        <select name="project_id" required>
            <?php foreach ($projects as $project): ?>
                <option value="<?php echo (int)$project['_id']; ?>" <?php echo ($task['project_id'] ?? null) === $project['_id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($project['name'], ENT_QUOTES, 'UTF-8'); ?>
                </option>
            <?php endforeach; ?>
        </select><br><br>

        <label>Atanan</label><br>
        <select name="assignee_id">
            <option value="">Seçiniz</option>
            <?php foreach ($users as $user): ?>
                <option value="<?php echo (int)$user['_id']; ?>" <?php echo ($task['assignee_id'] ?? null) === $user['_id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8'); ?>
                </option>
            <?php endforeach; ?>
        </select><br><br>

        <label>Durum</label><br>
        <input type="text" name="status" value="<?php echo htmlspecialchars($task['status'] ?? 'Devam Ediyor', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>İlerleme (%)</label><br>
        <input type="number" name="progress" value="<?php echo (int)($task['progress'] ?? 0); ?>"><br><br>

        <label>Başlangıç</label><br>
        <input type="date" name="start_date" value="<?php echo htmlspecialchars($task['start_date'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Bitiş</label><br>
        <input type="date" name="end_date" value="<?php echo htmlspecialchars($task['end_date'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Son Tarih</label><br>
        <input type="date" name="due_date" value="<?php echo htmlspecialchars($task['due_date'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Bağımlılıklar (ID, virgülle)</label><br>
        <input type="text" name="dependencies" value="<?php echo htmlspecialchars(isset($task['dependencies']) ? implode(',', $task['dependencies']) : '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Açıklama</label><br>
        <textarea name="description"><?php echo htmlspecialchars($task['description'] ?? '', ENT_QUOTES, 'UTF-8'); ?></textarea><br><br>

        <button class="btn btn-primary" type="submit">Kaydet</button>
        <a class="btn btn-secondary" href="/admin/tasks">İptal</a>
    </form>
</div>
