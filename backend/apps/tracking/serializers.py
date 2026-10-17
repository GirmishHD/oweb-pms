from rest_framework import serializers
from .models import WeeklyWorkPlan, WeeklyProgressReport

class WeeklyWorkPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyWorkPlan
        fields = '__all__'

class WeeklyProgressReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyProgressReport
        fields = '__all__'
