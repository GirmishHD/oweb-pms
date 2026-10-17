from rest_framework import viewsets, permissions
from .models import Document
from .serializers import DocumentSerializer
from apps.authentication.models import ActivityLog

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('-upload_date')
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        doc = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Uploaded Document',
            target_type='Document',
            target_id=doc.document_id,
            details=f"Uploaded '{doc.file_name}' ({doc.category}) to vault for scheme {doc.project_id}."
        )
