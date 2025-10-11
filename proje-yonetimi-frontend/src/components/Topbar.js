import React from "react";
import { useNavigate } from "react-router-dom";
import "./Topbar.css";

export default function Topbar() {
  const navigate = useNavigate();
  // Kullanıcı bilgisini localStorage'dan çek
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="topbar">
      <div className="topbar-title">Dashboard</div>
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
