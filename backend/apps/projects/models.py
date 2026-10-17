from django.db import models

class ProjectStatusChoice(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SUBMITTED = 'Submitted', 'Submitted'
    UNDER_REVIEW = 'Under Review', 'Under Review'
    APPROVED = 'Approved', 'Approved'
    REJECTED = 'Rejected', 'Rejected'
    CANCELLED = 'Cancelled', 'Cancelled'
    COMPLETED = 'Completed', 'Completed'

class Project(models.Model):
    project_id = models.CharField(max_length=100, unique=True) # e.g. OWEB-WAT-2025-0001
    project_code = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=255)
    program = models.CharField(max_length=255, blank=True)
    program_id = models.CharField(max_length=100, blank=True)
    program_component = models.CharField(max_length=255, blank=True)
    implementing_ngo_id = models.CharField(max_length=100, blank=True)
    implementing_ngo_name = models.CharField(max_length=255, blank=True)
    project_manager = models.CharField(max_length=255, blank=True)
    assigned_staff_ids = models.JSONField(default=list, blank=True)
    assigned_staff_names = models.JSONField(default=list, blank=True)
    
    # Location
    region = models.CharField(max_length=100, default='Oromia')
    zone = models.CharField(max_length=100)
    woreda = models.CharField(max_length=100)
    kebele = models.CharField(max_length=100)
    gps_coordinates = models.JSONField(default=dict) # {'lat': 8.5, 'long': 39.2}
    elevation = models.FloatField(default=0.0)
    
    # Technical Scoping
    project_type = models.CharField(max_length=100) # Water Supply, Sanitation, Water Resources Management
    project_sub_type = models.CharField(max_length=100, blank=True)
    source_of_water = models.CharField(max_length=100, blank=True)
    energy_source = models.CharField(max_length=100, blank=True)
    type_of_intervention = models.CharField(max_length=100) # New, Expansion, Rehabilitation
    population_coverage = models.IntegerField(default=0)
    daily_demand_estimate = models.FloatField(default=0.0)
    storage_requirement = models.FloatField(default=0.0)
    pipe_length_estimation = models.FloatField(default=0.0)
    
    # Implementation
    implementing_body = models.CharField(max_length=100)
    washco_exists = models.BooleanField(default=False)
    washco_details = models.TextField(blank=True)
    land_ownership_cleared = models.BooleanField(default=False)
    land_ownership_comment = models.TextField(blank=True)
    power_source_available = models.BooleanField(default=False)
    skilled_operators_available = models.BooleanField(default=False)
    
    # Financials & Phase Costs
    estimated_budget = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    phase_costs = models.JSONField(default=list, blank=True)
    funding_source = models.CharField(max_length=100)
    community_contribution = models.TextField(blank=True)
    
    # Risk & Feasibility
    environmental_risk_level = models.CharField(max_length=50, default='Low')
    source_reliability = models.CharField(max_length=50, default='Reliable')
    conflict_over_source = models.BooleanField(default=False)
    feasibility_study_conducted = models.BooleanField(default=False)
    feasibility_consultant = models.CharField(max_length=255, blank=True)
    feasibility_study_date = models.DateField(null=True, blank=True)
    feasibility_water_source_reliability = models.CharField(max_length=50, blank=True)
    feasibility_technical_viability = models.TextField(blank=True)
    feasibility_economic_feasibility = models.TextField(blank=True)
    feasibility_social_acceptance = models.TextField(blank=True)
    feasibility_land_acquisition_status = models.BooleanField(default=False)
    feasibility_land_acquisition_remarks = models.TextField(blank=True)
    
    # EIA
    eia_conducted = models.BooleanField(default=False)
    eia_consultant = models.CharField(max_length=255, blank=True)
    eia_approval_authority = models.CharField(max_length=255, blank=True)
    eia_approval_date = models.DateField(null=True, blank=True)
    eia_risk_rating = models.CharField(max_length=50, blank=True)
    eia_key_risks = models.TextField(blank=True)
    eia_mitigation_measures = models.TextField(blank=True)
    eia_monitoring_plan_in_place = models.BooleanField(default=False)
    eia_community_consultation_held = models.BooleanField(default=False)
    eia_community_consultation_summary = models.TextField(blank=True)
    
    # Workflow & Lifecycle
    status = models.CharField(max_length=50, choices=ProjectStatusChoice.choices, default=ProjectStatusChoice.DRAFT)
    creator = models.CharField(max_length=100)
    planned_start_date = models.DateField(null=True, blank=True)
    planned_completion_date = models.DateField(null=True, blank=True)
    actual_start_date = models.DateField(null=True, blank=True)
    actual_completion_date = models.DateField(null=True, blank=True)
    
    # Review & Appraisal
    review_comments = models.TextField(blank=True)
    reviewed_by = models.CharField(max_length=100, blank=True)
    review_date = models.DateField(null=True, blank=True)
    review_score = models.FloatField(null=True, blank=True)
    appraisal_verdict = models.CharField(max_length=50, blank=True)
    approval_certificate_no = models.CharField(max_length=100, blank=True)
    revision_points = models.JSONField(default=list, blank=True)
    review_checklist = models.JSONField(default=dict, blank=True)
    summary = models.TextField(blank=True)
    ai_risk_assessment = models.JSONField(default=dict, blank=True)
    
    # Access control & assignments
    assigned_engineer_id = models.CharField(max_length=100, blank=True)
    assigned_engineer_name = models.CharField(max_length=255, blank=True)
    assigned_supervisor_id = models.CharField(max_length=100, blank=True)
    assigned_supervisor_name = models.CharField(max_length=255, blank=True)
    assigned_team_leader_id = models.CharField(max_length=100, blank=True)
    assigned_team = models.CharField(max_length=255, blank=True)
    assigned_supporting_staff_ids = models.JSONField(default=list, blank=True)
    partner_organization = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'zone'], name='proj_stat_zone_idx'),
            models.Index(fields=['program', 'status'], name='proj_prog_stat_idx'),
            models.Index(fields=['zone', 'woreda'], name='proj_zone_woreda_idx'),
            models.Index(fields=['created_at'], name='proj_created_idx'),
            models.Index(fields=['assigned_engineer_id'], name='proj_eng_idx'),
            models.Index(fields=['assigned_supervisor_id'], name='proj_sup_idx'),
        ]

    def __str__(self):
        return f"{self.project_id} - {self.name} [{self.status}]"
