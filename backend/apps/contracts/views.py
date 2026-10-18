from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import Contract
from .serializers import ContractSerializer
from apps.authentication.models import ActivityLog

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all().order_by('-created_at')
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['project_id', 'procurement_id', 'contract_manager', 'supervisor', 'is_plan_finalized']
    search_fields = ['contract_id', 'project_id', 'procurement_id', 'contractor_name', 'contract_manager', 'supervisor']
    ordering_fields = ['created_at', 'contract_price', 'commencement_date', 'completion_date_intended']

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        obj = None
        if lookup_value is not None:
            if str(lookup_value).isdigit():
                obj = queryset.filter(id=lookup_value).first()
            if not obj:
                obj = queryset.filter(contract_id=lookup_value).first()
        if not obj:
            return super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        contract_id = request.data.get('contract_id')
        if contract_id:
            existing = Contract.objects.filter(contract_id=contract_id).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        contract = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Created Contract Agreement',
            target_type='Contract',
            target_id=contract.contract_id,
            details=f"Contract {contract.contract_id} for project {contract.project_id} assigned to {contract.contractor_name}."
        )

    def perform_update(self, serializer):
        contract = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Updated Contract Agreement',
            target_type='Contract',
            target_id=contract.contract_id,
            details=f"Contract {contract.contract_id} updated. Manager: {contract.contract_manager}."
        )
