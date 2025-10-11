from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable, Optional

from django.utils import timezone


@dataclass(frozen=True)
class ProgressInfo:
    manual: int
    dynamic: Optional[int]
    effective: int


def _normalize_progress_value(value: Optional[int]) -> int:
    try:
        ivalue = int(value or 0)
    except (TypeError, ValueError):  # pragma: no cover - savunma
        ivalue = 0
    return max(0, min(100, ivalue))


def calculate_time_progress(start: Optional[date], end: Optional[date], *, today: Optional[date] = None) -> Optional[int]:
    """Hedef tarihe göre otomatik ilerleme yüzdesini hesapla."""
    if not start or not end:
        return None

    if today is None:
        today = timezone.now().date()

    total_days = (end - start).days
    if total_days <= 0:
        return 100 if today >= end else 0

    elapsed = (today - start).days
    if elapsed <= 0:
        return 0

    if today >= end:
        return 100

    ratio = elapsed / total_days
    return max(0, min(100, round(ratio * 100)))


def task_progress_info(task, *, today: Optional[date] = None) -> ProgressInfo:
    manual = _normalize_progress_value(getattr(task, "progress", 0))
    due_date = getattr(task, "due_date", None) or getattr(task, "end_date", None)
    start_date = getattr(task, "start_date", None)
    dynamic = calculate_time_progress(start_date, due_date, today=today)
    effective = max(manual, dynamic if dynamic is not None else 0)
    return ProgressInfo(manual=manual, dynamic=dynamic, effective=effective)


def aggregate_task_progress(tasks: Iterable, *, today: Optional[date] = None) -> Optional[int]:
    """Görevlerin ortalama etkin ilerleme yüzdesi."""
    values = [task_progress_info(task, today=today).effective for task in tasks]
    if not values:
        return None
    return max(0, min(100, round(sum(values) / len(values))))
