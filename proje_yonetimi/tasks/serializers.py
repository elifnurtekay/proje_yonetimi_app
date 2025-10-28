from rest_framework import serializers

from .models import Task
from .utils import task_progress_info

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField(read_only=True)
    assignee_name = serializers.SerializerMethodField(read_only=True)
    dynamic_progress = serializers.SerializerMethodField(read_only=True)
    effective_progress = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'assignee',
            'start_date', 'end_date', 'due_date',
            'status', 'progress', 'dependencies',
            'project_name', 'assignee_name',
            'dynamic_progress', 'effective_progress',
        ]
        extra_kwargs = {
            'dependencies': {'required': False},
            'description': {'required': False, 'allow_blank': True},
            'start_date': {'required': False, 'allow_null': True},
            'end_date': {'required': False, 'allow_null': True},
            'due_date': {'required': False, 'allow_null': True},
        }

    def get_project_name(self, obj):
        return getattr(obj.project, "name", None)

    def get_assignee_name(self, obj):
        if obj.assignee:
            # İsim soyisim varsa onları birleştir; yoksa email
            full = f"{obj.assignee.first_name} {obj.assignee.last_name}".strip()
            return full if full else obj.assignee.email
        return None

    def _progress_payload(self, obj):
        if not hasattr(obj, "_progress_payload"):
            obj._progress_payload = task_progress_info(obj)
        return obj._progress_payload

    def get_dynamic_progress(self, obj):
        payload = self._progress_payload(obj)
        return payload.dynamic

    def get_effective_progress(self, obj):
        payload = self._progress_payload(obj)
        return payload.effective

    def validate(self, attrs):
        # start <= end kontrolü
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and start > end:
            raise serializers.ValidationError("Başlangıç tarihi, bitiş tarihinden büyük olamaz.")
        return attrs