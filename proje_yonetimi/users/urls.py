from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    UserDetailView,
    FindUserByEmailView,
    GoogleLoginView,
    UserViewSet,
)
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='me'),
    path('find-by-email/', FindUserByEmailView.as_view(), name='find-by-email'),
] + router.urls
