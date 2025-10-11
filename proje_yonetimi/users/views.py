from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer
from .models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from .permissions import CanUpdateUser


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