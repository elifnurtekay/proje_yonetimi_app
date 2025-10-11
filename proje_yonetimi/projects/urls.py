from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, DashboardSummaryView
from django.urls import path

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')
urlpatterns = router.urls

urlpatterns = router.urls + [
    path('dashboard-summary/', DashboardSummaryView.as_view()),
]