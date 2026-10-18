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

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['status'], name='prog_stat_idx'),
            models.Index(fields=['funding_source'], name='prog_funding_idx'),
        ]

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

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['status'], name='ngo_stat_idx'),
            models.Index(fields=['primary_program'], name='ngo_prim_prog_idx'),
        ]

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

    class Meta:
        ordering = ['full_name']
        indexes = [
            models.Index(fields=['assigned_program_id'], name='staff_prog_idx'),
            models.Index(fields=['assigned_ngo_id'], name='staff_ngo_idx'),
            models.Index(fields=['status'], name='staff_stat_idx'),
            models.Index(fields=['department'], name='staff_dept_idx'),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.job_title}"


class DevelopmentPartner(models.Model):
    CATEGORY_CHOICES = [
        ('Multilateral', 'Multilateral Development Bank / UN Agency'),
        ('Bilateral', 'Bilateral Development Agency'),
        ('Government Program', 'Government-Led National/Regional Program'),
        ('INGO', 'International Non-Governmental Organization'),
        ('Other', 'Other Development Partner'),
    ]

    partner_id = models.CharField(max_length=50, unique=True) # e.g. DPART-001
    name = models.CharField(max_length=255)
    acronym = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Bilateral')
    country_of_origin = models.CharField(max_length=100, blank=True)
    headquarters = models.CharField(max_length=255, blank=True)
    focal_person = models.CharField(max_length=255, blank=True)
    focal_email = models.EmailField(blank=True)
    focal_phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)
    wash_focus_areas = models.JSONField(default=list, blank=True) # e.g. ['Rural Water', 'Drought Resilience', 'Urban Sanitation']
    supported_clusters = models.JSONField(default=list, blank=True) # e.g. ['Central Oromia', 'Southern Oromia']
    total_financing_commitment_usd = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    status = models.CharField(max_length=50, default='Active')
    official_verification_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['category'], name='dpart_cat_idx'),
            models.Index(fields=['status'], name='dpart_stat_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.acronym or self.category})"


class PartnerDocument(models.Model):
    doc_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=100, default='Evaluation Report') # Project Appraisal, Progress Report, Agreement, Manual
    program_code = models.CharField(max_length=100, blank=True)
    partner_id = models.CharField(max_length=50, blank=True)
    publication_year = models.IntegerField(default=2024)
    file_url = models.CharField(max_length=500, blank=True)
    source_organization = models.CharField(max_length=255, blank=True)
    summary = models.TextField(blank=True)
    verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-publication_year', 'title']

    def __str__(self):
        return f"{self.title} ({self.publication_year})"

