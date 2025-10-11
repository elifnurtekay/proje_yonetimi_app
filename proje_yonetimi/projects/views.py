from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models.functions import Coalesce
from django.db.models import Value
from datetime import date
from django.db.models import Q
from .models import Project
from .serializers import ProjectSerializer
from .permissions import IsOwnerOrReadOnly
from tasks.models import Task
from users.models import User

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        base = Project.objects.select_related('owner')

        # Admin ise hepsini görebilsin
        if user.is_staff:
            return base.distinct()

        # Proje sahibi veya projedeki herhangi bir göreve atanmış kullanıcı
        return (
            base.filter(
                Q(owner=user) |
                Q(tasks__assignee=user)     # Project -> Task (related_name='tasks')
            )
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Kullanıcıya özel özet istersen bunları da owner filtresi ile kısıtlanabilir (diğer eksikleri tamamlayınca denenebilir).
        toplam_proje = Project.objects.filter(owner=request.user).count()
        aktif_gorev = Task.objects.filter(
            status__in=["Aktif", "Devam Ediyor"], project__owner=request.user
        ).count()
        ekip_uyesi = User.objects.count()  # tüm kullanıcı sayısı
        tamamlanan = Task.objects.filter(
            status="Tamamlandı", project__owner=request.user
        ).count()

        # Son projeler: start_date boşsa created_at'e fallback, sonra en yeni 3
        son_projeler = list(
            Project.objects
            .filter(owner=request.user)
            .annotate(_order=Coalesce("start_date", "created_at"))
            .order_by("-_order")[:3]
            .values("id", "name", "description", "status", "progress")
        )

        # Yaklaşan görevler: due_date dolu ve bugünden büyük/bugün
        today = date.today()
        yaklasan_gorevler = list(
            Task.objects
            .filter(project__owner=request.user, due_date__isnull=False, due_date__gte=today)
            .order_by("due_date")[:3]
            .values("id", "title", "assignee__first_name", "assignee__last_name", "due_date", "status")
        )

        return Response({
            "toplam_proje": toplam_proje,
            "aktif_gorev": aktif_gorev,
            "ekip_uyesi": ekip_uyesi,
            "tamamlanan": tamamlanan,
            "son_projeler": son_projeler,
            "yaklasan_gorevler": yaklasan_gorevler,
        })
