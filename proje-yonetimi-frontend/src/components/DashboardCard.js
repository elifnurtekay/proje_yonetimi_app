import React from "react";
import "./DashboardCard.css"; // (Varsa stil dosyan)

function DashboardCard({ title, value, icon, color }) {
  return (
    <div className="dashboard-card" style={{ background: color }}>
      <div className="dashboard-card-title">{title}</div>
      <div className="dashboard-card-value">{value}</div>
      <div className="dashboard-card-icon">{icon}</div>
    </div>
  );
}

export default DashboardCard;
