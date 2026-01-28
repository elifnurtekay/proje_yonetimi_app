import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchGanttTasks, fetchProjects } from "../api";
import GanttToolbar from "../components/gantt/GanttToolbar";
import TaskDetailsDrawer from "../components/gantt/TaskDetailsDrawer";
import TaskListPanel from "../components/gantt/TaskListPanel";
import GanttTimeline from "../components/gantt/GanttTimeline";
import "./GanttChart.css";
import "../styles/gantt.theme.css";

const VIEW_CONFIG = {
  day: { dayWidth: 40 },
  week: { dayWidth: 22 },
  month: { dayWidth: 12 },
};

const STATUS_ALIASES = {
  Beklemede: "Bekliyor",
  "In Progress": "Devam Ediyor",
};

function calculateAutoProgress(task) {
  if (!task.start || !task.end) return 0;
  const start = task.start;
  const end = task.end;
  const today = dayjs().startOf("day");
  if (!start.isValid() || !end.isValid()) return 0;
  if (today.isBefore(start)) return 0;
  if (today.isAfter(end)) return 100;
  const total = end.diff(start, "day") + 1;
  const passed = today.diff(start, "day") + 1;
  return Math.round((passed / total) * 100);
}

function normalizeStatus(rawStatus, isLate) {
  const normalized = STATUS_ALIASES[rawStatus] || rawStatus || "Bekliyor";
  if (isLate && normalized !== "Tamamlandı") return "Gecikmiş";
  return normalized;
}

export default function GanttChart() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [ganttData, setGanttData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [assigneeFilter, setAssigneeFilter] = useState("Tümü");
  const [processFilter, setProcessFilter] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isListVisible, setIsListVisible] = useState(true);

  const timelineRef = useRef(null);

  const token = localStorage.getItem("access");

  useEffect(() => {
    fetchProjects(token)
      .then((data) => {
        setProjects(data);
        if (data.length) setSelectedProjectId(data[0].id);
      })
      .catch(() => setProjects([]));
  }, [token]);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetchGanttTasks(selectedProjectId, token)
      .then((data) => setGanttData(data))
      .finally(() => setLoading(false));
  }, [selectedProjectId, token]);

  const normalizedTasks = useMemo(() => {
    const today = dayjs().startOf("day");
    return ganttData.map((task, index) => {
      const startRaw = task.start || task.start_date;
      const endRaw = task.end || task.end_date;
      const start = startRaw ? dayjs(startRaw).startOf("day") : null;
      const end = endRaw ? dayjs(endRaw).startOf("day") : null;
      const isInvalid = !start || !end || !start.isValid() || !end.isValid() || end.isBefore(start, "day");
      const isLate = !isInvalid && end.isBefore(today, "day") && task.status !== "Tamamlandı";
      const manualProgress = Number.isFinite(task.effective_progress)
        ? task.effective_progress
        : Number.isFinite(task.progress)
          ? task.progress
          : null;
      const progress = Math.min(100, Math.max(0, manualProgress ?? calculateAutoProgress({ start, end })));
      const status = normalizeStatus(task.status, isLate);
      const dateLabel = !isInvalid
        ? `${start.format("DD MMM YYYY")} → ${end.format("DD MMM YYYY")}`
        : "Geçersiz tarih";

      return {
        uid: task.id ?? `${task.title}-${index}`,
        id: task.id,
        title: task.title || "Başlıksız görev",
        processName: task.project_name || task.process_name || task.project__name || "-",
        assignee: task.assignee_name || task.assignee || task.assignee_email || "-",
        description: task.description || "",
        start,
        end,
        isInvalid,
        isLate,
        daysLate: isLate ? today.diff(end, "day") : 0,
        progress,
        status,
        dateLabel,
      };
    });
  }, [ganttData]);

  const assigneeOptions = useMemo(() => {
    const set = new Set();
    normalizedTasks.forEach((task) => {
      if (task.assignee && task.assignee !== "-") set.add(task.assignee);
    });
    return Array.from(set);
  }, [normalizedTasks]);

  const processOptions = useMemo(() => {
    const set = new Set();
    normalizedTasks.forEach((task) => {
      if (task.processName && task.processName !== "-") set.add(task.processName);
    });
    return Array.from(set);
  }, [normalizedTasks]);

  const filteredTasks = useMemo(() => {
    return normalizedTasks.filter((task) => {
      const matchesStatus = statusFilter === "Tümü" || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === "Tümü" || task.assignee === assigneeFilter;
      const matchesProcess = processFilter === "Tümü" || task.processName === processFilter;
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesAssignee && matchesProcess && matchesSearch;
    });
  }, [normalizedTasks, statusFilter, assigneeFilter, processFilter, search]);

  const validTasks = filteredTasks.filter((task) => !task.isInvalid);
  const invalidCount = filteredTasks.length - validTasks.length;

  const { rangeStart, rangeEnd } = useMemo(() => {
    const today = dayjs().startOf("day");
    if (validTasks.length === 0) {
      return { rangeStart: today.subtract(3, "day"), rangeEnd: today.add(14, "day") };
    }
    let min = validTasks[0].start;
    let max = validTasks[0].end;
    validTasks.forEach((task) => {
      if (task.start.isBefore(min)) min = task.start;
      if (task.end.isAfter(max)) max = task.end;
    });
    const padding = view === "month" ? 14 : view === "week" ? 7 : 3;
    return {
      rangeStart: min.subtract(padding, "day"),
      rangeEnd: max.add(padding, "day"),
    };
  }, [validTasks, view]);

  const handleTodayClick = () => {
    if (!timelineRef.current) return;
    const dayWidth = VIEW_CONFIG[view].dayWidth;
    const todayIndex = dayjs().startOf("day").diff(rangeStart, "day");
    const target = Math.max(0, todayIndex * dayWidth - timelineRef.current.clientWidth / 2);
    timelineRef.current.scrollTo({ left: target, behavior: "smooth" });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  return (
    <div className="gantt-page gantt-theme">
      <GanttToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        view={view}
        onViewChange={setView}
        currentYear={rangeStart.format("YYYY")}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        processFilter={processFilter}
        onProcessFilterChange={setProcessFilter}
        assigneeOptions={assigneeOptions}
        processOptions={processOptions}
        search={search}
        onSearchChange={setSearch}
        onTodayClick={handleTodayClick}
        onToggleList={() => setIsListVisible((prev) => !prev)}
        isListVisible={isListVisible}
      />

      <div className="gantt-board">
        {loading ? (
          <div className="gantt-theme__card" style={{ padding: 20 }}>Yükleniyor...</div>
        ) : (
          <>
            {invalidCount > 0 ? (
              <div className="gantt-alert">
                {invalidCount} görevde tarih bilgisi eksik veya hatalı. Lütfen kontrol edin.
              </div>
            ) : null}
            <div className={`gantt-board__body ${!isListVisible ? "is-collapsed" : ""}`}>
              {isListVisible ? (
                <TaskListPanel tasks={filteredTasks} onTaskClick={handleTaskClick} />
              ) : null}
              <div className="gantt-timeline-wrapper">
                <GanttTimeline
                  tasks={filteredTasks}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  dayWidth={VIEW_CONFIG[view].dayWidth}
                  view={view}
                  today={dayjs().startOf("day")}
                  onTaskClick={handleTaskClick}
                  timelineRef={timelineRef}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <TaskDetailsDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
