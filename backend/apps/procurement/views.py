from rest_framework import viewsets, permissions
from rest_framework.response import Response
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

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        obj = None
        if lookup_value is not None:
            if str(lookup_value).isdigit():
                obj = queryset.filter(id=lookup_value).first()
            if not obj:
                obj = queryset.filter(procurement_id=lookup_value).first()
        if not obj:
            return super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        procurement_id = request.data.get('procurement_id')
        if procurement_id:
            existing = Procurement.objects.filter(procurement_id=procurement_id).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data)
        return super().create(request, *args, **kwargs)

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
