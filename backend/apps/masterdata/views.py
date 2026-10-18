from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MasterDataStore
from .serializers import MasterDataStoreSerializer
from apps.authentication.models import ActivityLog
from apps.authentication.permissions import IsAdminOrReadOnly

class MasterDataViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def list(self, request):
        store = MasterDataStore.objects.last()
        if not store:
            store = MasterDataStore.objects.create(version='2.0.0', last_pushed_by=request.user.username)
        return Response(MasterDataStoreSerializer(store).data)

    def create(self, request):
        data = request.data
        store = MasterDataStore.objects.create(
            version=data.get('version', '2.0.0'),
            last_pushed_by=request.user.username,
            change_notes=data.get('changeNotes', ''),
            catalog_categories=data.get('catalogCategories', []),
            catalog_items=data.get('catalogItems', []),
            regions=data.get('regions', []),
            woredas=data.get('woredas', []),
            kebeles=data.get('kebeles', []),
            system_configurations=data.get('systemConfigurations', []),
            workflow_definitions=data.get('workflowDefinitions', []),
            workflow_steps=data.get('workflowSteps', []),
            approval_thresholds=data.get('approvalThresholds', []),
            history_entries=data.get('historyEntries', []),
            geographic_hierarchy=data.get('geographicHierarchy', {}),
            project_categories=data.get('projectCategories', {}),
            water_sources=data.get('waterSources', []),
            energy_sources=data.get('energySources', []),
            intervention_types=data.get('interventionTypes', []),
            source_reliability_ratings=data.get('sourceReliabilityRatings', []),
            implementing_bodies=data.get('implementingBodies', []),
            risk_levels=data.get('riskLevels', []),
            funding_sources=data.get('fundingSources', []),
            currencies=data.get('currencies', []),
            departments=data.get('departments', []),
            procurement_types=data.get('procurementTypes', []),
            procurement_methods=data.get('procurementMethods', []),
            bidder_types=data.get('bidderTypes', []),
            rejection_reasons=data.get('rejectionReasons', []),
            deliverable_categories=data.get('deliverableCategories', []),
            amendment_types=data.get('amendmentTypes', []),
            variation_statuses=data.get('variationStatuses', []),
            claim_sources=data.get('claimSources', []),
            claim_statuses=data.get('claimStatuses', []),
            termination_reasons=data.get('terminationReasons', []),
            document_categories=data.get('documentCategories', []),
            priority_levels=data.get('priorityLevels', []),
            push_logs=data.get('pushLogs', [])
        )
        ActivityLog.objects.create(
            user=request.user.username,
            action='Saved Master Data Registry',
            target_type='MasterData',
            target_id=str(store.id),
            details=f"Master Data version {store.version} published by {request.user.username}."
        )
        return Response(MasterDataStoreSerializer(store).data, status=status.HTTP_201_CREATED)
