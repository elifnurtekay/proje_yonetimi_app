import React from "react";

const STATUS_CLASS = {
  Bekliyor: "muted",
  "Devam Ediyor": "info",
  Tamamlandı: "success",
  Gecikmiş: "danger",
};

export default function TaskListPanel({ tasks, onTaskClick }) {
  return (
    <div className="gantt-list">
      <div className="gantt-list__header">
        <div>Görev</div>
        <div>Süreç</div>
        <div>Atanan</div>
        <div>Durum</div>
        <div>İlerleme</div>
      </div>
      <div className="gantt-list__body">
        {tasks.map((task) => (
          <div
            key={task.uid}
            className={`gantt-list__row ${task.isInvalid ? "is-invalid" : ""}`}
            onClick={() => onTaskClick(task)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") onTaskClick(task);
            }}
          >
            <div className="gantt-list__cell">
              <div className="gantt-list__title">{task.title}</div>
              {task.isInvalid ? (
                <small className="gantt-list__warning">Geçersiz tarih</small>
              ) : (
                <small className="gantt-list__meta">{task.dateLabel}</small>
              )}
            </div>
            <div className="gantt-list__cell">
              <span className="gantt-pill">{task.processName}</span>
            </div>
            <div className="gantt-list__cell gantt-list__assignee">
              {task.assignee || "-"}
            </div>
            <div className="gantt-list__cell">
              <span className={`gantt-status ${STATUS_CLASS[task.status] || "muted"}`}>
                {task.status}
              </span>
            </div>
            <div className="gantt-list__cell">
              <div className="gantt-progress">
                <div className="gantt-progress__fill" style={{ width: `${task.progress}%` }} />
              </div>
              <span className="gantt-progress__label">%{task.progress}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
