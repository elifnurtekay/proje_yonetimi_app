// src/pages/Login.js
import React, { useState } from "react";
import "./Login.css";
import { fetchMe } from "../api"; // me için

// Bu dosyada kendi login isteğimizi atacağız (api.js'ye dokunmadan)
async function loginCompat(email, password) {
  const url = "http://localhost:8000/api/users/login/";
  const payload = {
    email: email.trim(),
    username: email.trim(),   // backend 'username' bekliyorsa da çalışsın
    password: password,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Debug ve anlaşılır hata
  const text = await res.text().catch(() => "");
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }

  if (!res.ok) {
    console.error("[LOGIN] HTTP", res.status, res.statusText, "->", text);
    const msg =
      data?.detail ||
      data?.message ||
      (res.status === 401
        ? "E-posta/şifre hatalı ya da hesap pasif."
        : `Giriş başarısız (HTTP ${res.status}).`);
    throw new Error(msg);
  }
  return data; // { access: "...", ... } bekleniyor
}

function normalizeUser(u) {
  if (!u) return {};
  const first_name = u.first_name ?? u.firstName ?? "";
  const last_name  = u.last_name  ?? u.lastName  ?? "";
  const is_staff   = !!(u.is_staff ?? u.isStaff);
  const is_super   = !!(u.is_superuser ?? u.isSuperuser);
  const role = u.role ?? (is_super || is_staff ? "admin" : "Üye");
  return {
    id: u.id,
    email: u.email ?? "",
    first_name,
    last_name,
    role,
    is_staff: is_staff,
    is_superuser: is_super,
  };
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      const data = await loginCompat(email, password); // <-- burayı kullanıyoruz
      if (!data?.access) {
        throw new Error("Sunucudan access token dönmedi.");
      }

      // token sakla
      localStorage.setItem("access", data.access);

      // kullanıcıyı çek ve yaz
      try {
        const me = await fetchMe(data.access);
        localStorage.setItem("user", JSON.stringify(normalizeUser(me)));
      } catch (e) {
        console.error("me getirilemedi:", e);
      }

      // yönlendir
      window.location.href = "/";
    } catch (ex) {
      setErr(ex.message || "Giriş başarısız.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">Proje Yönetimi</h1>
        <div className="auth-sub">Hesabınıza giriş yapın</div>

        {err && (
          <div style={{
            background:"#FFEBE6", color:"#BF2600",
            border:"1px solid #FFBDAD", borderRadius:10, padding:"10px 12px",
            marginBottom:12, fontSize:14
          }}>
            {err}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              className="form-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-item">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              className="form-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-actions">
            <button className="btn-primary" type="submit">Giriş Yap</button>
          </div>
        </form>

        <div className="auth-alt">
          Hesabınız yok mu? <a href="/kayit">Kayıt Ol</a>
        </div>
      </section>
    </main>
  );
}
