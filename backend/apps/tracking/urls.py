from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeeklyWorkPlanViewSet, WeeklyProgressReportViewSet

router = DefaultRouter()
router.register(r'plans', WeeklyWorkPlanViewSet, basename='weekly-plan')
router.register(r'reports', WeeklyProgressReportViewSet, basename='weekly-report')

urlpatterns = [
    path('', include(router.urls)),
]
