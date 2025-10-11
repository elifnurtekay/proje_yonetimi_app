// src/pages/GanttChart.js
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { fetchProjects, fetchGanttTasks } from "../api";
import GanttChartFrappe from "./GanttChartFrappe";
import "./GanttChart.css";

const INFO_WIDTH = 260;         // .gantt-task-info ile birebir
const DAY_WIDTH  = 28;          // 1 gün = 28px
const NARROW_PX  = 140;         // bu değerin altındaki çubuklarda iç metni gizleyip üst rozeti göster

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

function getDaysArray(start, end) {
  const arr = [];
  let dt = start;
  while (dt.isBefore(end) || dt.isSame(end, "day")) {
    arr.push(dt);
    dt = dt.add(1, "day");
  }
  return arr;
}

export default function GanttChart() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProject] = useState("");
  const [ganttData, setGanttData] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");

  // Görünüm aralığı
  const allDates = ganttData
    .flatMap(t => [t.start || t.start_date, t.end || t.end_date])
    .filter(Boolean).map(d => dayjs(d)).filter(d => d.isValid());

  let minDate = allDates.length ? allDates[0] : dayjs();
  let maxDate = allDates.length ? allDates[0] : dayjs();
  allDates.forEach(d => { if (d.isBefore(minDate)) minDate = d; if (d.isAfter(maxDate)) maxDate = d; });
  if (minDate.isSame(maxDate)) maxDate = maxDate.add(7, "day");
  const daysArray = getDaysArray(minDate, maxDate);

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

  const dayWidth = DAY_WIDTH;

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <h2>Gantt Chart</h2>
        <select
          className="gantt-project-select"
          value={selectedProjectId}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="gantt-card gantt-wrap">
        {loading ? (
          <div>Yükleniyor...</div>
        ) : (
          <>
            {/* Takvim satırı */}
            <div className="gantt-calendar">
              <div className="gantt-calendar-month">
                {minDate.format("MMMM YYYY")} - {maxDate.format("MMMM YYYY")}
              </div>
              <div className="gantt-calendar-days" style={{ marginLeft: INFO_WIDTH }}>
                {daysArray.map((d, i) => (
                  <div key={i} className="gantt-calendar-day" style={{ width: dayWidth }}>
                    {d.format("DD")}
                  </div>
                ))}
              </div>
            </div>

            {/* Satırlar */}
            <div className="gantt-tasks">
              {ganttData.map((t, i) => {
                const start = t.start ? dayjs(t.start) : (t.start_date ? dayjs(t.start_date) : null);
                const end   = t.end   ? dayjs(t.end)   : (t.end_date   ? dayjs(t.end_date)   : null);

                if (!start || !end || !start.isValid() || !end.isValid()) {
                  return (
                    <div key={i} className="gantt-task-row">
                      <div className="gantt-task-info">
                        <div className="title">{t.title}</div>
                        <div className="gantt-task-details">
                          <span>👤 {t.assignee || "-"}</span>
                          <span>🗓️ -</span>
                          <span className="gantt-tag">Orta</span>
                        </div>
                      </div>
                      <div style={{ color:"#c00", fontSize:13 }}>Geçersiz tarih!</div>
                    </div>
                  );
                }

                const startIdx     = Math.max(0, start.diff(minDate, "day"));
                const endIdx       = Math.max(0, end.diff(minDate, "day"));
                const taskDays     = endIdx - startIdx + 1;
                const progress     = (t.progress !== null && t.progress !== undefined && t.progress !== 0)
                  ? t.progress : calculateAutoProgress(t);

                const leftPx       = startIdx * dayWidth;
                const widthPx      = taskDays * dayWidth;
                const donePx       = Math.round((widthPx * progress) / 100);
                const remainPx     = Math.max(0, widthPx - donePx);
                const narrow       = widthPx < NARROW_PX;

                const labelText    = `${start.format("DD MMM")} - ${end.format("DD MMM")} • %${progress}`;

                return (
                  <div key={i} className="gantt-task-row">
                    {/* Meta */}
                    <div className="gantt-task-info">
                      <div className="title">{t.title}</div>
                      <div className="gantt-task-details">
                        <span>👤 {t.assignee || "-"}</span>
                        <span>🗓️ {start.format("YYYY-MM-DD")} - {end.format("YYYY-MM-DD")}</span>
                        <span className="gantt-tag">Orta</span>
                        {t.dependencies?.length ? (
                          <span style={{ color:"#b267ff" }}>🔗 {t.dependencies.join(", ")}</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="gantt-lane">
                      <div
                        className={`gantt-bar ${narrow ? "is-narrow" : ""}`}
                        style={{
                          left: leftPx,
                          width: widthPx
                        }}
                        title={labelText}
                      >
                        {/* biten kısım */}
                        <div className="bar-done" style={{ width: donePx }} />
                        {/* ayırıcı çizgi */}
                        <span className="bar-seam" style={{ left: donePx }} />
                        {/* kalan kısım */}
                        <div className="bar-remaining" style={{ left: donePx, width: remainPx }} />

                        {/* çubuk içindeki etiket (geniş çubuklarda) */}
                        <div className="inner-label">{labelText}</div>

                        {/* dar çubuklarda üst rozet – her zaman görünür */}
                        {narrow && <div className="gantt-top-label">{labelText}</div>}

                        {/* Hover popover */}
                        <div className="gantt-popover">
                          <div style={{ fontWeight:700, marginBottom:4 }}>{t.title}</div>
                          <div>📅 {start.format("DD MMM YYYY")} → {end.format("DD MMM YYYY")}</div>
                          <div>👤 {t.assignee || "-"}</div>
                          <div>Durum: {t.status || "-"}</div>
                          <div>İlerleme: %{progress}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Özet */}
            <div className="gantt-summary">
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

            {/* Alternatif (Frappe) – mevcut davranış korunuyor */}
            <div style={{ marginTop: 40 }}>
              <h2>Alternatif Gantt (Frappe Gantt)</h2>
              <GanttChartFrappe ganttData={ganttData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
