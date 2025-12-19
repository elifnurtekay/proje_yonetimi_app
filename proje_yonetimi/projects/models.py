from django.db import models
from users.models import User

class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default='Aktif')
    progress = models.IntegerField(default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    location_name = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=80, blank=True)
    district = models.CharField(max_length=80, blank=True)
    neighborhood = models.CharField(max_length=120, blank=True)
    street = models.CharField(max_length=120, blank=True)
    avenue = models.CharField(max_length=120, blank=True)
    building_no = models.CharField(max_length=30, blank=True)
    postal_code = models.CharField(max_length=12, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geofence_radius = models.PositiveIntegerField(null=True, blank=True, help_text="Metre cinsinden yarıçap")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name