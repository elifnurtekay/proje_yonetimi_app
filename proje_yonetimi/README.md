# Proje Yönetimi API

## Google ile Giriş

Google hesabı ile oturum açma desteği için aşağıdaki ortam değişkenini tanımlayın:

```
export GOOGLE_CLIENT_ID=google-istemci-idniz.apps.googleusercontent.com
```

API `POST /api/users/google-login/` isteğiyle Google ID token doğrulaması yapar ve mevcut kullanıcıyı döndürür veya oluşturur. Ön yüz uygulaması, `GET /api/users/google-config/` isteğiyle istemci kimliğinin tanımlı olup olmadığını sorgulayabilir.

Gerekli paketler `requirements.txt` dosyasında listelenmiştir.
