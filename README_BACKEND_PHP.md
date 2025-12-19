# PHP + MongoDB Backend

## Genel Bakış
Bu dizin, mevcut Django backend yerine PHP + MongoDB tabanlı yeni backend sunar. React frontend ile uyumluluğu koruyacak şekilde aynı endpoint/payload yapıları desteklenir.

- API base: `http://localhost:8080/api`
- Admin Panel: `http://localhost:8080/admin`

## Kurulum

### 1) Ortam dosyası
`backend-php/.env` oluşturun:

```bash
cp backend-php/.env.example backend-php/.env
```

### 2) Docker ile çalıştırma

```bash
docker compose up --build
```

- PHP API: `http://localhost:8080`
- Mongo Express: `http://localhost:8081`

### 3) Lokal (Docker dışı) çalışma

```bash
cd backend-php
composer install
php -S localhost:8080 -t public
```

> PHP için MongoDB extension (`mongodb`) yüklü olmalıdır.

## Migration (SQLite -> MongoDB)

```bash
cd backend-php
composer install
php scripts/migrate_sqlite_to_mongo.php ../proje_yonetimi/db.sqlite3
```

Notlar:
- Django `pbkdf2_sha256` hash’leri taşınır ve PHP login doğrulaması destekler.
- MongoDB koleksiyonları (users, projects, tasks, counters) sıfırlanır.

## API Endpoint Listesi

**Auth / Users**
- `POST /api/users/login/`
- `POST /api/users/register/`
- `POST /api/users/google-login/`
- `GET /api/users/google-config/`
- `POST /api/users/refresh/`
- `GET /api/users/`
- `GET /api/users/me/`
- `PATCH /api/users/{id}/`
- `GET /api/users/find-by-email/`

**Projects**
- `GET /api/projects/`
- `POST /api/projects/`
- `GET /api/projects/{id}/`
- `PATCH /api/projects/{id}/`
- `DELETE /api/projects/{id}/`
- `GET /api/projects/dashboard-summary/`

**Tasks**
- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/{id}/`
- `PATCH /api/tasks/{id}/`
- `DELETE /api/tasks/{id}/` (405 döner)
- `GET /api/tasks/gantt/`
- `GET /api/tasks/reports/summary/`

**Dashboard**
- `GET /api/dashboard/summary/`

## Admin Panel

Admin paneli PHP server-rendered sayfalardan oluşur. Kullanıcı girişini `users` koleksiyonundaki `is_staff=true` veya `role=admin` olan hesaplar yapabilir.

Özellikler:
- Kullanıcı/Proje/Görev CRUD
- Arama ve filtreleme
- Sayfalama

## What changed

- Django backend kaldırıldı, PHP + MongoDB backend eklendi.
- API base URL `http://localhost:8080/api` olarak güncellendi.
- JWT tabanlı auth PHP tarafında sağlanır.
- Admin Panel `/admin` altında eklendi.
- SQLite -> MongoDB migration script’i eklendi.

## Endpoint Differences

- `DELETE /api/tasks/{id}/` Django’da 405 dönerdi, PHP tarafında da 405 döner.
- Dashboard summary payload yapısı korunur (snake_case). Frontend camelCase dönüştürmeye devam eder.
