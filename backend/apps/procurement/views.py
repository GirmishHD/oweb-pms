from rest_framework import viewsets, permissions
from .models import Procurement
from .serializers import ProcurementSerializer
from apps.authentication.models import ActivityLog

class ProcurementViewSet(viewsets.ModelViewSet):
    queryset = Procurement.objects.all().order_by('-created_at')
    serializer_class = ProcurementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['tender_stage', 'evaluation_status', 'project_id', 'procurement_method']
    search_fields = ['procurement_id', 'tender_reference_number', 'project_id', 'contractor_name']
    ordering_fields = ['created_at', 'engineer_estimate', 'closing_date', 'award_date']

    def perform_create(self, serializer):
        proc = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Created Procurement Tender',
            target_type='Procurement',
            target_id=proc.procurement_id,
            details=f"Tender {proc.tender_reference_number} created for project {proc.project_id}."
        )

    def perform_update(self, serializer):
        proc = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Updated Procurement Tender',
            target_type='Procurement',
            target_id=proc.procurement_id,
            details=f"Tender {proc.tender_reference_number} updated. Stage: {proc.tender_stage}."
        )
