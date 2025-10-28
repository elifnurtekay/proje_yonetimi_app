from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Task
from users.models import User
from .serializers import TaskSerializer
from .utils import task_progress_info
from rest_framework.permissions import IsAuthenticated

"""class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]"""

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related('project', 'assignee').prefetch_related('dependencies')

        # Admin her şeyi görsün, aksi halde proje sahibi veya o projedeki herhangi bir göreve atanmış olanlar
        if not user.is_staff:
            qs = qs.filter(
                Q(project__owner=user) |
                Q(project__tasks__assignee=user)
            )

        # İsteğe bağlı ek filtreler (mevcut koddaki gibi)
        project_id = self.request.query_params.get('project')
        status_q = self.request.query_params.get('status')
        assignee_id = self.request.query_params.get('assignee')

        if project_id:
            qs = qs.filter(project_id=project_id)
        if status_q:
            qs = qs.filter(status=status_q)
        if assignee_id:
            qs = qs.filter(assignee_id=assignee_id)

        return qs.distinct()

    # silmeyi kapalı tut:
    # def destroy(self, request, *args, **kwargs):
    #     return Response({"detail": "Silme devre dışı."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    #PATCH/PUT yetkisi ver, DELETE'i kapat:
    #delete kapatma (açılabilir denemek için)
    def destroy(self, request, *args, **kwargs):
        return Response({"detail": "Silme devre dışı."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)



class GanttChartTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Task.objects.select_related('project','assignee').prefetch_related('dependencies')

        if not user.is_staff:
            qs = qs.filter(
                Q(project__owner=user) |
                Q(project__tasks__assignee=user)
            )

        project_id = request.query_params.get('project_id')
        if project_id:
            qs = qs.filter(project_id=project_id)

        qs = qs.distinct()

        data = []
        for t in qs:
            progress = task_progress_info(t)
            data.append({
                "id": t.id,
                "title": t.title,
                "start": t.start_date,
                "end": t.end_date,
                "progress": progress.effective,
                "manual_progress": progress.manual,
                "dynamic_progress": progress.dynamic,
                "status": t.status,
                "assignee": getattr(t.assignee, "email", None),
                "dependencies": list(t.dependencies.values_list("id", flat=True)),
                "project_name": getattr(t.project, "name", None),
                "assignee_name": (
                    (f"{t.assignee.first_name} {t.assignee.last_name}".strip() if t.assignee else None)
                    or (t.assignee.email if t.assignee else None)
                ),
            })
        return Response(data)


class CalendarTasksView(APIView):
    def get(self, request):
        tasks = Task.objects.all()
        data = [
            {
                "id": task.id,
                "title": task.title,
                "start": task.start_date,
                "end": task.end_date,
                "assignee": task.assignee.id if task.assignee else None,
                "project": task.project.id if task.project else None,
            }
            for task in tasks
        ]
        return Response(data)

#tamamlanan görevler 
class CompletedTasksView(APIView):
    def get(self, request):
        completed = Task.objects.filter(status="Tamamlandı")
        serializer = TaskSerializer(completed, many=True)
        return Response(serializer.data)

#aktif görevler
class ActiveTasksView(APIView):
    def get(self, request):
        active = Task.objects.exclude(status="Tamamlandı")
        serializer = TaskSerializer(active, many=True)
        return Response(serializer.data)

class TasksByUserView(APIView):
    def get(self, request, user_id):
        tasks = Task.objects.filter(assignee_id=user_id)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

class TasksByDateView(APIView):
    def get(self, request):
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        tasks = Task.objects.filter(start_date__gte=start, end_date__lte=end)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
#raporlar paneli için
class ReportsSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Task.objects.all()

        # Durum kırılımı
        raw = dict(
            qs.values_list('status').annotate(cnt=Count('id'))
        )
        # UI’da beklenen 3 ana durum (yoksa 0)
        status_counts = {
            "Tamamlandı": raw.get("Tamamlandı", 0),
            "Devam Ediyor": raw.get("Devam Ediyor", 0),
            "Beklemede": raw.get("Beklemede", 0),
        }

        # Kullanıcı performansı
        users_data = []
        # Sadece en az 1 görevi olan kullanıcıları göstermek istersen:
        # users = User.objects.filter(task__isnull=False).distinct()
        users = User.objects.all()
        for u in users:
            total = qs.filter(assignee=u).count()
            done = qs.filter(assignee=u, status="Tamamlandı").count()
            rate = round(100 * done / total) if total else 0
            users_data.append({
                "id": u.id,
                "name": (f"{u.first_name} {u.last_name}").strip() or u.email,
                "total": total,
                "done": done,
                "rate": rate,
            })

        # toplamı/azalan sıralı gösterelim
        users_data.sort(key=lambda x: (x["total"], x["rate"]), reverse=True)

        return Response({
            "status_counts": status_counts,
            "users": users_data,
        })