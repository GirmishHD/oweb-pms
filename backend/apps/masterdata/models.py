from django.db import models
from django.core.exceptions import ValidationError

class OrgUnitType(models.TextChoices):
    REGION = 'REGION', 'Region'
    CLUSTER = 'CLUSTER', 'Cluster'
    WOREDA = 'WOREDA', 'Woreda'
    TOWN = 'TOWN', 'Town / City Administration'
    KEBELE = 'KEBELE', 'Kebele'

class OrgUnit(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    local_name = models.CharField(max_length=255, blank=True)
    unit_type = models.CharField(max_length=50, choices=OrgUnitType.choices)
    classification = models.CharField(max_length=100, blank=True)  # e.g. 'City Administration', 'Town', 'Rural Woreda'
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    cluster = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='cluster_units')
    former_zone_name = models.CharField(max_length=255, blank=True)  # Preserved historical reference for auditing and lookup
    status = models.CharField(max_length=20, default='Active')
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['unit_type', 'status']),
            models.Index(fields=['parent']),
            models.Index(fields=['cluster']),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit_type})"

    def clean(self):
        super().clean()
        if self.unit_type == OrgUnitType.REGION:
            if self.parent:
                raise ValidationError({'parent': "Region must not have a parent organizational unit."})
        elif self.unit_type == OrgUnitType.CLUSTER:
            if not self.parent or self.parent.unit_type != OrgUnitType.REGION:
                raise ValidationError({'parent': "Cluster must belong to a Region."})
        elif self.unit_type in (OrgUnitType.WOREDA, OrgUnitType.TOWN):
            if not self.parent or self.parent.unit_type != OrgUnitType.CLUSTER:
                raise ValidationError({'parent': f"{self.get_unit_type_display()} must belong directly to a Cluster."})
        elif self.unit_type == OrgUnitType.KEBELE:
            if not self.parent or self.parent.unit_type not in (OrgUnitType.WOREDA, OrgUnitType.TOWN):
                raise ValidationError({'parent': "Kebele must belong to a Woreda or Town / City Administration."})

        # Circular parent check
        curr = self.parent
        visited = set()
        while curr:
            if curr.id == self.id or curr.id in visited:
                raise ValidationError({'parent': "Circular parent-child relationship detected."})
            visited.add(curr.id)
            curr = curr.parent

class MasterDataStore(models.Model):
    version = models.CharField(max_length=50, default='2.0.0')
    last_pushed_at = models.DateTimeField(auto_now=True)
    last_pushed_by = models.CharField(max_length=100, default='admin')
    change_notes = models.TextField(blank=True)
    
    # Store complete normalized master data schema
    catalog_categories = models.JSONField(default=list, blank=True)
    catalog_items = models.JSONField(default=list, blank=True)
    regions = models.JSONField(default=list, blank=True)
    clusters = models.JSONField(default=list, blank=True)
    towns = models.JSONField(default=list, blank=True)
    woredas = models.JSONField(default=list, blank=True)
    kebeles = models.JSONField(default=list, blank=True)
    system_configurations = models.JSONField(default=list, blank=True)
    workflow_definitions = models.JSONField(default=list, blank=True)
    workflow_steps = models.JSONField(default=list, blank=True)
    approval_thresholds = models.JSONField(default=list, blank=True)
    history_entries = models.JSONField(default=list, blank=True)
    geographic_hierarchy = models.JSONField(default=dict, blank=True)
    project_categories = models.JSONField(default=dict, blank=True)
    water_sources = models.JSONField(default=list, blank=True)
    energy_sources = models.JSONField(default=list, blank=True)
    intervention_types = models.JSONField(default=list, blank=True)
    source_reliability_ratings = models.JSONField(default=list, blank=True)
    implementing_bodies = models.JSONField(default=list, blank=True)
    risk_levels = models.JSONField(default=list, blank=True)
    funding_sources = models.JSONField(default=list, blank=True)
    currencies = models.JSONField(default=list, blank=True)
    departments = models.JSONField(default=list, blank=True)
    procurement_types = models.JSONField(default=list, blank=True)
    procurement_methods = models.JSONField(default=list, blank=True)
    bidder_types = models.JSONField(default=list, blank=True)
    rejection_reasons = models.JSONField(default=list, blank=True)
    deliverable_categories = models.JSONField(default=list, blank=True)
    amendment_types = models.JSONField(default=list, blank=True)
    variation_statuses = models.JSONField(default=list, blank=True)
    claim_sources = models.JSONField(default=list, blank=True)
    claim_statuses = models.JSONField(default=list, blank=True)
    termination_reasons = models.JSONField(default=list, blank=True)
    document_categories = models.JSONField(default=list, blank=True)
    priority_levels = models.JSONField(default=list, blank=True)
    push_logs = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"MasterData v{self.version} (last pushed: {self.last_pushed_at})"
