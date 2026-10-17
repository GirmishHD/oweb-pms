from rest_framework import serializers
from .models import MasterDataStore

class MasterDataStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterDataStore
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['catalogCategories'] = instance.catalog_categories or []
        ret['catalogItems'] = instance.catalog_items or []
        ret['regions'] = instance.regions or []
        ret['woredas'] = instance.woredas or []
        ret['kebeles'] = instance.kebeles or []
        ret['systemConfigurations'] = instance.system_configurations or []
        ret['workflowDefinitions'] = instance.workflow_definitions or []
        ret['workflowSteps'] = instance.workflow_steps or []
        ret['approvalThresholds'] = instance.approval_thresholds or []
        ret['historyEntries'] = instance.history_entries or []
        ret['geographicHierarchy'] = instance.geographic_hierarchy or {}
        ret['projectCategories'] = instance.project_categories or {}
        ret['waterSources'] = instance.water_sources or []
        ret['energySources'] = instance.energy_sources or []
        ret['interventionTypes'] = instance.intervention_types or []
        ret['sourceReliabilityRatings'] = instance.source_reliability_ratings or []
        ret['implementingBodies'] = instance.implementing_bodies or []
        ret['riskLevels'] = instance.risk_levels or []
        ret['fundingSources'] = instance.funding_sources or []
        ret['currencies'] = instance.currencies or []
        ret['departments'] = instance.departments or []
        ret['procurementTypes'] = instance.procurement_types or []
        ret['procurementMethods'] = instance.procurement_methods or []
        ret['bidderTypes'] = instance.bidder_types or []
        ret['rejectionReasons'] = instance.rejection_reasons or []
        ret['deliverableCategories'] = instance.deliverable_categories or []
        ret['amendmentTypes'] = instance.amendment_types or []
        ret['variationStatuses'] = instance.variation_statuses or []
        ret['claimSources'] = instance.claim_sources or []
        ret['claimStatuses'] = instance.claim_statuses or []
        ret['terminationReasons'] = instance.termination_reasons or []
        ret['documentCategories'] = instance.document_categories or []
        ret['priorityLevels'] = instance.priority_levels or []
        ret['pushLogs'] = instance.push_logs or []
        ret['lastPushedAt'] = instance.last_pushed_at
        ret['lastPushedBy'] = instance.last_pushed_by
        ret['changeNotes'] = instance.change_notes
        return ret
