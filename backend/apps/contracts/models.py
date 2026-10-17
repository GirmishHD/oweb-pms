from django.db import models

class Contract(models.Model):
    contract_id = models.CharField(max_length=100, unique=True) # e.g. CONT-OWEB-SAN-2024-0015
    project_id = models.CharField(max_length=100)
    procurement_id = models.CharField(max_length=100)
    contract_manager = models.CharField(max_length=255)
    cm_plan_assignment_date = models.DateField(null=True, blank=True)
    cm_actual_assignment_date = models.DateField(null=True, blank=True)
    cm_remarks = models.TextField(blank=True)
    supervisor = models.CharField(max_length=255)
    supervisor_plan_assignment_date = models.DateField(null=True, blank=True)
    supervisor_actual_assignment_date = models.DateField(null=True, blank=True)
    supervisor_remarks = models.TextField(blank=True)
    assigned_engineer = models.CharField(max_length=255, blank=True)
    assigned_engineer_id = models.CharField(max_length=100, blank=True)
    assigned_team = models.CharField(max_length=255, blank=True)
    contractor_name = models.CharField(max_length=255, blank=True)
    
    # Performance Security
    performance_security_plan_date = models.DateField(null=True, blank=True)
    performance_security_actual_date = models.DateField(null=True, blank=True)
    performance_security_expiry_date = models.DateField(null=True, blank=True)
    performance_bond_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    performance_bond_currency = models.CharField(max_length=20, default='ETB')
    performance_guarantee_url = models.TextField(blank=True)
    
    signing_date = models.DateField(null=True, blank=True)
    signed_contract_url = models.TextField(blank=True)
    
    # Commencement
    dispute_board_in_place = models.BooleanField(default=False)
    commencement_plan_date = models.DateField(null=True, blank=True)
    commencement_actual_date = models.DateField(null=True, blank=True)
    site_handover_plan_date = models.DateField(null=True, blank=True)
    site_handover_actual_date = models.DateField(null=True, blank=True)
    site_handover_docs_url = models.TextField(blank=True)
    seash_conference_plan_date = models.DateField(null=True, blank=True)
    seash_conference_actual_date = models.DateField(null=True, blank=True)
    seash_conference_records_url = models.TextField(blank=True)
    
    # Implementation: KPIs, Deliverables, Payments, Variations, Claims
    kpis = models.JSONField(default=list, blank=True)
    deliverables = models.JSONField(default=list, blank=True)
    payments = models.JSONField(default=list, blank=True)
    variations = models.JSONField(default=list, blank=True)
    claims = models.JSONField(default=list, blank=True)
    
    planned_completion_date = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    is_plan_finalized = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project_id'], name='cont_proj_idx'),
            models.Index(fields=['procurement_id'], name='cont_proc_idx'),
            models.Index(fields=['is_plan_finalized'], name='cont_finalized_idx'),
            models.Index(fields=['created_at'], name='cont_created_idx'),
            models.Index(fields=['contract_manager'], name='cont_mgr_idx'),
            models.Index(fields=['supervisor'], name='cont_sup_idx'),
        ]

    def __str__(self):
        return f"{self.contract_id} ({self.contractor_name})"
