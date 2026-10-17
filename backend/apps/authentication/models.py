from django.db import models
from django.contrib.auth.models import AbstractUser

class RoleChoice(models.TextChoices):
    USER = 'User', 'User'
    REVIEWER = 'Reviewer', 'Reviewer'
    ADMIN = 'Admin', 'Admin'
    PROCUREMENT = 'Procurement', 'Procurement'
    CONTRACT_MANAGER = 'Contract Manager', 'Contract Manager'
    SUPERVISOR = 'Supervisor', 'Supervisor'
    AUDITOR = 'Auditor', 'Auditor'
    DIRECTOR = 'Director', 'Director'
    COORDINATOR = 'Coordinator', 'Coordinator'
    TEAM_LEADER = 'Team Leader', 'Team Leader'
    ENGINEER = 'Engineer', 'Engineer'
    FINANCE_OFFICER = 'Finance Officer', 'Finance Officer'
    PLANNING_OFFICER = 'Planning Officer', 'Planning Officer'
    ME_OFFICER = 'Monitoring & Evaluation Officer', 'Monitoring & Evaluation Officer'
    PARTNER_MEMBER = 'NGO/Partner Member', 'NGO/Partner Member'
    VIEWER = 'Viewer', 'Viewer'

class UserStatusChoice(models.TextChoices):
    ACTIVE = 'Active', 'Active'
    INACTIVE = 'Inactive', 'Inactive'
    SUSPENDED = 'Suspended', 'Suspended'

class DataScopeChoice(models.TextChoices):
    ALL = 'ALL', 'ALL'
    ORGANIZATION = 'ORGANIZATION', 'ORGANIZATION'
    TEAM = 'TEAM', 'TEAM'
    ASSIGNED_PROJECTS = 'ASSIGNED_PROJECTS', 'ASSIGNED_PROJECTS'
    ASSIGNED_CONTRACTS = 'ASSIGNED_CONTRACTS', 'ASSIGNED_CONTRACTS'
    OWN_RECORDS = 'OWN_RECORDS', 'OWN_RECORDS'
    PARTNER_ORGANIZATION = 'PARTNER_ORGANIZATION', 'PARTNER_ORGANIZATION'

class User(AbstractUser):
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    role = models.CharField(max_length=50, choices=RoleChoice.choices, default=RoleChoice.USER)
    secondary_roles = models.JSONField(default=list, blank=True)
    custom_role_ids = models.JSONField(default=list, blank=True)
    custom_permissions = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=UserStatusChoice.choices, default=UserStatusChoice.ACTIVE)
    department = models.CharField(max_length=255, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    partner_organization = models.CharField(max_length=255, blank=True)
    assigned_team = models.CharField(max_length=255, blank=True)
    assigned_zone = models.CharField(max_length=255, blank=True)
    assigned_woreda = models.CharField(max_length=255, blank=True)
    assigned_program = models.CharField(max_length=255, blank=True)
    assigned_programs = models.JSONField(default=list, blank=True)
    assigned_ngo_id = models.CharField(max_length=100, blank=True)
    assigned_ngo_name = models.CharField(max_length=255, blank=True)
    staff_profile_id = models.CharField(max_length=100, blank=True)
    assigned_project_ids = models.JSONField(default=list, blank=True)
    data_scope_override = models.CharField(max_length=50, choices=DataScopeChoice.choices, blank=True, null=True)
    avatar = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['role', 'status'], name='usr_role_stat_idx'),
            models.Index(fields=['assigned_zone'], name='usr_zone_idx'),
            models.Index(fields=['assigned_program'], name='usr_prog_idx'),
        ]

    def __str__(self):
        return f"{self.username} ({self.role})"

class RoleDefinition(models.Model):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    permissions = models.JSONField(default=list)
    default_data_scope = models.CharField(max_length=50, default='ALL')
    organization_scope = models.CharField(max_length=255, blank=True)
    is_system = models.BooleanField(default=False)
    color = models.CharField(max_length=50, blank=True)
    created_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} [{self.code}]"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    type = models.CharField(max_length=50, default='info')
    is_read = models.BooleanField(default=False)
    link = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at'], name='notif_usr_read_idx'),
        ]

    def __str__(self):
        return f"Notification to {self.user.username}: {self.message[:30]}"

class ActivityLog(models.Model):
    user = models.CharField(max_length=100)
    action = models.CharField(max_length=255)
    target_type = models.CharField(max_length=100, blank=True)
    target_id = models.CharField(max_length=100, blank=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp'], name='act_usr_time_idx'),
            models.Index(fields=['target_type', 'target_id'], name='act_target_idx'),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.user}: {self.action}"
