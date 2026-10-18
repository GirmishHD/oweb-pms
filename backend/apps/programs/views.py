from rest_framework import viewsets, permissions
from apps.authentication.permissions import IsAdminOrReadOnly
from .models import Program, NGO, Staff, DevelopmentPartner, PartnerDocument
from .serializers import (
    ProgramSerializer, NGOSerializer, StaffSerializer,
    DevelopmentPartnerSerializer, PartnerDocumentSerializer
)

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().order_by('code')
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminOrReadOnly]

class NGOViewSet(viewsets.ModelViewSet):
    queryset = NGO.objects.all().order_by('name')
    serializer_class = NGOSerializer
    permission_classes = [permissions.IsAuthenticated]

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().order_by('full_name')
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]

class DevelopmentPartnerViewSet(viewsets.ModelViewSet):
    queryset = DevelopmentPartner.objects.all().order_by('name')
    serializer_class = DevelopmentPartnerSerializer
    permission_classes = [IsAdminOrReadOnly]

class PartnerDocumentViewSet(viewsets.ModelViewSet):
    queryset = PartnerDocument.objects.all().order_by('-publication_year', 'title')
    serializer_class = PartnerDocumentSerializer
    permission_classes = [IsAdminOrReadOnly]

