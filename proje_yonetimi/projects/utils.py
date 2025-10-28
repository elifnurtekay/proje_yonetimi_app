from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable, Optional

from django.utils import timezone

from tasks.utils import aggregate_task_progress, calculate_time_progress


@dataclass(frozen=True)
class ProjectProgress:
    manual: int
    dynamic: Optional[int]
    effective: int


def _normalize(value: Optional[int]) -> int:
    try:
        ivalue = int(value or 0)
    except (TypeError, ValueError):  # pragma: no cover
        ivalue = 0
    return max(0, min(100, ivalue))


def project_progress_info(project, *, today: Optional[date] = None, tasks: Optional[Iterable] = None) -> ProjectProgress:
    if today is None:
        today = timezone.now().date()

    manual = _normalize(getattr(project, "progress", 0))

    if tasks is None:
        tasks = getattr(project, "_prefetched_objects_cache", {}).get("tasks")
        if tasks is None:
            tasks = list(project.tasks.all())
    else:
        tasks = list(tasks)

    task_based = aggregate_task_progress(tasks, today=today) if tasks else None
    time_based = calculate_time_progress(getattr(project, "start_date", None), getattr(project, "end_date", None), today=today)

    candidates = [v for v in (task_based, time_based) if v is not None]
    dynamic = max(candidates) if candidates else None
    effective = max(manual, dynamic if dynamic is not None else 0)

    return ProjectProgress(manual=manual, dynamic=dynamic, effective=effective)