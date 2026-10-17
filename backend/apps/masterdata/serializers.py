from rest_framework import serializers
from .models import MasterDataStore

class MasterDataStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterDataStore
        fields = '__all__'
