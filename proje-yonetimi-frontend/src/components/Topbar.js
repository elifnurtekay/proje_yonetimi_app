import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Topbar.css";

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  // Kullanıcı bilgisini localStorage'dan çek
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const titles = {
    "/": "Dashboard",
    "/projeler": "Süreçler",
    "/gorevler": "Görevler",
    "/gantt-chart": "Gantt Planı",
    "/takvim": "Takvim",
    "/raporlar": "Raporlar",
    "/kullanicilar": "Kullanıcılar",
    "/giris": "Giriş Yap",
    "/kayit": "Kayıt Ol",
  };
  const title = titles[location.pathname] || "Kontrol Paneli";

  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="topbar-user">
          <span>{user.first_name || "Kullanıcı"} {user.last_name || ""}</span>
          <span className="topbar-role">{user.role || "Üye"}</span>
          <img
            src={`https://ui-avatars.com/api/?name=${user.first_name || "Kullanıcı"}+${user.last_name || ""}&background=random`}
            alt="avatar"
            className="topbar-avatar"
          />
        </div>
        <button
          onClick={() => navigate("/giris")}
          className="topbar-login-btn"
        >
          Giriş / Kayıt Ol
        </button>
      </div>
    </div>
  );
}