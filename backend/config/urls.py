from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET', 'HEAD'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Lightweight health check endpoint for cloud probes (Render, Kubernetes, etc.)
    """
    return Response({"status": "healthy", "service": "oweb-backend"}, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    OWBPMIS — Oromia Water Bureau Program Management Information System Root API
    """
    return Response({
        "status": "online",
        "service": "OWBPMIS — Oromia Water Bureau Program Management Information System Enterprise API",
        "version": "2.0.0",
        "documentation": {
            "swagger": request.build_absolute_uri('/api/docs/'),
            "redoc": request.build_absolute_uri('/api/redoc/'),
            "schema": request.build_absolute_uri('/api/schema/')
        },
        "modules": {
            "auth": request.build_absolute_uri('/api/auth/'),
            "programs": request.build_absolute_uri('/api/programs/'),
            "projects": request.build_absolute_uri('/api/projects/'),
            "procurement": request.build_absolute_uri('/api/procurement/'),
            "contracts": request.build_absolute_uri('/api/contracts/'),
            "inspections": request.build_absolute_uri('/api/inspections/'),
            "tracking": request.build_absolute_uri('/api/tracking/'),
            "masterdata": request.build_absolute_uri('/api/masterdata/'),
            "documents": request.build_absolute_uri('/api/documents/'),
            "reports": request.build_absolute_uri('/api/reports/')
        }
    })

urlpatterns = [
    path('', health_check, name='root-health'),
    path('healthz/', health_check, name='health-check-short'),
    path('api/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    
    # OpenAPI Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Module APIs
    path('api/auth/', include('apps.authentication.urls')),
    path('api/programs/', include('apps.programs.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/procurement/', include('apps.procurement.urls')),
    path('api/contracts/', include('apps.contracts.urls')),
    path('api/inspections/', include('apps.inspections.urls')),
    path('api/tracking/', include('apps.tracking.urls')),
    path('api/masterdata/', include('apps.masterdata.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/reports/', include('apps.reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
