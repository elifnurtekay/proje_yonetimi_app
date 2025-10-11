# dashboard/views.py
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from projects.models import Project
from tasks.models import Task
from users.models import User

"""def visible_project_ids_for(user):
    
    Kullanıcının görebileceği projeler:
      - Projeyi o kişi oluşturmuş (owner=user)
      - VEYA projedeki görevlerden herhangi biri ona atanmış (Task.assignee=user)
    Not: Ters ilişki adına güvenmek yerine iki ayrı sorgunun set birleşimini alıyoruz.
    
    owner_ids = Project.objects.filter(owner=user).values_list("id", flat=True)
    assignee_project_ids = Task.objects.filter(assignee=user).values_list("project_id", flat=True)
    return set(owner_ids) | set(assignee_project_ids)
"""

def visible_project_ids_for(user):
    # Süperuser veya staff ise tüm projeleri görsün
    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return set(Project.objects.values_list("id", flat=True))

    owner_ids = Project.objects.filter(owner=user).values_list("id", flat=True)
    assignee_project_ids = Task.objects.filter(assignee=user).values_list("project_id", flat=True)

    # (Varsa) üyelik tablosunu da kat
    try:
        from projects.models import ProjectMember  # örnek isim
        member_project_ids = ProjectMember.objects.filter(user=user)\
                               .values_list("project_id", flat=True)
    except Exception:
        member_project_ids = []

    return set(owner_ids) | set(assignee_project_ids) | set(member_project_ids)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        visible_ids = list(visible_project_ids_for(user))

        # Superuser/admin her şeyi görebilsin istiyorsanız şu satırın yorumunu kaldırın:
        # if user.is_superuser:
        #     visible_ids = list(Project.objects.all().values_list("id", flat=True))

        projects_qs = Project.objects.filter(id__in=visible_ids)
        tasks_qs = Task.objects.filter(project_id__in=visible_ids)

        toplam_proje = projects_qs.count()
        aktif_gorev = tasks_qs.filter(status__in=["Aktif", "Devam Ediyor"]).count()
        tamamlanan = tasks_qs.filter(status="Tamamlandı").count()

        # Ekip üyesi (owner + görevlere atanmış kullanıcılar, tekil)
        owner_ids = projects_qs.values_list("owner_id", flat=True)
        assignee_ids = tasks_qs.exclude(assignee__isnull=True).values_list("assignee_id", flat=True)
        ekip_uyesi = User.objects.filter(id__in=set(owner_ids) | set(assignee_ids)).distinct().count()

        # Son projeler
        son_projeler = list(
            projects_qs.order_by("-start_date", "-id")[:3]
            .values("id", "name", "description", "status", "progress")
        )

        # Yaklaşan görevler (14 gün)
        today = timezone.now().date()
        soon = today + timedelta(days=14)
        yaklasan_gorevler = list(
            tasks_qs.filter(due_date__isnull=False, due_date__gte=today, due_date__lte=soon)
                    .order_by("due_date")[:3]
                    .values(
                        "id", "title", "status", "progress", "due_date",
                        "project__name", "assignee__first_name", "assignee__last_name"
                    )
        )

        return Response({
            "toplam_proje": toplam_proje,
            "aktif_gorev": aktif_gorev,
            "ekip_uyesi": ekip_uyesi,
            "tamamlanan": tamamlanan,
            "son_projeler": son_projeler,
            "yaklasan_gorevler": yaklasan_gorevler,
        })


"""@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    today = date.today()
    upcoming_limit = today + timedelta(days=14)  # yaklaşan görev penceresi

    total_projects = Project.objects.count()
    total_users = User.objects.count()

    completed_count = Task.objects.filter(status__iexact="Tamamlandı").count()
    active_count = Task.objects.exclude(status__iexact="Tamamlandı").count()

    # Yaklaşan görevler: due_date bugün..14 gün arası ve tamamlanmamış
    upcoming_tasks_qs = (
        Task.objects
        .filter(
            due_date__gte=today,
            due_date__lte=upcoming_limit
        )
        .exclude(status__iexact="Tamamlandı")
        .select_related("project", "assignee")
        .order_by("due_date")[:8]
    )
    upcoming_tasks = [{
        "id": t.id,
        "title": t.title,
        "project_name": getattr(t.project, "name", "-"),
        "assignee_name": f"{getattr(t.assignee, 'first_name', '')} {getattr(t.assignee, 'last_name', '')}".strip() or "-",
        "due_date": t.due_date,
        "status": t.status,
        "progress": t.progress,
    } for t in upcoming_tasks_qs]

    # Son projeler – created_at varsa onu kullan; yoksa id'ye göre
    try:
        recent_projects_qs = Project.objects.all().order_by("-created_at")[:6]
    except Exception:
        recent_projects_qs = Project.objects.all().order_by("-id")[:6]

    recent_projects = [{
        "id": p.id,
        "name": p.name,
        "description": getattr(p, "description", ""),
    } for p in recent_projects_qs]

    return Response({
        "cards": {
            "total_projects": total_projects,
            "active_tasks": active_count,
            "team_members": total_users,
            "completed_tasks": completed_count,
        },
        "recent_projects": recent_projects,
        "upcoming_tasks": upcoming_tasks,
    }) """
