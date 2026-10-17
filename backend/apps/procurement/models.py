from django.db import models

class Procurement(models.Model):
    procurement_id = models.CharField(max_length=100, unique=True) # e.g. PROC-OWEB-SAN-2024-0015
    project_id = models.CharField(max_length=100)
    tender_reference_number = models.CharField(max_length=100, blank=True)
    procurement_method = models.CharField(max_length=100, default='National Competitive Bidding (NCB)')
    procurement_type = models.CharField(max_length=50, default='Works') # Goods, Works, Consulting Services, Non-consulting
    bid_issued_date = models.DateField(null=True, blank=True)
    bidding_period_start = models.DateField(null=True, blank=True)
    bidding_period_end = models.DateField(null=True, blank=True)
    tender_stage = models.CharField(max_length=100, default='Preparation')
    evaluation_status = models.CharField(max_length=100, default='Draft')
    
    # Committee & Evaluation
    evaluation_committee = models.JSONField(default=dict, blank=True)
    bidders = models.JSONField(default=list, blank=True)
    lots = models.JSONField(default=list, blank=True)
    bid_securities = models.JSONField(default=list, blank=True)
    milestones = models.JSONField(default=list, blank=True)
    audit_trail = models.JSONField(default=list, blank=True)
    
    awarded_bidder_id = models.CharField(max_length=100, blank=True)
    award_date = models.DateField(null=True, blank=True)
    award_notice_ref = models.CharField(max_length=100, blank=True)
    standstill_period = models.BooleanField(default=False)
    standstill_bidder_id = models.CharField(max_length=100, blank=True)
    standstill_start_date = models.DateField(null=True, blank=True)
    standstill_end_date = models.DateField(null=True, blank=True)
    standstill_notice_url = models.TextField(blank=True)
    
    estimated_budget_etb = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    final_contract_value_etb = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    threshold_compliant = models.BooleanField(default=True)
    threshold_validation_notes = models.TextField(blank=True)
    committee_report = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project_id'], name='proc_proj_idx'),
            models.Index(fields=['tender_stage'], name='proc_stage_idx'),
            models.Index(fields=['evaluation_status'], name='proc_eval_stat_idx'),
            models.Index(fields=['created_at'], name='proc_created_idx'),
        ]

    def __str__(self):
        return f"{self.procurement_id} - {self.tender_reference_number}"
