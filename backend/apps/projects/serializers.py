from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        extra_kwargs = {
            'woreda': {'required': False, 'allow_blank': True},
            'kebele': {'required': False, 'allow_blank': True},
            'zone': {'required': False, 'allow_blank': True},
            'project_type': {'required': False, 'allow_blank': True},
            'type_of_intervention': {'required': False, 'allow_blank': True},
            'implementing_body': {'required': False, 'allow_blank': True},
            'funding_source': {'required': False, 'allow_blank': True},
            'gps_coordinates': {'required': False},
        }
