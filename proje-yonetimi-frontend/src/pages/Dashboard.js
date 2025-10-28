// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../api";
import { ensureEffectiveProgress, ensureListEffectiveProgress } from "../utils/progress";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState({
    total_projects: 0,
    active_tasks: 0,
    team_members: 0,
    completed_tasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("access");

    fetchDashboardSummary(token)
      .then((data) => {
        // DEBUG görmek isterseniz:
        // console.log("DASHBOARD RAW ->", data);

        // Backend -> UI mapping
        const mappedCards = {
          total_projects:  Number(data?.totalProjects ?? 0),
          active_tasks:    Number(data?.activeTasks   ?? 0),
          team_members:    Number(data?.members       ?? 0),
          completed_tasks: Number(data?.completed     ?? 0),
        };
      
        const mappedRecent = Array.isArray(data?.recentProjects)
          ? data.recentProjects
          : [];
 
        const mappedUpcoming = Array.isArray(data?.upcomingTasks)
          ? data.upcomingTasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              progress: t.progress ?? 0,
              manual_progress: t.manual_progress,
              dynamic_progress: t.dynamic_progress,
              start_date: t.start_date,
              end_date: t.end_date,
              due_date: t.due_date,
              project_name: t.project_name || t.project__name,
              assignee_name: t.assignee_name || [t.assignee__first_name, t.assignee__last_name]
                .filter(Boolean)
                .join(" ") || null,
            }))
          : [];

        setCards(mappedCards);
        setRecentProjects(ensureListEffectiveProgress(mappedRecent));
        setUpcomingTasks(ensureListEffectiveProgress(mappedUpcoming, { startKey: "start_date", dueKey: "due_date" }));
      })
      .catch((err) => {
        console.error(err);
        setCards({
          total_projects: 0,
          active_tasks: 0,
          team_members: 0,
          completed_tasks: 0,
        });
        setRecentProjects([]);
        setUpcomingTasks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentProjects((prev) => ensureListEffectiveProgress(prev, undefined, true));
      setUpcomingTasks((prev) => ensureListEffectiveProgress(prev, { startKey: "start_date", dueKey: "due_date" }, true));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 18 }}>
        <StatCard tone="brand"  title="Toplam Proje" value={cards.total_projects} icon="📁"/>
        <StatCard tone="green"  title="Aktif Görev"  value={cards.active_tasks}   icon="📝"/>
        <StatCard tone="purple" title="Ekip Üyesi"   value={cards.team_members}   icon="👥"/>
        <StatCard tone="orange" title="Tamamlanan"   value={cards.completed_tasks} icon="✅"/>

      </div>

      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Box title="Son Projeler">
          {loading ? (
            <Empty>Yükleniyor…</Empty>
          ) : recentProjects.length === 0 ? (
            <Empty>Gösterilecek proje yok.</Empty>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {recentProjects.map((p) => (
                <li key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f1f4" }}>
                  <b>{p.name}</b>
                  {p.description ? (
                    <div style={{ color: "#70727e", fontSize: 13 }}>{p.description}</div>
                  ) : null}
                  <div style={{ color: "#70727e", fontSize: 13 }}>
                    Durum: {p.status || "-"} • %{ensureEffectiveProgress(p).effective_progress}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Box>

        <Box title="Yaklaşan Görevler (14 gün)">
          {loading ? (
            <Empty>Yükleniyor…</Empty>
          ) : upcomingTasks.length === 0 ? (
            <Empty>Yaklaşan görev yok.</Empty>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {upcomingTasks.map((t) => (
                <li key={t.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f1f4" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <b>{t.title}</b>
                      <div style={{ color: "#70727e", fontSize: 13 }}>
                        Proje: {t.project_name || "-"} • Atanan: {t.assignee_name || "-"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600 }}>{t.due_date}</div>
                      <div style={{ color: "#70727e", fontSize: 13 }}>
                        {t.status} • %{ensureEffectiveProgress(t, { startKey: "start_date", dueKey: "due_date" }).effective_progress}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Box>
      </div>
    </div>
  );
}

/*function StatCard({ color, title, value, icon }) {
  return (
    <div
      style={{
        background: color,
        color: "#fff",
        borderRadius: 18,
        padding: 22,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: "0 6px 18px #00000014",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ opacity: 0.9 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ position: "absolute", opacity: 0.2, fontSize: 48, right: 16, top: 10 }}>{icon}</div>
    </div>
  );
}*/

function StatCard({ tone="brand", title, value, icon }) {
  const bg = {
    brand:  "linear-gradient(135deg, #0052CC, #0065FF)",
    green:  "linear-gradient(135deg, #36B37E, #57D9A3)",
    purple: "linear-gradient(135deg, #6554C0, #8777D9)",
    orange: "linear-gradient(135deg, #FF8B00, #FFAB00)",
  }[tone];

  return (
    <div className="stat" style={{ background:bg, minHeight:120 }}>
      <div style={{ opacity:.95 }}>{title}</div>
      <div style={{ fontSize:36, fontWeight:800, marginTop:8 }}>{value}</div>
      <div style={{ position:"absolute", opacity:.15, fontSize:48, right:16, top:10 }}>{icon}</div>
    </div>
  );
}

function Box({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 2px 14px #1e20470e" }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return (
    <div
      style={{
        background: "#fafbff",
        border: "1px dashed #e6e7f1",
        borderRadius: 12,
        padding: 14,
        color: "#7d8196",
      }}
    >
      {children}
    </div>
  );
}