from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_project_created_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="geofence_radius",
            field=models.PositiveIntegerField(blank=True, help_text="Metre cinsinden yarıçap", null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="latitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="location_name",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="project",
            name="longitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
    ]
