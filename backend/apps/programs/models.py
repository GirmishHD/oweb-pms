from django.db import models

class Program(models.Model):
    prog_id = models.CharField(max_length=50, unique=True) # e.g. PROG-001
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    program_manager = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    funding_source = models.CharField(max_length=255)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=50, default='Active')
    focus_area = models.TextField(blank=True)
    budget_etb = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    target_beneficiaries = models.BigIntegerField(default=0)
    components = models.JSONField(default=list, blank=True)
    created_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class NGO(models.Model):
    ngo_id = models.CharField(max_length=50, unique=True) # e.g. NGO-001
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    registration_number = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    operating_area = models.CharField(max_length=255, blank=True)
    assigned_program_ids = models.JSONField(default=list, blank=True)
    assigned_program_names = models.JSONField(default=list, blank=True)
    assigned_project_ids = models.JSONField(default=list, blank=True)
    active_schemes_count = models.IntegerField(default=0)
    primary_program = models.CharField(max_length=255, blank=True)
    performance_rating = models.DecimalField(max_digits=4, decimal_places=2, default=4.0)
    annual_budget = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    mou_status = models.CharField(max_length=100, default='Active')
    status = models.CharField(max_length=50, default='Active')
    history = models.JSONField(default=list, blank=True)
    created_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Staff(models.Model):
    staff_id = models.CharField(max_length=50, unique=True) # e.g. STF-001
    staff_code = models.CharField(max_length=100, unique=True)
    full_name = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    duty_station = models.CharField(max_length=255, blank=True)
    staff_classification = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    assigned_program_id = models.CharField(max_length=100, blank=True)
    assigned_program_name = models.CharField(max_length=255, blank=True)
    assigned_ngo_id = models.CharField(max_length=100, blank=True)
    assigned_ngo_name = models.CharField(max_length=255, blank=True)
    assigned_project_ids = models.JSONField(default=list, blank=True)
    supervisor_name = models.CharField(max_length=255, blank=True)
    employment_start_date = models.DateField(null=True, blank=True)
    employment_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, default='Active')
    linked_user_id = models.CharField(max_length=100, blank=True)
    transfer_history = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.job_title}"
