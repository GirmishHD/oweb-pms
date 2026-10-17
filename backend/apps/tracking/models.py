from django.db import models

class WeeklyWorkPlan(models.Model):
    plan_id = models.CharField(max_length=100, unique=True) # e.g. PLAN-001
    project_id = models.CharField(max_length=100)
    project_name = models.CharField(max_length=255)
    zone = models.CharField(max_length=100)
    woreda = models.CharField(max_length=100)
    kebele = models.CharField(max_length=100, blank=True)
    week_number = models.IntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    prepared_by_user_id = models.CharField(max_length=100)
    prepared_by_name = models.CharField(max_length=255)
    prepared_date = models.DateField()
    target_physical_progress_pct = models.FloatField(default=0.0)
    planned_activities = models.JSONField(default=list, blank=True)
    resource_plan = models.JSONField(default=dict, blank=True)
    weather_forecast_notes = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='Draft')
    approved_by = models.CharField(max_length=255, blank=True)
    approval_date = models.DateField(null=True, blank=True)
    approval_remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Week {self.week_number}: {self.project_name} ({self.status})"

class WeeklyProgressReport(models.Model):
    report_id = models.CharField(max_length=100, unique=True) # e.g. REP-001
    project_id = models.CharField(max_length=100)
    project_name = models.CharField(max_length=255)
    weekly_plan_id = models.CharField(max_length=100, blank=True)
    week_number = models.IntegerField()
    report_date = models.DateField()
    submitted_by_user_id = models.CharField(max_length=100)
    submitted_by_name = models.CharField(max_length=255)
    previous_physical_progress_pct = models.FloatField(default=0.0)
    this_week_physical_progress_pct = models.FloatField(default=0.0)
    cumulative_physical_progress_pct = models.FloatField(default=0.0)
    planned_progress_pct = models.FloatField(default=0.0)
    progress_variance_pct = models.FloatField(default=0.0)
    status = models.CharField(max_length=50, default='Submitted')
    endorsed_by_team_leader = models.CharField(max_length=255, blank=True)
    approved_by_supervisor = models.CharField(max_length=255, blank=True)
    approval_remarks = models.TextField(blank=True)
    site_labor_count = models.IntegerField(default=0)
    weather_conditions = models.CharField(max_length=100, default='Favorable')
    key_accomplishments = models.JSONField(default=list, blank=True)
    challenges_bottlenecks = models.JSONField(default=list, blank=True)
    corrective_actions = models.JSONField(default=list, blank=True)
    site_photos_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Progress Report W{self.week_number}: {self.project_name} ({self.cumulative_physical_progress_pct}%)"
