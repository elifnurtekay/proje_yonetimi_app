import React from "react";

export default function TaskTooltip({ task }) {
  return (
    <div className="gantt-tooltip">
      <strong>{task.title}</strong>
      <span>{task.processName}</span>
      <span>👤 {task.assignee || "-"}</span>
      <span>📅 {task.dateLabel}</span>
      <span>Durum: {task.status}</span>
      <span>İlerleme: %{task.progress}</span>
      {task.isLate ? <span className="gantt-tooltip__late">Gecikme: {task.daysLate} gün</span> : null}
    </div>
  );
}
