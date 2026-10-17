from rest_framework import serializers
from .models import FieldInspectionLog

class FieldInspectionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldInspectionLog
        fields = '__all__'
