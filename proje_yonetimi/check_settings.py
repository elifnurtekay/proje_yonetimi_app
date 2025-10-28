# check_settings.py
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "proje_yonetimi.settings")
django.setup()

from django.conf import settings

print("TOKEN_MODEL =", getattr(settings, "TOKEN_MODEL", "YOK"))
print("DJ_REST_AUTH =", getattr(settings, "DJ_REST_AUTH", {}))
print("REST_AUTH_TOKEN_MODEL =", getattr(settings, "REST_AUTH_TOKEN_MODEL", "YOK"))
print("AUTHTOKEN in INSTALLED_APPS =", "rest_framework.authtoken" in settings.INSTALLED_APPS)
