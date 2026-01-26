import React from "react";
import TaskTooltip from "./TaskTooltip";

const STATUS_CLASS = {
  Bekliyor: "muted",
  "Devam Ediyor": "info",
  Tamamlandı: "success",
  Gecikmiş: "danger",
};

function buildMonthLabels(rangeStart, totalDays) {
  const labels = [];
  let current = rangeStart.startOf("month");
  while (current.isBefore(rangeStart.add(totalDays, "day"))) {
    const start = current;
    const end = current.endOf("month");
    labels.push({
      label: current.format("MMMM YYYY"),
      start,
      end,
    });
    current = current.add(1, "month");
  }
  return labels;
}

export default function GanttTimeline({
  tasks,
  rangeStart,
  rangeEnd,
  dayWidth,
  view,
  today,
  onTaskClick,
  timelineRef,
}) {
  const totalDays = rangeEnd.diff(rangeStart, "day") + 1;
  const todayIndex = today.diff(rangeStart, "day");
  const months = buildMonthLabels(rangeStart, totalDays);

  return (
    <div className="gantt-timeline" ref={timelineRef}>
      <div className="gantt-timeline__header">
        <div className="gantt-timeline__months" style={{ width: totalDays * dayWidth }}>
          {months.map((month) => {
            const monthStart = month.start.isBefore(rangeStart) ? rangeStart : month.start;
            const monthEnd = month.end.isAfter(rangeEnd) ? rangeEnd : month.end;
            const offset = monthStart.diff(rangeStart, "day");
            const span = monthEnd.diff(monthStart, "day") + 1;
            return (
              <div
                key={month.label}
                className="gantt-timeline__month"
                style={{ left: offset * dayWidth, width: span * dayWidth }}
              >
                {month.label}
              </div>
            );
          })}
        </div>
        <div className="gantt-timeline__days" style={{ width: totalDays * dayWidth }}>
          {Array.from({ length: totalDays }).map((_, index) => {
            const date = rangeStart.add(index, "day");
            const isWeekStart = date.day() === 1;
            const showLabel = view === "day" || (view === "week" && isWeekStart) || view === "month";
            const label = view === "month"
              ? date.format("D")
              : view === "week" && isWeekStart
                ? date.format("DD MMM")
                : date.format("DD");
            return (
              <div
                key={date.format("YYYY-MM-DD")}
                className={`gantt-timeline__day ${showLabel ? "is-visible" : ""}`}
                style={{ width: dayWidth }}
              >
                {showLabel ? label : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div className="gantt-timeline__grid" style={{ width: totalDays * dayWidth }}>
        {Array.from({ length: totalDays }).map((_, index) => (
          <div
            key={`grid-${index}`}
            className={`gantt-timeline__grid-cell ${index % 2 === 0 ? "even" : ""}`}
            style={{ width: dayWidth }}
          />
        ))}
      </div>

      {todayIndex >= 0 && todayIndex < totalDays ? (
        <div
          className="gantt-timeline__today"
          style={{ left: todayIndex * dayWidth }}
        >
          <span>Bugün</span>
        </div>
      ) : null}

      <div className="gantt-timeline__rows">
        {tasks.map((task) => {
          if (task.isInvalid) {
            return (
              <div key={task.uid} className="gantt-timeline__row is-invalid" />
            );
          }

          const offset = task.start.diff(rangeStart, "day");
          const span = task.end.diff(task.start, "day") + 1;
          const left = offset * dayWidth;
          const width = span * dayWidth;

          return (
            <div key={task.uid} className="gantt-timeline__row">
              <button
                type="button"
                className={`gantt-bar ${STATUS_CLASS[task.status] || "muted"}`}
                style={{ left, width }}
                onClick={() => onTaskClick(task)}
              >
                <span className="gantt-bar__progress" style={{ width: `${task.progress}%` }} />
                <span className="gantt-bar__label">{task.title}</span>
                <TaskTooltip task={task} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
