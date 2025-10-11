from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "project", "assignee", "status", "due_date")
    list_filter = ("status", "project", "assignee")
    search_fields = ("title", "description", "project__name", "assignee__first_name", "assignee__last_name")
    date_hierarchy = "due_date"
    ordering = ("-due_date",)
    