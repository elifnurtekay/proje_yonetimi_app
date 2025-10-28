// src/components/Gantt.jsx
import React from "react";
import "../pages/GanttChart.css";

const DAY = 24 * 60 * 60 * 1000;

function pxFor(date, start, pxPerDay=48) {
  return Math.round((new Date(date) - start) / DAY) * pxPerDay;
}
function widthFor(start, end, pxPerDay=48) {
  return Math.max(pxPerDay, Math.round((new Date(end) - new Date(start)) / DAY) * pxPerDay);
}

export default function Gantt({ tasks, rangeStart, rangeEnd }) {
  const start = new Date(rangeStart);
  const end   = new Date(rangeEnd);
  const days  = Math.round((end - start) / DAY) + 1;

  return (
    <div className="gantt-wrap">
      <div className="gantt-header">
        <h3 style={{margin:0}}>Gantt Chart</h3>
      </div>

      {/* tarih header */}
      <div className="gantt-timeline">
        <div className="gantt-grid">
          <div className="gantt-grid-columns" style={{gridTemplateColumns:`repeat(${days}, 48px)`}}>
            {Array.from({length: days}).map((_,i) => (
              <div key={i}>{start.getDate()+i}</div>
            ))}
          </div>

          <div className="gantt-rows">
            {tasks.map(t => {
              const left = pxFor(t.start_date, start);
              const w    = widthFor(t.start_date, t.end_date);
              return (
                <div className="gantt-row" key={t.id}>
                  {/* sol meta */}
                  <div className="gantt-meta">
                    <div className="title">{t.title}</div>
                    <div className="sub">
                      {t.assignee_email || "-"} • {t.start_date} – {t.end_date}
                    </div>
                    <span className="chip">
                      {t.priority || "Orta"}
                    </span>
                  </div>

                  {/* timeline lane */}
                  <div className="gantt-lane">
                    <div
                      className="gantt-bar"
                      style={{
                        left, width: w,
                        // progress değeri bar içinde overlay olarak
                        ["--progress"]: `${t.progress ?? 0}%`
                      }}
                      title={`${t.title} • %${t.progress ?? 0}`}
                    >
                      <div className="inner-label">
                        {t.title} — %{t.progress ?? 0}
                      </div>

                      {/* Hover popover – barın ÜSTÜNDE görünür */}
                      <div className="gantt-popover">
                        <b>{t.title}</b><br/>
                        Proje: {t.project_name || "-"}<br/>
                        Atanan: {t.assignee_name || "-"}<br/>
                        Tarih: {t.start_date} – {t.end_date}<br/>
                        Durum: {t.status} • %{t.progress ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* alt özet */}
          <div className="gantt-summary">
            <div><b>{tasks.length}</b> <span className="muted">Toplam Görev</span></div>
            <div><b>{tasks.filter(x=>x.status==="Tamamlandı").length}</b> <span className="muted">Tamamlanan</span></div>
            <div><b>{tasks.filter(x=>x.status!=="Tamamlandı").length}</b> <span className="muted">Devam Eden</span></div>
            <div><b>{Math.round(tasks.reduce((a,t)=>a+(t.progress||0),0)/Math.max(1,tasks.length))}%</b> <span className="muted">Ortalama İlerleme</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
