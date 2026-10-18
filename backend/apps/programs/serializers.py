from rest_framework import serializers
from .models import Program, NGO, Staff, DevelopmentPartner, PartnerDocument

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'

class NGOSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGO
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class DevelopmentPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DevelopmentPartner
        fields = '__all__'

class PartnerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerDocument
        fields = '__all__'
