from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    """
    GET/LIST herkes (auth) görebilir ama sadece sahibi PATCH/DELETE yapabilir.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.owner == request.user or True
        return obj.owner == request.user
