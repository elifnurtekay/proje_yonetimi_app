from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .serializers import RegisterSerializer, UserSerializer
from .models import User
from .permissions import CanUpdateUser
from allauth.socialaccount.models import SocialApp

UserModel = get_user_model()


"""class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]"""

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanUpdateUser]
    http_method_names = ['get', 'put', 'patch', 'head', 'options']  # DELETE yok, POST yok (kayıt ayrı endpoint)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def destroy(self, request, *args, **kwargs):
        return Response({'detail': 'Kullanıcı silme devre dışı.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
class FindUserByEmailView(APIView):
    def get(self, request):
        email = request.query_params.get("email")
        try:
            user = User.objects.get(email=email)
            return Response({"id": user.id, "email": user.email, "first_name": user.first_name, "last_name": user.last_name})
        except User.DoesNotExist:
            return Response({"error": "Kullanıcı bulunamadı."}, status=404)

def _google_client_id():
    # Önce SocialApp (Site ile ilişkilendirilmiş) → yoksa settings
    try:
        app = SocialApp.objects.get(provider="google", sites__id=settings.SITE_ID)
        if app.client_id:
            return app.client_id
    except SocialApp.DoesNotExist:
        pass
    return settings.GOOGLE_CLIENT_ID or ""

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        credential = request.data.get("credential") or request.data.get("id_token")
        if not credential:
            return Response({"detail": "Google kimlik belirteci bulunamadı."},
                            status=status.HTTP_400_BAD_REQUEST)

        client_id = _google_client_id()
        if not client_id:
            return Response({"detail": "Google sağlayıcısı yapılandırılmadı."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            id_info = id_token.verify_oauth2_token(
                credential, google_requests.Request(), audience=client_id
            )
        except Exception as exc:
            return Response({"detail": "Google token doğrulanamadı.", "error": str(exc)},
                            status=status.HTTP_400_BAD_REQUEST)

        email = id_info.get("email")
        if not email:
            return Response({"detail": "Google hesabı e-posta bilgisi içermiyor."}, status=status.HTTP_400_BAD_REQUEST)

        first_name = id_info.get("given_name", "")
        last_name = id_info.get("family_name", "")

        user, created = UserModel.objects.get_or_create(
            email=email,
            defaults={"first_name": first_name, "last_name": last_name},
        )

        updated_fields = []
        if created:
            user.set_unusable_password()
            updated_fields.extend(["password"])

        if first_name and user.first_name != first_name:
            user.first_name = first_name
            updated_fields.append("first_name")

        if last_name and user.last_name != last_name:
            user.last_name = last_name
            updated_fields.append("last_name")

        if updated_fields:
            user.save(update_fields=updated_fields)

        refresh = RefreshToken.for_user(user)
        serializer = UserSerializer(user, context={"request": request})

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": serializer.data,
            "created": created,
        })


class GoogleConfigView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        client_id = _google_client_id()
        return Response({"client_id": client_id, "enabled": bool(client_id)})