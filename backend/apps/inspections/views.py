from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import FieldInspectionLog
from .serializers import FieldInspectionLogSerializer
from apps.authentication.models import ActivityLog

class FieldInspectionLogViewSet(viewsets.ModelViewSet):
    queryset = FieldInspectionLog.objects.all().order_by('-inspection_date')
    serializer_class = FieldInspectionLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['project_id', 'status', 'zone', 'woreda', 'inspector_name', 'visit_stage']
    search_fields = ['inspection_id', 'project_id', 'project_name', 'inspector_name', 'zone', 'woreda', 'kebele']
    ordering_fields = ['inspection_date', 'overall_physical_progress_pct', 'created_at']

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        obj = None
        if lookup_value is not None:
            if str(lookup_value).isdigit():
                obj = queryset.filter(id=lookup_value).first()
            if not obj:
                obj = queryset.filter(inspection_id=lookup_value).first()
        if not obj:
            return super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        inspection_id = request.data.get('inspection_id')
        if inspection_id:
            existing = FieldInspectionLog.objects.filter(inspection_id=inspection_id).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        log = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Filed Inspection Log',
            target_type='Inspection',
            target_id=log.inspection_id,
            details=f"Field inspection filed for {log.project_name} at stage {log.visit_stage}. Progress: {log.overall_physical_progress_pct}%."
        )
