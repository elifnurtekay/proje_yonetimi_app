import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchMe, googleLogin, registerUser } from "../api";
import "./Login.css";

export default function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
  });

  const [err, setErr] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleDivRef = useRef(null);

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const googleEnabled = Boolean(googleClientId);

  function setField(k, v){ setForm(s => ({...s, [k]: v})); }

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

  const finalizeAuth = useCallback(async (payload) => {
    if (!payload?.access) {
      throw new Error("Sunucudan access token dönmedi.");
    }

    localStorage.setItem("access", payload.access);
    if (payload.refresh) {
      localStorage.setItem("refresh", payload.refresh);
    }

    let userData = payload.user;
    if (!userData) {
      try {
        userData = await fetchMe(payload.access);
      } catch (error) {
        console.error("Kullanıcı bilgisi alınamadı:", error);
      }
    }

    if (userData) {
      localStorage.setItem("user", JSON.stringify(normalizeUser(userData)));
    }

    window.location.href = "/";
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (form.password !== form.password2) {
      setErr("Şifreler aynı değil.");
      return;
    }
    try {
      const data = await registerUser({
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        password:   form.password
      });
      if (data?.access) {
        await finalizeAuth(data);
        return;
      }
      if (data?.id || data?.success) {
        window.location.href = "/giris";
        return;
      }
      const detail = data?.detail || data?.error || "Kayıt işlemi tamamlanamadı.";
      setErr(detail);
    } catch (error) {
      console.error("Kayıt başarısız", error);
      setErr(error.message || "Kayıt başarısız oldu.");
    }
  }

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      setErr("Google oturumundan kimlik bilgisi alınamadı.");
      return;
    }

    setErr("");
    setGoogleLoading(true);
    try {
      const data = await googleLogin(response.credential);
      await finalizeAuth(data);
    } catch (error) {
      setErr(error.message || "Google ile kayıt işlemi tamamlanamadı.");
    } finally {
      setGoogleLoading(false);
    }
  }, [finalizeAuth]);

  const renderGoogleButton = useCallback(() => {
    if (!googleEnabled) return;
    if (typeof window === "undefined") return;
    const google = window.google;
    if (!google?.accounts?.id) return;
    if (!googleDivRef.current) return;

    googleDivRef.current.innerHTML = "";
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });
    google.accounts.id.renderButton(googleDivRef.current, {
      theme: "filled_blue",
      size: "large",
      shape: "pill",
      text: "signup_with",
      width: 320,
    });
    google.accounts.id.prompt();
    setGoogleReady(true);
  }, [googleClientId, googleEnabled, handleGoogleCredential]);

  useEffect(() => {
    if (!googleEnabled) return undefined;
    if (typeof window === "undefined") return undefined;

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }

    let cancelled = false;
    const existing = document.querySelector("script[data-google-client]");
    const onLoad = () => {
      if (!cancelled) {
        renderGoogleButton();
      }
    };

    if (existing) {
      existing.addEventListener("load", onLoad);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", onLoad);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleClient = "true";
    script.onload = onLoad;
    script.onerror = () => {
      if (!cancelled) {
        setErr((prev) => prev || "Google bileşeni yüklenemedi.");
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
      script.onerror = null;
    };
  }, [googleEnabled, renderGoogleButton]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">Proje Yönetimi</h1>
        <div className="auth-sub">Kayıt Olun</div>

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

        {googleEnabled ? (
          <div className="auth-google-block">
            <div className="auth-divider"><span>veya</span></div>
            <div className={`google-button-shell ${(googleLoading || !googleReady) ? "is-loading" : ""}`}>
              <div ref={googleDivRef} className="google-button-host" />
            </div>
            <div className="google-status">
              {googleLoading
                ? "Google ile kayıt olunuyor…"
                : googleReady
                  ? "Google hesabınızla saniyeler içinde kayıt olun."
                  : "Google butonu yükleniyor…"}
            </div>
          </div>
        ) : (
          <div className="auth-google-disabled">
            Google ile kayıt için yönetici tarafından REACT_APP_GOOGLE_CLIENT_ID değeri tanımlanmalıdır.
          </div>
        )}

        <div className="auth-alt">
          Zaten hesabınız var mı? <a href="/giris">Giriş Yap</a>
        </div>
      </section>
    </main>
  );
}
