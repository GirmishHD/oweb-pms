from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramViewSet, NGOViewSet, StaffViewSet,
    DevelopmentPartnerViewSet, PartnerDocumentViewSet
)

router = DefaultRouter()
router.register(r'portfolios', ProgramViewSet, basename='program')
router.register(r'ngos', NGOViewSet, basename='ngo')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'partners', DevelopmentPartnerViewSet, basename='development-partner')
router.register(r'documents', PartnerDocumentViewSet, basename='partner-document')

urlpatterns = [
    path('', include(router.urls)),
]

