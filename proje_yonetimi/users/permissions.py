# users/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

class CanUpdateUser(BasePermission):
    """
    GET: herkese (auth) izin
    PUT/PATCH: sadece admin veya kendi hesabı
    DELETE: asla
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.method in ('PUT', 'PATCH'):
            return request.user.is_staff or obj == request.user
        return False
