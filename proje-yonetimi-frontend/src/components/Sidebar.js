import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  // Kullanıcı bilgisini localStorage'dan çek
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    alert("Çıkış yapıldı!");
    navigate("/giris");
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Süreç Denetimi</h2>
        <span className="sidebar-version">v1.0</span>
      </div>
      <div className="sidebar-user">
        <img
          src={`https://ui-avatars.com/api/?name=${user.first_name || "Kullanıcı"}+${user.last_name || ""}&background=random`}
          alt="avatar"
          className="sidebar-avatar"
        />
        <div>
          <div className="sidebar-username">
            {user.first_name || "Kullanıcı"} {user.last_name || ""}
          </div>
          <div className="sidebar-role">
            {user.role || "Üye"}
          </div>
        </div>
      </div>
      <nav className="sidebar-menu">
        <NavLink to="/" end className="sidebar-link">
          Dashboard
        </NavLink>
        <NavLink to="/projeler" className="sidebar-link">
          Süreçler
        </NavLink>
        <NavLink to="/gorevler" className="sidebar-link">
          Görevler
        </NavLink>
        <NavLink to="/gantt-chart" className="sidebar-link">
          Gantt Chart
        </NavLink>
        <NavLink to="/takvim" className="sidebar-link">
          Takvim
        </NavLink>
        <NavLink to="/raporlar" className="sidebar-link">
          Raporlar
        </NavLink>
        <NavLink to="/kullanicilar" className="sidebar-link">
          Kullanıcılar
        </NavLink>
        <div
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
          style={{ color: "#ff5e57", cursor: "pointer" }}
        >
          Çıkış Yap
        </div>
      </nav>
    </div>
  );
}
