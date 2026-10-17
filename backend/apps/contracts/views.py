from rest_framework import viewsets, permissions
from .models import Contract
from .serializers import ContractSerializer
from apps.authentication.models import ActivityLog

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all().order_by('-created_at')
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

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
