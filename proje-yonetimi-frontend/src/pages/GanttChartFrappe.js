import React, { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
//import "frappe-gantt/dist/frappe-gantt.css";
import { updateTask } from "../api";

// frappe-gantt'ın istediği veri formatına dönüştür
function convertToFrappeTasks(data) {
  return data.map(task => ({
    id: String(task.id),
    name: task.title,
    start: task.start || task.start_date,     // API'den gelen alanlar
    end: task.end || task.end_date,
    progress: (task.progress !== undefined && task.progress !== null)
      ? task.progress
      : 0,
    dependencies: (task.dependencies && task.dependencies.length > 0)
      ? task.dependencies.join(",")
      : "",
    custom_class: "", // ekstra stil gerekirse
  }));
}

export default function GanttChartFrappe({ ganttData }) {
  const ganttRef = useRef();

  useEffect(() => {
    if (!ganttRef.current || !ganttData || ganttData.length === 0) return;

    // Önce içeriği temizle (yoksa üst üste bindirir)
    ganttRef.current.innerHTML = "";

    // frappe için uygun task dizisi
    const tasks = convertToFrappeTasks(ganttData);

    // Gantt çizimi
    new Gantt(ganttRef.current, tasks, {
      view_mode: "Day",
      language: "tr", // Türkçe desteği
      // Event örnekleri:
      on_click: task => {
        alert(`Görev: ${task.name}`);
      },
      on_date_change: (task, start, end) => {
        // Tarih değişince PATCH at
        updateTask(task.id, { start_date: start, end_date: end }, localStorage.getItem("access"))
            .then(() => alert("Tarih güncellendi!"))
            .catch(() => alert("Tarih güncellenemedi!"));
      },
      on_progress_change: (task, progress) => {
        updateTask(task.id, { progress }, localStorage.getItem("access"))
            .then(() => alert("İlerleme güncellendi!"))
            .catch(() => alert("İlerleme güncellenemedi!"));
      },
    });
  }, [ganttData]);

  return (
    <div>
      <h2>Frappe Gantt Chart</h2>
      <div ref={ganttRef} />
    </div>
  );
}
