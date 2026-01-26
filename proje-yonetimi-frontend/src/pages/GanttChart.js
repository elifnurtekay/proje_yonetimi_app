// src/pages/GanttChart.js
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { fetchProjects, fetchGanttTasks } from "../api";
import GanttChartFrappe from "./GanttChartFrappe";
import "./GanttChart.css";

const STATUS_CLASS = {
  Tamamlandı: "chip--success",
  "Devam Ediyor": "chip--info",
  Beklemede: "chip--warn",
  Gecikmiş: "chip--danger",
};

function getStatusClass(status) {
  return STATUS_CLASS[status] || "chip--info";
}

function getInitials(text) {
  if (!text) return "?";
  const parts = text.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function calculateAutoProgress(task) {
  if (!task.start && !task.start_date) return 0;
  if (!task.end && !task.end_date) return 0;
  const start = dayjs(task.start || task.start_date);
  const end   = dayjs(task.end   || task.end_date);
  const today = dayjs();
  if (!start.isValid() || !end.isValid()) return 0;
  if (today.isBefore(start)) return 0;
  if (today.isAfter(end))   return 100;
  const total  = end.diff(start, "day") + 1;
  const passed = today.diff(start, "day") + 1;
  return Math.round((passed / total) * 100);
}

export default function GanttChart() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProject] = useState("");
  const [ganttData, setGanttData] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");

  useEffect(() => {
    fetchProjects(token)
      .then((data) => { setProjects(data); if (data.length) setSelectedProject(data[0].id); })
      .catch(() => setProjects([]));
  }, [token]);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetchGanttTasks(selectedProjectId, token)
      .then((data) => setGanttData(data))
      .finally(() => setLoading(false));
  }, [selectedProjectId, token]);

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <div>
          <h2 className="gantt-title">Gantt Planı</h2>
          <p className="gantt-subtitle">Proje zaman çizelgesi (Frappe Gantt)</p>
        </div>
        <div className="gantt-controls">
          <label className="gantt-select-label" htmlFor="gantt-project">
            Proje
          </label>
          <select
            id="gantt-project"
            className="gantt-project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="gantt-card gantt-wrap">
        {loading ? (
          <div>Yükleniyor...</div>
        ) : (
          <>
            <div className="gantt-summary gantt-summary-top">
              <div className="gantt-summary-item">
                <span>{ganttData.length}</span>
                <small>Toplam Görev</small>
              </div>
              <div className="gantt-summary-item">
                <span>{ganttData.filter(g => g.status === "Tamamlandı").length}</span>
                <small>Tamamlanan</small>
              </div>
              <div className="gantt-summary-item">
                <span>{ganttData.filter(g => g.status !== "Tamamlandı").length}</span>
                <small>Devam Eden</small>
              </div>
              <div className="gantt-summary-item">
                <span>
                  {ganttData.length > 0
                    ? Math.round(
                        ganttData.reduce((a, b) =>
                          a + ((b.progress !== undefined && b.progress !== 0)
                            ? b.progress
                            : calculateAutoProgress(b)
                          ), 0
                        ) / ganttData.length
                      )
                    : 0
                  }%
                </span>
                <small>Ortalama İlerleme</small>
              </div>
            </div>

            <div className="gantt-frappe-card">
              <div className="gantt-frappe-header">
                <div>
                  <h3>Gantt Görünümü</h3>
                  <p>Etkileşimli sürükle-bırak görünümü</p>
                </div>
              </div>
              <div className="gantt-board">
                <div className="gantt-board-list">
                  <div className="gantt-board-list-header">
                    <span>Görev Adı</span>
                    <span>Durum</span>
                  </div>
                  <div className="gantt-board-list-body">
                    {ganttData.map((task) => {
                      const progress = (task.progress !== undefined && task.progress !== null && task.progress !== 0)
                        ? task.progress
                        : calculateAutoProgress(task);
                      const assignee = task.assignee || "Atanmamış";
                      const status = task.status || "Beklemede";
                      return (
                        <div key={task.id} className="gantt-board-item">
                          <div className="gantt-board-item-main">
                            <div className="gantt-avatar">{getInitials(assignee)}</div>
                            <div className="gantt-board-item-info">
                              <div className="gantt-board-item-title">{task.title}</div>
                              <div className="gantt-board-item-meta">
                                <span>👤 {assignee}</span>
                                <span>📅 {task.start || task.start_date || "-"} → {task.end || task.end_date || "-"}</span>
                              </div>
                              <div className="gantt-board-progress">
                                <div className="gantt-board-progress-bar">
                                  <span style={{ width: `${progress}%` }} />
                                </div>
                                <span className="gantt-board-progress-value">%{progress}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`chip gantt-status ${getStatusClass(status)}`}>
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="gantt-board-chart">
                  <GanttChartFrappe ganttData={ganttData} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
