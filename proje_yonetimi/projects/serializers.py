from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['owner', "created_at"]  # Burası çok önemli!

    def validate_progress(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError("İlerleme 0-100 arasında olmalıdır.")
        return value