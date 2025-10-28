from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "status", "progress", "start_date", "end_date")
    list_filter = ("status", "owner", "start_date", "end_date")
    search_fields = ("name", "description", "owner__first_name", "owner__last_name")
    date_hierarchy = "start_date"
