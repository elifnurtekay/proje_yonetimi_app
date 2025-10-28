from rest_framework import serializers

from .models import Project
from .utils import project_progress_info

class ProjectSerializer(serializers.ModelSerializer):
    dynamic_progress = serializers.SerializerMethodField(read_only=True)
    effective_progress = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['owner', "created_at"]  # Burası çok önemli!

    def validate_progress(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError("İlerleme 0-100 arasında olmalıdır.")
        return value

    def _progress_payload(self, obj):
        if not hasattr(obj, "_progress_payload"):
            obj._progress_payload = project_progress_info(obj)
        return obj._progress_payload

    def get_dynamic_progress(self, obj):
        payload = self._progress_payload(obj)
        return payload.dynamic

    def get_effective_progress(self, obj):
        payload = self._progress_payload(obj)
        return payload.effective