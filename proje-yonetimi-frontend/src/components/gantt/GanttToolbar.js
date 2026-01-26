import React from "react";

const VIEW_OPTIONS = [
  { key: "day", label: "Gün" },
  { key: "week", label: "Hafta" },
  { key: "month", label: "Ay" },
];

export default function GanttToolbar({
  projects,
  selectedProjectId,
  onProjectChange,
  view,
  onViewChange,
  statusFilter,
  onStatusFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  processFilter,
  onProcessFilterChange,
  assigneeOptions,
  processOptions,
  search,
  onSearchChange,
  onTodayClick,
  onToggleList,
  isListVisible,
}) {
  return (
    <div className="gantt-toolbar gantt-theme__card">
      <div className="gantt-toolbar__left">
        <div className="gantt-toolbar__title">
          <h2>Gantt Planı</h2>
          <p className="gantt-theme__muted">Süreçlerinizi modern bir zaman çizelgesinde takip edin.</p>
        </div>
        <div className="gantt-toolbar__view">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`gantt-segment ${view === opt.key ? "is-active" : ""}`}
              onClick={() => onViewChange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gantt-toolbar__filters">
        <label className="gantt-field">
          <span>Süreç</span>
          <select value={selectedProjectId} onChange={(e) => onProjectChange(e.target.value)}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="gantt-field">
          <span>Durum</span>
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
            <option value="Tümü">Tümü</option>
            <option value="Bekliyor">Bekliyor</option>
            <option value="Devam Ediyor">Devam Ediyor</option>
            <option value="Tamamlandı">Tamamlandı</option>
            <option value="Gecikmiş">Gecikmiş</option>
          </select>
        </label>

        <label className="gantt-field">
          <span>Atanan</span>
          <select value={assigneeFilter} onChange={(e) => onAssigneeFilterChange(e.target.value)}>
            <option value="Tümü">Tümü</option>
            {assigneeOptions.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </label>

        <label className="gantt-field">
          <span>Görev Ara</span>
          <div className="gantt-search">
            <input
              type="search"
              placeholder="Task adına göre ara"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </label>

        <label className="gantt-field">
          <span>Süreç Filtresi</span>
          <select value={processFilter} onChange={(e) => onProcessFilterChange(e.target.value)}>
            <option value="Tümü">Tümü</option>
            {processOptions.map((process) => (
              <option key={process} value={process}>
                {process}
              </option>
            ))}
          </select>
        </label>

        <div className="gantt-toolbar__actions">
          <button type="button" className="gantt-btn" onClick={onTodayClick}>
            Bugüne Git
          </button>
          <button type="button" className="gantt-btn ghost" onClick={onToggleList}>
            {isListVisible ? "Listeyi Gizle" : "Listeyi Göster"}
          </button>
        </div>
      </div>
    </div>
  );
}
