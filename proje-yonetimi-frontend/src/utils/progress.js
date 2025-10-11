import dayjs from "dayjs";

function computeTimeProgress(start, end) {
  if (!start || !end) return null;
  const startDate = dayjs(start);
  const endDate = dayjs(end);

  if (!startDate.isValid() || !endDate.isValid()) return null;
  if (!endDate.isAfter(startDate)) {
    return dayjs().isAfter(endDate) ? 100 : 0;
  }

  const today = dayjs();
  if (today.isSame(startDate) || today.isBefore(startDate)) return 0;
  if (today.isAfter(endDate)) return 100;

  const total = endDate.diff(startDate, "hour");
  const elapsed = today.diff(startDate, "hour");
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function ensureEffectiveProgress(item, { startKey = "start_date", endKey = "end_date", dueKey = "due_date" } = {}, forceRecompute = false) {
  if (!item) return item;

  const manual = Number(item.progress ?? item.manual_progress ?? 0) || 0;
  const hasExistingDynamic = typeof item.dynamic_progress === "number" && !forceRecompute;
  const dynamic = hasExistingDynamic
    ? item.dynamic_progress
    : computeTimeProgress(item[startKey], item[dueKey] ?? item[endKey]);

  const effective = typeof item.effective_progress === "number" && !forceRecompute
    ? item.effective_progress
    : Math.max(manual, dynamic ?? 0);

  return {
    ...item,
    manual_progress: manual,
    dynamic_progress: dynamic ?? null,
    effective_progress: effective,
  };
}

export function ensureListEffectiveProgress(list, options, forceRecompute = false) {
  if (!Array.isArray(list)) return list;
  return list.map((item) => ensureEffectiveProgress(item, options, forceRecompute));
}
