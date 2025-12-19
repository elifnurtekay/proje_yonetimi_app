<h2><?php echo $project ? 'Proje Düzenle' : 'Yeni Proje'; ?></h2>
<div class="card">
    <form method="post" action="<?php echo $project ? '/admin/projects/' . (int)$project['_id'] . '/edit' : '/admin/projects/new'; ?>">
        <label>Ad</label><br>
        <input type="text" name="name" required value="<?php echo htmlspecialchars($project['name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Açıklama</label><br>
        <textarea name="description"><?php echo htmlspecialchars($project['description'] ?? '', ENT_QUOTES, 'UTF-8'); ?></textarea><br><br>

        <label>Sahip</label><br>
        <select name="owner_id" required>
            <?php foreach ($owners as $owner): ?>
                <option value="<?php echo (int)$owner['_id']; ?>" <?php echo ($project['owner_id'] ?? null) === $owner['_id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($owner['email'], ENT_QUOTES, 'UTF-8'); ?>
                </option>
            <?php endforeach; ?>
        </select><br><br>

        <label>Durum</label><br>
        <input type="text" name="status" value="<?php echo htmlspecialchars($project['status'] ?? 'Aktif', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>İlerleme (%)</label><br>
        <input type="number" name="progress" value="<?php echo (int)($project['progress'] ?? 0); ?>"><br><br>

        <label>Başlangıç</label><br>
        <input type="date" name="start_date" value="<?php echo htmlspecialchars($project['start_date'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Bitiş</label><br>
        <input type="date" name="end_date" value="<?php echo htmlspecialchars($project['end_date'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Lokasyon Adı</label><br>
        <input type="text" name="location_name" value="<?php echo htmlspecialchars($project['location_name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Şehir</label><br>
        <input type="text" name="city" value="<?php echo htmlspecialchars($project['city'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>İlçe</label><br>
        <input type="text" name="district" value="<?php echo htmlspecialchars($project['district'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Mahalle</label><br>
        <input type="text" name="neighborhood" value="<?php echo htmlspecialchars($project['neighborhood'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Sokak</label><br>
        <input type="text" name="street" value="<?php echo htmlspecialchars($project['street'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Cadde</label><br>
        <input type="text" name="avenue" value="<?php echo htmlspecialchars($project['avenue'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Bina No</label><br>
        <input type="text" name="building_no" value="<?php echo htmlspecialchars($project['building_no'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Posta Kodu</label><br>
        <input type="text" name="postal_code" value="<?php echo htmlspecialchars($project['postal_code'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Enlem</label><br>
        <input type="text" name="latitude" value="<?php echo htmlspecialchars($project['latitude'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Boylam</label><br>
        <input type="text" name="longitude" value="<?php echo htmlspecialchars($project['longitude'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <label>Geofence Yarıçapı</label><br>
        <input type="number" name="geofence_radius" value="<?php echo htmlspecialchars($project['geofence_radius'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"><br><br>

        <button class="btn btn-primary" type="submit">Kaydet</button>
        <a class="btn btn-secondary" href="/admin/projects">İptal</a>
    </form>
</div>
