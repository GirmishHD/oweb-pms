from django.db import models

class FieldInspectionLog(models.Model):
    inspection_id = models.CharField(max_length=100, unique=True) # e.g. INSP-2025-001
    project_id = models.CharField(max_length=100)
    project_name = models.CharField(max_length=255)
    program = models.CharField(max_length=255, blank=True)
    zone = models.CharField(max_length=100)
    woreda = models.CharField(max_length=100)
    inspection_date = models.DateField()
    inspector_name = models.CharField(max_length=255)
    inspector_role = models.CharField(max_length=255)
    visit_stage = models.CharField(max_length=100)
    overall_physical_progress_pct = models.FloatField(default=0.0)
    workmanship_rating = models.CharField(max_length=50, default='Satisfactory')
    site_cleanliness_and_safety = models.CharField(max_length=50, default='Satisfactory')
    environmental_compliance = models.CharField(max_length=50, default='Compliant')
    water_quality_test = models.JSONField(default=dict, blank=True)
    defects = models.JSONField(default=list, blank=True)
    supervisor_remarks = models.TextField(blank=True)
    recommended_actions = models.TextField(blank=True)
    next_scheduled_visit = models.DateField(null=True, blank=True)
    signed_off_by = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='Submitted')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-inspection_date', '-created_at']
        indexes = [
            models.Index(fields=['project_id'], name='insp_proj_idx'),
            models.Index(fields=['inspection_date'], name='insp_date_idx'),
            models.Index(fields=['status'], name='insp_status_idx'),
            models.Index(fields=['zone', 'woreda'], name='insp_zone_wor_idx'),
        ]

    def __str__(self):
        return f"{self.inspection_id} - {self.project_name} ({self.inspection_date})"
