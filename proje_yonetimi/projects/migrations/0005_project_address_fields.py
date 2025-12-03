from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0004_project_geofence_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="avenue",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="project",
            name="building_no",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="project",
            name="city",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="project",
            name="district",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="project",
            name="neighborhood",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="project",
            name="postal_code",
            field=models.CharField(blank=True, max_length=12),
        ),
        migrations.AddField(
            model_name="project",
            name="street",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
