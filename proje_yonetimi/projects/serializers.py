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

    def validate_latitude(self, value):
        if value is None:
            return value
        if not -90 <= float(value) <= 90:
            raise serializers.ValidationError("Enlem -90 ile 90 arasında olmalıdır.")
        return value

    def validate_longitude(self, value):
        if value is None:
            return value
        if not -180 <= float(value) <= 180:
            raise serializers.ValidationError("Boylam -180 ile 180 arasında olmalıdır.")
        return value

    def validate_geofence_radius(self, value):
        if value is None:
            return value
        if value <= 0:
            raise serializers.ValidationError("Geofence yarıçapı pozitif olmalıdır.")
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