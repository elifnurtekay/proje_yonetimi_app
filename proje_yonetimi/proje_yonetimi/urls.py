"""
URL configuration for proje_yonetimi project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib import admin
from django.urls import path, include
from dashboard.views import DashboardSummaryView
from users.views import GoogleConfigView, GoogleLoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/tasks/', include('tasks.urls')),  
    path("api/dashboard/", include("dashboard.urls", namespace="dashboard")),  
    path("accounts/", include("allauth.urls")),          # allauth
    path("api/auth/", include("dj_rest_auth.urls")),     # opsiyonel: REST login
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),

    path("api/auth/google/config/", GoogleConfigView.as_view()),
    path("api/auth/google/onetap/", GoogleLoginView.as_view()),
]

