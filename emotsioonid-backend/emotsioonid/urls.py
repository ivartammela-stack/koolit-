"""
URL configuration for emotsioonid project.
"""

from django.contrib import admin
from django.urls import path, include  # veendu, et 'include' on imporditud
from django.views.generic import RedirectView
from django.http import JsonResponse

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

def health(_request):
    return JsonResponse({"status": "ok", "service": "emotsioonid", "version": "v1"})

urlpatterns = [
    path("", RedirectView.as_view(url="/api/docs/", permanent=False)),
    path("health/", health, name="health"),
    path("admin/", admin.site.urls),

    # ⬇️ see rida ühendab core/urls.py (schools routeri) aadressi alla /api/
    path("api/", include("core.urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]