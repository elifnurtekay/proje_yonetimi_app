# dashboard/views.py
from datetime import timedelta
from django.db.models import Q, Avg
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from tasks.models import Task
from users.models import User


# ---- SİSTEMİNDEKİ DURUM ADLARI ----
ACTIVE_STATUSES = ["Devam Ediyor", "Beklemede"]
DONE_STATUSES   = ["Tamamlandı"]
CANCELLED       = []  # istersen "İptal" vb. ekleyebilirsin


def has_field(model, name: str) -> bool:
    return any(getattr(f, "name", None) == name for f in model._meta.get_fields())


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user

        # --- Kullanıcının içinde olduğu projeler (owner / created_by / members)
        proj_q = Q()
        if has_field(Project, "owner"):
            proj_q |= Q(owner=u)
        if has_field(Project, "created_by"):
            proj_q |= Q(created_by=u)
        if has_field(Project, "members"):          # ManyToMany ise
            proj_q |= Q(members=u)

        if proj_q:
            user_projects = Project.objects.filter(proj_q).distinct()
        else:
            # Proje şeması çok yalınsa, kullanıcının görevlerinden projeyi türet
            if has_field(Task, "assignee") and has_field(Task, "project"):
                proj_ids = Task.objects.filter(assignee=u).values_list("project_id", flat=True)
                user_projects = Project.objects.filter(id__in=proj_ids).distinct()
            else:
                user_projects = Project.objects.none()

        total_projects = user_projects.count()

        # --- Kullanıcıyla ilişkili görevler (proje ilişkili + atanan + oluşturan)
        task_q = Q(project__in=user_projects)
        if has_field(Task, "assignee"):
            task_q |= Q(assignee=u)
        if has_field(Task, "created_by"):
            task_q |= Q(created_by=u)

        user_tasks = Task.objects.filter(task_q).distinct()

        # --- Aktif / tamamlanan sayıları (status alanı varsa Türkçe değerlerle)
        if has_field(Task, "status"):
            active_tasks = user_tasks.exclude(status__in=DONE_STATUSES + CANCELLED).count()
            completed    = user_tasks.filter(status__in=DONE_STATUSES).count()
        else:
            # status yoksa kaba bir ayrım (date_completed varsa)
            if has_field(Task, "date_completed"):
                active_tasks = user_tasks.filter(date_completed__isnull=True).count()
                completed    = user_tasks.filter(date_completed__isnull=False).count()
            else:
                active_tasks = user_tasks.count()
                completed    = 0

        # --- Üye sayısı (members varsa ordan; yoksa owner sayısı)
        if has_field(Project, "members"):
            members = User.objects.filter(projects__in=user_projects).distinct().count()
        elif has_field(Project, "owner"):
            members = user_projects.values("owner").distinct().count()
        else:
            members = 1  # en azından kendin varsın

        # --- Son projeler (5 adet) + etkin ilerleme
        order_proj = (
            "created_at" if has_field(Project, "created_at")
            else "created" if has_field(Project, "created")
            else "id"
        )
        recent_qs = user_projects.order_by(f"-{order_proj}")[:5]

        recent_projects = []
        for p in recent_qs:
            # Projede progress alanı varsa onu, yoksa görev ortalamasını kullan
            if has_field(Project, "progress") and getattr(p, "progress", None) is not None:
                eff = round(p.progress or 0)
            else:
                agg = Task.objects.filter(project=p).aggregate(avg=Avg("progress"))
                eff = round(agg["avg"] or 0)

            recent_projects.append({
                "id": p.id,
                "name": getattr(p, "name", str(p)),
                "description": getattr(p, "description", "") or "",
                "status": getattr(p, "status", "") or "",
                "effective_progress": eff,
                # istersen frontend için 'progress' adıyla da gönderelim:
                "progress": eff,
            })

        # --- Yaklaşan görevler (14 gün) + alanlara güvenli erişim
        today = now().date()
        if has_field(Task, "due_date"):
            upcoming_qs = user_tasks.filter(
                due_date__gte=today,
                due_date__lte=today + timedelta(days=14),
            )
            if has_field(Task, "status"):
                upcoming_qs = upcoming_qs.exclude(status__in=DONE_STATUSES + CANCELLED)

            # hız için ilişkileri getir
            sel = []
            if has_field(Task, "project"):  sel.append("project")
            if has_field(Task, "assignee"): sel.append("assignee")
            if sel:
                upcoming_qs = upcoming_qs.select_related(*sel)

            upcoming_qs = upcoming_qs.order_by("due_date")[:10]
        else:
            upcoming_qs = Task.objects.none()

        upcoming_tasks = []
        for t in upcoming_qs:
            project_name = None
            if has_field(Task, "project") and getattr(t, "project", None):
                project_name = getattr(t.project, "name", str(t.project))

            assignee_name = None
            if has_field(Task, "assignee") and getattr(t, "assignee", None):
                fn = getattr(t.assignee, "first_name", "") or ""
                ln = getattr(t.assignee, "last_name", "") or ""
                full = (fn + " " + ln).strip()
                assignee_name = full or getattr(t.assignee, "email", None)

            upcoming_tasks.append({
                "id": t.id,
                "title": getattr(t, "title", str(t)),
                "status": getattr(t, "status", ""),
                "progress": getattr(t, "progress", 0) or 0,
                "start_date": getattr(t, "start_date", None),
                "end_date": getattr(t, "end_date", None),
                "due_date": getattr(t, "due_date", None),
                "project_name": project_name,
                "assignee_name": assignee_name,
            })

        return Response({
            "total_projects":  total_projects,
            "active_tasks":    active_tasks,
            "completed":       completed,
            "members":         members,
            "recent_projects": recent_projects,
            "upcoming_tasks":  upcoming_tasks,
        })
