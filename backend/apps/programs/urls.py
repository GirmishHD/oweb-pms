from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgramViewSet, NGOViewSet, StaffViewSet

router = DefaultRouter()
router.register(r'portfolios', ProgramViewSet, basename='program')
router.register(r'ngos', NGOViewSet, basename='ngo')
router.register(r'staff', StaffViewSet, basename='staff')

urlpatterns = [
    path('', include(router.urls)),
]
