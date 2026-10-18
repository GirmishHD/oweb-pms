from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MasterDataViewSet, OrgUnitViewSet

router = DefaultRouter()
router.register(r'org-units', OrgUnitViewSet, basename='org-units')

urlpatterns = [
    path('store/', MasterDataViewSet.as_view({'get': 'list', 'post': 'create'}), name='masterdata-store'),
    path('', include(router.urls)),
]
