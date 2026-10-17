from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    
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
