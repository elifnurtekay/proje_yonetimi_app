// src/pages/Takvim.js
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { fetchProjects, fetchTasks } from "../api";
import "./Takvim.css";

dayjs.locale("tr");

// Grid üret: Pazar (0) – Cumartesi (6) başlıklı 6 satır x 7 sütun
function buildMonthMatrix(base) {
  const startOfMonth = base.startOf("month");
  const endOfMonth = base.endOf("month");

  // day() -> 0=Paz, 1=Pzt, ... 6=Cmt
  const leadingBlanks = startOfMonth.day(); // pazar tabanlı

  const daysInMonth = endOfMonth.date();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - leadingBlanks;
    const d = startOfMonth.add(dayOffset, "day");
    cells.push(dayOffset >= 0 && dayOffset < daysInMonth ? d : null);
  }
  return cells; // length 35 veya 42
}

export default function Takvim() {
  const [month, setMonth] = useState(dayjs()); // aktif ay
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gün tıklanınca sağda/alta listelemek için
  const [selectedDate, setSelectedDate] = useState(null);

  const token = localStorage.getItem("access");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProjects(token), fetchTasks(token)])
      .then(([p, t]) => {
        setProjects(p || []);
        setTasks(t || []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // YYYY-MM-DD -> { tasks:[...], projects:[...] }
  const byDate = useMemo(() => {
    const map = {};

    // PROJELER: end_date takvime işlenir
    projects.forEach((p) => {
      if (!p?.end_date) return;
      const key = dayjs(p.end_date).format("YYYY-MM-DD");
      if (!map[key]) map[key] = { tasks: [], projects: [] };
      map[key].projects.push({
        id: p.id,
        title: p.name,
        type: "project",
        raw: p,
      });
    });

    // GÖREVLER: due_date takvime işlenir
    tasks.forEach((t) => {
      if (!t?.due_date) return;
      const key = dayjs(t.due_date).format("YYYY-MM-DD");
      if (!map[key]) map[key] = { tasks: [], projects: [] };
      map[key].tasks.push({
        id: t.id,
        title: t.title,
        type: "task",
        raw: t,
      });
    });

    return map;
  }, [projects, tasks]);

  const matrix = useMemo(() => buildMonthMatrix(month), [month]);

  const monthLabel = `${month.format("MMMM")} ${month.format("YYYY")}`;

  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  const goPrev = () => setMonth((m) => m.subtract(1, "month"));
  const goNext = () => setMonth((m) => m.add(1, "month"));
  const goToday = () => setMonth(dayjs());

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Takvim</h2>
        <div className="cal-controls">
          <button className="cal-btn" onClick={goPrev}>‹</button>
          <button className="cal-btn" onClick={goToday}>Bugün</button>
          <button className="cal-btn" onClick={goNext}>›</button>
        </div>
      </div>

      <div className="calendar-subtitle">{monthLabel}</div>

      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <>
          {/* Gün isimleri */}
          <div className="cal-grid cal-head">
            {dayNames.map((n) => (
              <div key={n} className="cal-head-cell">
                {n}
              </div>
            ))}
          </div>

          {/* Ay hücreleri */}
          <div className="cal-grid">
            {matrix.map((d, i) => {
              const isToday = d && d.isSame(dayjs(), "day");
              const inThisMonth = d && d.isSame(month, "month");
              const key = d ? d.format("YYYY-MM-DD") : `blank-${i}`;
              const items = d ? byDate[d.format("YYYY-MM-DD")] : null;
              const count =
                items ? (items.tasks?.length || 0) + (items.projects?.length || 0) : 0;

              return (
                <div
                    key={key}
                    className={`cal-cell ${inThisMonth ? "" : "cal-out"} ${
                      isToday ? "cal-today" : ""
                    }`}
                    onClick={() => d && setSelectedDate(d)}
                >
                  <div className="cal-daynum">{d ? d.date() : ""}</div>

                  {/* rozetler */}
                  {items && (
                    <div className="cal-badges">
                      {items.projects?.slice(0, 2).map((p) => (
                        <div key={`p-${p.id}`} className="badge badge-project" title={`Proje bitişi: ${p.title}`}>
                          🗂 {p.title}
                        </div>
                      ))}
                      {items.tasks?.slice(0, 2).map((t) => (
                        <div key={`t-${t.id}`} className="badge badge-task" title={`Görev son tarihi: ${t.title}`}>
                          ✅ {t.title}
                        </div>
                      ))}
                      {count > 4 && (
                        <div className="badge badge-more">+{count - 4}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sağ/alt seçili gün paneli */}
          {selectedDate && (
            <div className="cal-drawer">
              <div className="cal-drawer-head">
                <strong>{selectedDate.format("DD MMMM YYYY")}</strong>
                <button className="cal-btn" onClick={() => setSelectedDate(null)}>Kapat</button>
              </div>

              {(() => {
                const k = selectedDate.format("YYYY-MM-DD");
                const items = byDate[k];
                if (!items) return <div className="empty">Kayıt yok.</div>;
                return (
                  <>
                    {items.projects?.length > 0 && (
                      <>
                        <div className="group-title">Proje Bitişleri</div>
                        <ul className="list">
                          {items.projects.map((p) => (
                            <li key={`p-${p.id}`}>🗂 {p.title}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {items.tasks?.length > 0 && (
                      <>
                        <div className="group-title">Görev Son Tarihleri</div>
                        <ul className="list">
                          {items.tasks.map((t) => (
                            <li key={`t-${t.id}`}>✅ {t.title}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
