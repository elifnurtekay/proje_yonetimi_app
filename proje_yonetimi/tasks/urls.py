from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    TaskViewSet,
    GanttChartTasksView,
    CalendarTasksView,
    CompletedTasksView,
    ActiveTasksView,
    TasksByUserView,
    TasksByDateView,
    ReportsSummaryView,
)

router = DefaultRouter()
router.register(r'', TaskViewSet, basename='task')

urlpatterns = [
    path('gantt/', GanttChartTasksView.as_view(), name='gantt-tasks'),
    path('calendar/', CalendarTasksView.as_view(), name='calendar-tasks'),
    path('reports/completed/', CompletedTasksView.as_view(), name='completed-tasks'),
    path('reports/active/', ActiveTasksView.as_view(), name='active-tasks'),
    path('reports/by-user/<int:user_id>/', TasksByUserView.as_view(), name='tasks-by-user'),
    path('reports/by-date/', TasksByDateView.as_view(), name='tasks-by-date'),
    path("reports/summary/", ReportsSummaryView.as_view(), name="reports-summary"),
]

urlpatterns += router.urls
