from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    ordering = ['id']
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('date_joined',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Kişisel Bilgiler', {'fields': ('first_name', 'last_name', 'role')}),
        ('Yetkiler', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Tarih', {'fields': ('date_joined',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser'),
        }),
    )

    # Kullanıcı adı olarak email kullanıldığı için aşağıdaki ayar önemli:
    def get_fieldsets(self, request, obj=None):
        if not obj:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

admin.site.register(User, UserAdmin)
