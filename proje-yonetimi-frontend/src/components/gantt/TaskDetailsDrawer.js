import React from "react";

export default function TaskDetailsDrawer({ task, onClose, onView, onEdit }) {
  if (!task) return null;

  return (
    <div className="gantt-drawer">
      <div className="gantt-drawer__backdrop" onClick={onClose} />
      <div className="gantt-drawer__panel">
        <div className="gantt-drawer__header">
          <div>
            <h3>{task.title}</h3>
            <p>{task.processName}</p>
          </div>
          <button type="button" className="gantt-btn ghost" onClick={onClose}>
            Kapat
          </button>
        </div>
        <div className="gantt-drawer__body">
          <div className="gantt-drawer__row">
            <span>Atanan</span>
            <strong>{task.assignee || "-"}</strong>
          </div>
          <div className="gantt-drawer__row">
            <span>Durum</span>
            <strong>{task.status}</strong>
          </div>
          <div className="gantt-drawer__row">
            <span>Tarih</span>
            <strong>{task.dateLabel}</strong>
          </div>
          <div className="gantt-drawer__row">
            <span>İlerleme</span>
            <strong>%{task.progress}</strong>
          </div>
          {task.description ? (
            <div className="gantt-drawer__note">
              <span>Açıklama</span>
              <p>{task.description}</p>
            </div>
          ) : null}
        </div>
        <div className="gantt-drawer__actions">
          <button type="button" className="gantt-btn" onClick={() => onView?.(task)}>
            Görüntüle
          </button>
          <button type="button" className="gantt-btn ghost" onClick={() => onEdit?.(task)}>
            Düzenle
          </button>
        </div>
      </div>
    </div>
  );
}
