from rest_framework import viewsets, permissions
from .models import FieldInspectionLog
from .serializers import FieldInspectionLogSerializer
from apps.authentication.models import ActivityLog

class FieldInspectionLogViewSet(viewsets.ModelViewSet):
    queryset = FieldInspectionLog.objects.all().order_by('-inspection_date')
    serializer_class = FieldInspectionLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        log = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Filed Inspection Log',
            target_type='Inspection',
            target_id=log.inspection_id,
            details=f"Field inspection filed for {log.project_name} at stage {log.visit_stage}. Progress: {log.overall_physical_progress_pct}%."
        )
