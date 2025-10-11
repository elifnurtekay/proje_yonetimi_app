from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 'role')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'üye')
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Projende hangi alanlar varsa ona göre düzenle
        # (ör: role varsa ekle; yoksa sadece is_staff gösterme)
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'is_staff']
        read_only_fields = ['is_staff']  # is_staff dışarıdan değişmesin

    def update(self, instance, validated_data):
        request = self.context.get('request')

        # Sadece admin 'role' alanını değiştirebilir
        if 'role' in validated_data and not (request and request.user and request.user.is_staff):
            validated_data.pop('role', None)

        # Güvenlik: bu alanlar hiçbir şekilde güncellenmesin
        for locked in ('is_staff', 'is_superuser', 'last_login', 'date_joined'):
            validated_data.pop(locked, None)

        return super().update(instance, validated_data)