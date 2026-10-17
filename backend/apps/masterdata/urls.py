from django.urls import path
from .views import MasterDataViewSet

urlpatterns = [
    path('store/', MasterDataViewSet.as_view({'get': 'list', 'post': 'create'}), name='masterdata-store'),
]
