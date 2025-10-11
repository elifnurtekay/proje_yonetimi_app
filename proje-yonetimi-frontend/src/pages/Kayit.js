import React, { useState } from "react";
import { registerUser } from "../api";
import "./Login.css";

export default function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
  });

  function setField(k, v){ setForm(s => ({...s, [k]: v})); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.password2) return alert("Şifreler aynı değil.");
    const data = await registerUser({
      first_name: form.first_name,
      last_name:  form.last_name,
      email:      form.email,
      password:   form.password
    });
    if (data?.id || data?.success) {
      window.location.href = "/giris";
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">Proje Yönetimi</h1>
        <div className="auth-sub">Kayıt Olun</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-item">
              <label htmlFor="fname">Ad</label>
              <input id="fname" className="form-input"
                value={form.first_name}
                onChange={e=>setField("first_name", e.target.value)}
                placeholder="Adınız" required />
            </div>
            <div className="form-item">
              <label htmlFor="lname">Soyad</label>
              <input id="lname" className="form-input"
                value={form.last_name}
                onChange={e=>setField("last_name", e.target.value)}
                placeholder="Soyadınız" required />
            </div>
          </div>

          <div className="form-item">
            <label htmlFor="remail">E-posta</label>
            <input id="remail" className="form-input" type="email" inputMode="email"
              autoComplete="email" placeholder="ornek@email.com"
              value={form.email} onChange={e=>setField("email", e.target.value)} required />
          </div>

          <div className="form-grid-2">
            <div className="form-item">
              <label htmlFor="rpass">Şifre</label>
              <input id="rpass" className="form-input" type="password"
                autoComplete="new-password" placeholder="••••••••"
                value={form.password} onChange={e=>setField("password", e.target.value)} required />
            </div>
            <div className="form-item">
              <label htmlFor="rpass2">Şifre Tekrar</label>
              <input id="rpass2" className="form-input" type="password"
                autoComplete="new-password" placeholder="••••••••"
                value={form.password2} onChange={e=>setField("password2", e.target.value)} required />
            </div>
          </div>

          <div className="auth-actions">
            <button className="btn-primary" type="submit">Kayıt Ol</button>
          </div>
        </form>

        <div className="auth-alt">
          Zaten hesabınız var mı? <a href="/giris">Giriş Yap</a>
        </div>
      </section>
    </main>
  );
}