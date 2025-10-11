// src/pages/Login.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Login.css";
import { fetchMe, fetchGoogleConfig, googleLogin } from "../api"; // me için

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

const ENV_GOOGLE_CLIENT_ID = (process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleDivRef = useRef(null);

  const [googleConfig, setGoogleConfig] = useState({
    clientId: ENV_GOOGLE_CLIENT_ID,
    enabled: Boolean(ENV_GOOGLE_CLIENT_ID),
  });

  const googleClientId = googleConfig.clientId;
  const googleEnabled = Boolean(googleConfig.enabled && googleClientId);

  const finalizeLogin = useCallback(async (payload) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const data = await loginCompat(email, password);
      await finalizeLogin(data);
    } catch (ex) {
      setErr(ex.message || "Giriş başarısız.");
    }
  };

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      setErr("Google oturumundan kimlik bilgisi alınamadı.");
      return;
    }

    setErr("");
    setGoogleLoading(true);
    try {
      const data = await googleLogin(response.credential);
      await finalizeLogin(data);
    } catch (error) {
      setErr(error.message || "Google ile giriş başarısız.");
    } finally {
      setGoogleLoading(false);
    }
  }, [finalizeLogin]);

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
      text: "signin_with",
      width: 320,
    });
    google.accounts.id.prompt();
    setGoogleReady(true);
  }, [googleClientId, googleEnabled, handleGoogleCredential]);

  useEffect(() => {
    let isMounted = true;

    async function loadGoogleConfig() {
      try {
        const cfg = await fetchGoogleConfig();
        if (!isMounted) return;
        if (cfg?.enabled && cfg?.client_id) {
          setGoogleConfig({ clientId: cfg.client_id, enabled: true });
        } else if (!ENV_GOOGLE_CLIENT_ID) {
          setGoogleConfig({ clientId: "", enabled: false });
        }
      } catch (error) {
        console.warn("Google yapılandırması alınamadı", error);
      }
    }

    loadGoogleConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleEnabled) {
      setGoogleReady(false);
      setGoogleLoading(false);
    }
  }, [googleEnabled]);

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
        setErr((prev) => prev || "Google girişi bileşeni yüklenemedi.");
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

        {googleEnabled ? (
          <div className="auth-google-block">
            <div className="auth-divider"><span>veya</span></div>
            <div className={`google-button-shell ${(googleLoading || !googleReady) ? "is-loading" : ""}`}>
              <div ref={googleDivRef} className="google-button-host" />
            </div>
            <div className="google-status">
              {googleLoading
                ? "Google ile giriş yapılıyor…"
                : googleReady
                  ? "Google hesabınızla tek dokunuşla giriş yapın."
                  : "Google butonu yükleniyor…"}
            </div>
          </div>
        ) : (
          <div className="auth-google-disabled">
            Google ile giriş şu anda etkin değil. Lütfen daha sonra tekrar deneyin.
          </div>
        )}

        <div className="auth-alt">
          Hesabınız yok mu? <a href="/kayit">Kayıt Ol</a>
        </div>
      </section>
    </main>
  );
}
