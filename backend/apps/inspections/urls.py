from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FieldInspectionLogViewSet

router = DefaultRouter()
router.register(r'logs', FieldInspectionLogViewSet, basename='inspection')

urlpatterns = [
    path('', include(router.urls)),
]
