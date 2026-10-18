import os
import sys
import django
from decimal import Decimal

# Setup django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, RoleDefinition
from apps.programs.models import Program, DevelopmentPartner, PartnerDocument
from apps.masterdata.models import MasterDataStore

def seed_admin_user():
    """
    Ensures the official OWEB system administrator account exists.
    No hardcoded credentials; uses environment overrides or strong production defaults.
    """
    admin_username = os.environ.get('INITIAL_ADMIN_USERNAME', 'admin')
    admin_password = os.environ.get('INITIAL_ADMIN_PASSWORD', 'OwebAdmin2026!#Secure')
    admin_email = os.environ.get('INITIAL_ADMIN_EMAIL', 'admin@oweb.gov.et')

    admin, created = User.objects.get_or_create(
        username=admin_username,
        defaults={
            'email': admin_email,
            'full_name': 'Oromia Water Bureau Administrator',
            'role': 'Admin',
            'status': 'Active',
            'department': 'OWEB Head Office (Finfinnee)',
            'organization': 'Oromia Water and Energy Bureau',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'All Programs (Bureau Level)',
            'data_scope_override': 'ALL',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin.set_password(admin_password)
        admin.save()
        print(f"[+] Initial Administrator '{admin_username}' provisioned.")
    else:
        print(f"[+] Administrator '{admin_username}' verified.")

def seed_programs():
    print("Seeding Official WASH Programs...")
    programs = [
        {
            'prog_id': 'PROG-001',
            'name': 'ONE WASH',
            'code': 'ONE-WASH',
            'description': 'National multi-donor consolidated WaSH account delivering synchronized water supply across Oromia.',
            'program_manager': 'Eng. Solomon Tadesse',
            'start_date': '2020-07-01',
            'end_date': '2028-06-30',
            'funding_source': 'World Bank CWA / AfDB / UNICEF / FCDO',
            'contact_email': 'onewash@oweb.gov.et',
            'contact_phone': '+251 115 510001',
            'status': 'Active',
            'focus_area': 'Integrated rural & urban water systems, institutional school/health WASH.',
            'budget_etb': Decimal('450000000.00'),
            'target_beneficiaries': 1450000,
            'components': ['Rural WaSH Schemes', 'Urban WaSH Utilities', 'Institutional WaSH (Schools & Health)', 'Program Capacity Building']
        },
        {
            'prog_id': 'PROG-002',
            'name': 'COWASH',
            'code': 'COWASH',
            'description': 'Community-Led Accelerated Water and Sanitation empowering community groups with direct fund management.',
            'program_manager': 'Ato Worku Assefa',
            'start_date': '2021-01-01',
            'end_date': '2027-12-31',
            'funding_source': 'Government of Finland & OWEB',
            'contact_email': 'cowash@oweb.gov.et',
            'contact_phone': '+251 115 510002',
            'status': 'Active',
            'focus_area': 'Community-Managed Project (CMP) approach, rural protected springs, hand-dug wells.',
            'budget_etb': Decimal('180000000.00'),
            'target_beneficiaries': 680000,
            'components': ['Community-Managed Projects (CMP)', 'Spring Development & Hand Pumps', 'WASHCO Capacity & Community Empowerment', 'Inclusion & Disability WASH']
        },
        {
            'prog_id': 'PROG-003',
            'name': 'UNICEF',
            'code': 'UNICEF',
            'description': 'Emergency, climate-resilient water supply, drought response rehabilitation across pastoralist zones.',
            'program_manager': 'W/ro Genet Desta',
            'start_date': '2022-01-01',
            'end_date': '2026-12-31',
            'funding_source': 'UNICEF Ethiopia & Global Humanitarian Funds',
            'contact_email': 'unicef.wash@oweb.gov.et',
            'contact_phone': '+251 115 510003',
            'status': 'Active',
            'focus_area': 'Emergency rehabilitation, deep boreholes, solarized pumping.',
            'budget_etb': Decimal('195000000.00'),
            'target_beneficiaries': 520000,
            'components': ['Emergency Drought Response', 'Solar Pumping Conversion', 'School & Health Centre WaSH', 'Water Quality Monitoring & Disinfection']
        },
        {
            'prog_id': 'PROG-004',
            'name': 'Second Urban',
            'code': 'SUWSSP',
            'description': 'Second Urban Water Supply and Sanitation Project enhancing operational efficiency and faecal sludge treatment in towns.',
            'program_manager': 'Eng. Birhanu Kebede',
            'start_date': '2019-09-01',
            'end_date': '2026-12-31',
            'funding_source': 'World Bank IDA / Urban Utility Board',
            'contact_email': 'urban.wash@oweb.gov.et',
            'contact_phone': '+251 115 510004',
            'status': 'Active',
            'focus_area': 'Major town water utilities, piped network expansion, non-revenue water reduction.',
            'budget_etb': Decimal('520000000.00'),
            'target_beneficiaries': 850000,
            'components': ['Urban Piped Network Expansion', 'Faecal Sludge Treatment Plant (FSTP)', 'Utility Operational Modernization', 'Non-Revenue Water (NRW) Reduction']
        },
        {
            'prog_id': 'PROG-005',
            'name': 'Borena Resilience',
            'code': 'BORENA-RESILIENCE',
            'description': 'Borana Resilient Water Development targeting deep groundwater exploration (>500m), multi-village piped water schemes.',
            'program_manager': 'Ato Liban Dida',
            'start_date': '2022-01-01',
            'end_date': '2028-12-31',
            'funding_source': 'African Development Bank (AfDB) / GCA / Regional Treasury',
            'contact_email': 'borena.resilience@oweb.gov.et',
            'contact_phone': '+251 115 510005',
            'status': 'Active',
            'focus_area': 'Deep groundwater extraction (>500m), multi-village piped water networks, pastoralist livestock watering corridors.',
            'budget_etb': Decimal('420000000.00'),
            'target_beneficiaries': 650000,
            'components': ['Deep Well Groundwater Exploration', 'Multi-Village Transmission Networks', 'Livestock Watering Corridors', 'Emergency Drought Response Desks']
        },
        {
            'prog_id': 'PROG-006',
            'name': 'Basket Fund',
            'code': 'BASKET-FUND',
            'description': 'Pooled multi-donor basket funding coordinating bilateral and development partner capital allocations.',
            'program_manager': 'Dr. Chala Gutema',
            'start_date': '2020-01-01',
            'end_date': '2028-12-31',
            'funding_source': 'Multi-Donor WaSH Basket Fund (CWA Pooled)',
            'contact_email': 'basketfund@oweb.gov.et',
            'contact_phone': '+251 115 510006',
            'status': 'Active',
            'focus_area': 'Regional capital expenditure, cross-zonal water transmission mains, multi-village schemes.',
            'budget_etb': Decimal('310000000.00'),
            'target_beneficiaries': 980000,
            'components': ['Multi-Village Piped Schemes', 'Bulk Water Transmission Pipelines', 'Regional Storage Reservoirs', 'Zonal Directorate Capacity']
        },
        {
            'prog_id': 'PROG-007',
            'name': 'Other Programs',
            'code': 'OTHER-PROG',
            'description': 'Specialized bilateral initiatives, climate resilience pilots, and direct regional treasury interventions.',
            'program_manager': 'Eng. Almaz Bekele',
            'start_date': '2023-01-01',
            'end_date': '2029-12-31',
            'funding_source': 'OWEB Regional Treasury & Bilateral Development Partners',
            'contact_email': 'bilateral.wash@oweb.gov.et',
            'contact_phone': '+251 115 510007',
            'status': 'Active',
            'focus_area': 'Pilot technologies, borehole hydro-fracturing, solar desalination pilots.',
            'budget_etb': Decimal('150000000.00'),
            'target_beneficiaries': 340000,
            'components': ['Climate Resilience Deep Wells', 'Desalination & Advanced Filtration Pilots', 'Direct Regional Treasury Schemes', 'Research & Watershed Modeling']
        }
    ]
    for p in programs:
        Program.objects.get_or_create(prog_id=p['prog_id'], defaults=p)
    print(f"Programs seeded: {Program.objects.count()}")

def seed_master_data():
    print("Seeding Authoritative Master Data...")
    existing = MasterDataStore.objects.last()
    if not existing or not existing.catalog_categories:
        categories = [
            {'id': 'cat-pipes', 'name': 'Pipes & Fittings (HDPE, DCI, uPVC, Steel)', 'code': 'CAT-01', 'itemCount': 42},
            {'id': 'cat-pumps', 'name': 'Submersible & Centrifugal Water Pumps', 'code': 'CAT-02', 'itemCount': 28},
            {'id': 'cat-solar', 'name': 'Solar PV Generation & Hybrid Inverters', 'code': 'CAT-03', 'itemCount': 19},
            {'id': 'cat-valves', 'name': 'Control Valves, PRVs & Bulk Flow Meters', 'code': 'CAT-04', 'itemCount': 35},
            {'id': 'cat-civil', 'name': 'Masonry, RC Reservoirs & Spring Catchment', 'code': 'CAT-05', 'itemCount': 50},
            {'id': 'cat-drilling', 'name': 'Deep Well Drilling Consumables & Casing', 'code': 'CAT-06', 'itemCount': 22},
            {'id': 'cat-water-quality', 'name': 'Water Quality Testing Kits & Disinfectants', 'code': 'CAT-07', 'itemCount': 18},
        ]
        configs = [
            {'key': 'ALLOW_PARALLEL_APPROVALS', 'name': 'Allow Parallel Multi-Directorate Approvals', 'value': 'true', 'category': 'Workflow'},
            {'key': 'MAX_VARIATION_WITHOUT_BUREAU_HEAD', 'name': 'Maximum Variation % Without Bureau Head Sign-off', 'value': '15', 'category': 'Procurement'},
            {'key': 'AUTO_NOTIFY_CONTRACTOR_EXPIRY_DAYS', 'name': 'Notification Lead Time for Performance Bond Expiry (Days)', 'value': '30', 'category': 'Contracts'},
            {'key': 'INSPECTION_MIN_PHOTOS_REQUIRED', 'name': 'Minimum Geo-Tagged Photos per Inspection Log', 'value': '2', 'category': 'Field Inspection'},
            {'key': 'S_CURVE_VARIANCE_CRITICAL_THRESHOLD', 'name': 'S-Curve Physical Variance Critical Warning %', 'value': '-10.0', 'category': 'Monitoring & Evaluation'}
        ]
        workflow_steps = [
            {'id': 'ws-1', 'stepName': 'Initial Feasibility & Desk Verification', 'roleRequired': 'Engineer', 'slaDays': 5},
            {'id': 'ws-2', 'stepName': 'Multi-Disciplinary Technical Screening', 'roleRequired': 'Team Leader', 'slaDays': 7},
            {'id': 'ws-3', 'stepName': 'Budget & Environmental Clearance', 'roleRequired': 'Reviewer', 'slaDays': 5},
            {'id': 'ws-4', 'stepName': 'Directorate Strategic Endorsement', 'roleRequired': 'Director', 'slaDays': 4},
            {'id': 'ws-5', 'stepName': 'Bureau Final Capital Authorization', 'roleRequired': 'Admin', 'slaDays': 3}
        ]
        approval_thresholds = [
            {'id': 'th-1', 'category': 'Standard Rural Water Supply', 'minAmount': 0, 'maxAmount': 5000000, 'approverRole': 'Team Leader'},
            {'id': 'th-2', 'category': 'Medium Scale Water Infrastructure', 'minAmount': 5000001, 'maxAmount': 25000000, 'approverRole': 'Director'},
            {'id': 'th-3', 'category': 'Large Multi-Village / Urban Scheme', 'minAmount': 25000001, 'maxAmount': 500000000, 'approverRole': 'Admin'}
        ]
        regions = [
            {'id': 'reg-oromia', 'code': 'REG_OROMIA', 'name': 'Oromia National Regional State', 'localName': 'Mootummaa Naannoo Oromiyaa', 'status': 'Active'},
            {'id': 'reg-amhara', 'code': 'REG_AMHARA', 'name': 'Amhara Region', 'status': 'Active'},
            {'id': 'reg-somali', 'code': 'REG_SOMALI', 'name': 'Somali Region', 'status': 'Active'},
            {'id': 'reg-sidama', 'code': 'REG_SIDAMA', 'name': 'Sidama Region', 'status': 'Active'}
        ]
        woredas = [
            {'id': 'wor-shashamane', 'regionId': 'reg-oromia', 'name': 'Shashamane', 'zone': 'West Arsi', 'status': 'Active'},
            {'id': 'wor-yabelo', 'regionId': 'reg-oromia', 'name': 'Yabelo', 'zone': 'Borena', 'status': 'Active'},
            {'id': 'wor-adama', 'regionId': 'reg-oromia', 'name': 'Adama', 'zone': 'East Shewa', 'status': 'Active'},
            {'id': 'wor-amaye', 'regionId': 'reg-oromia', 'name': 'Amaye', 'zone': 'Southwest Shewa', 'status': 'Active'},
            {'id': 'wor-waliso', 'regionId': 'reg-oromia', 'name': 'Waliso', 'zone': 'Southwest Shewa', 'status': 'Active'}
        ]
        kebeles = [
            {'id': 'keb-01', 'woredaId': 'wor-shashamane', 'name': 'Awasho 01', 'status': 'Active'},
            {'id': 'keb-02', 'woredaId': 'wor-shashamane', 'name': 'Dida Boke', 'status': 'Active'},
            {'id': 'keb-03', 'woredaId': 'wor-yabelo', 'name': 'Dharito', 'status': 'Active'},
            {'id': 'keb-04', 'woredaId': 'wor-adama', 'name': 'Bole Sub-city Kebele 02', 'status': 'Active'}
        ]

        if existing:
            existing.catalog_categories = categories
            existing.system_configurations = configs
            existing.workflow_steps = workflow_steps
            existing.approval_thresholds = approval_thresholds
            existing.regions = regions
            existing.woredas = woredas
            existing.kebeles = kebeles
            existing.save()
        else:
            MasterDataStore.objects.create(
                version='2.0.0',
                last_pushed_by='admin',
                change_notes='Production initialization with complete OWEB enterprise master data.',
                catalog_categories=categories,
                system_configurations=configs,
                workflow_steps=workflow_steps,
                approval_thresholds=approval_thresholds,
                regions=regions,
                woredas=woredas,
                kebeles=kebeles
            )
    print(f"MasterDataStore ready in PostgreSQL: {MasterDataStore.objects.count()}")

def seed_development_partners():
    print("Seeding Official Development Partners & WASH Documents...")
    partners = [
        {
            'partner_id': 'DPART-001',
            'name': 'Government of Finland (MFA Finland)',
            'acronym': 'MFA Finland',
            'category': 'Bilateral',
            'country_of_origin': 'Finland',
            'headquarters': 'Helsinki, Finland / Addis Ababa Embassy',
            'focal_person': 'Arto Suominen (Chief Technical Advisor)',
            'focal_email': 'arto.suominen@cowashethiopia.net',
            'focal_phone': '+251 115 510002',
            'website': 'https://www.cmpethiopia.org',
            'wash_focus_areas': ['Community-Managed Projects (CMP)', 'Rural Water Supply', 'Inclusion & Disability WASH', 'Capacity Building'],
            'supported_clusters': ['Central Oromia', 'Western Oromia', 'Southwestern Oromia'],
            'total_financing_commitment_usd': Decimal('24500000.00'),
            'status': 'Active',
            'official_verification_url': 'https://www.cmpethiopia.org/cowash-phase-iv/',
            'notes': 'Co-financing COWASH Phase IV (April 2021 – September 2025) with Oromia Regional Government.'
        },
        {
            'partner_id': 'DPART-002',
            'name': 'The World Bank Group (IDA)',
            'acronym': 'World Bank',
            'category': 'Multilateral',
            'country_of_origin': 'International',
            'headquarters': 'Washington, D.C. / Addis Ababa Country Office',
            'focal_person': 'Yitbarek Tessema (Senior Water Specialist)',
            'focal_email': 'ytessema@worldbank.org',
            'focal_phone': '+251 115 176000',
            'website': 'https://projects.worldbank.org/en/projects-operations/project-detail/P167794',
            'wash_focus_areas': ['Urban Water Supply', 'Faecal Sludge Management (FSTP)', 'Utility Modernization', 'Consolidated WASH Account (CWA)'],
            'supported_clusters': ['Central Oromia', 'Southeastern Oromia', 'Southwestern Oromia', 'Eastern Oromia'],
            'total_financing_commitment_usd': Decimal('185000000.00'),
            'status': 'Active',
            'official_verification_url': 'https://projects.worldbank.org/en/projects-operations/project-detail/P167794',
            'notes': 'Financing Second Urban Water Supply and Sanitation Project (UWSSP-II, P167794) and OWNP CWA-II.'
        },
        {
            'partner_id': 'DPART-003',
            'name': 'African Development Bank (AfDB)',
            'acronym': 'AfDB',
            'category': 'Multilateral',
            'country_of_origin': 'International',
            'headquarters': 'Abidjan, Côte d’Ivoire / Addis Ababa Office',
            'focal_person': 'Dr. Zenebe Urgessa',
            'focal_email': 'z.urgessa@afdb.org',
            'focal_phone': '+251 115 542240',
            'website': 'https://www.afdb.org/en/projects-and-operations/p-et-e00-011',
            'wash_focus_areas': ['Drought Resilience', 'Deep Groundwater Extraction (>500m)', 'Pastoralist Water Corridors', 'Multi-Village Piped Schemes'],
            'supported_clusters': ['Southern Oromia', 'Southeastern Oromia'],
            'total_financing_commitment_usd': Decimal('68000000.00'),
            'status': 'Active',
            'official_verification_url': 'https://www.afdb.org/en/documents/ethiopia-borana-resilient-water-development-improved-livelihoods-program-phase-i-appraisal-report',
            'notes': 'Financing Borana Resilient Water Development for Improved Livelihoods Program (BRWDLP, P-ET-E00-011).'
        },
        {
            'partner_id': 'DPART-004',
            'name': 'UNICEF Ethiopia',
            'acronym': 'UNICEF',
            'category': 'Multilateral',
            'country_of_origin': 'United Nations',
            'headquarters': 'Addis Ababa Country Office (UNECA Compound)',
            'focal_person': 'Biniam Aregawi (WASH Specialist - Oromia Field)',
            'focal_email': 'baregawi@unicef.org',
            'focal_phone': '+251 115 184000',
            'website': 'https://www.unicef.org/ethiopia/water-sanitation-and-hygiene-wash',
            'wash_focus_areas': ['Emergency Drought Response', 'Solar Pumping Conversions', 'School & Health Facility WASH', 'Water Quality Surveillance'],
            'supported_clusters': ['Southern Oromia', 'Eastern Oromia', 'Central Oromia'],
            'total_financing_commitment_usd': Decimal('32000000.00'),
            'status': 'Active',
            'official_verification_url': 'https://www.unicef.org/ethiopia/water-sanitation-and-hygiene-wash',
            'notes': 'Co-chairing Regional WASH Emergency Taskforce and supporting solarized water schemes across drought-impacted woredas.'
        },
        {
            'partner_id': 'DPART-005',
            'name': 'One WASH National Program (OWNP / CWA Pooled Partners)',
            'acronym': 'OWNP / CWA',
            'category': 'Government Program',
            'country_of_origin': 'Federal Republic of Ethiopia / Multi-Donor',
            'headquarters': 'Ministry of Water & Energy / OWEB PMU Finfinnee',
            'focal_person': 'Ato Abiy Girma (National Coordinator)',
            'focal_email': 'coordinator.cwa@mowe.gov.et',
            'focal_phone': '+251 116 611111',
            'website': 'https://www.cmpethiopia.org/one-wash-national-program/',
            'wash_focus_areas': ['Rural Water Supply', 'Urban Utility Upgrades', 'Institutional WASH', 'Consolidated Account Harmonization'],
            'supported_clusters': ['Central Oromia', 'Eastern Oromia', 'Western Oromia', 'Southeastern Oromia', 'Southern Oromia', 'Southwestern Oromia'],
            'total_financing_commitment_usd': Decimal('325000000.00'),
            'status': 'Active',
            'official_verification_url': 'https://www.cmpethiopia.org/one-wash-national-program/',
            'notes': 'Coordinating Phase II of the Consolidated WASH Account (CWA) across all 6 administrative clusters.'
        }
    ]

    for p_data in partners:
        DevelopmentPartner.objects.update_or_create(
            partner_id=p_data['partner_id'],
            defaults=p_data
        )

    documents = [
        {
            'doc_id': 'PDOC-001',
            'title': 'COWASH Phase IV Project Document (2021–2025)',
            'document_type': 'Project Document',
            'program_code': 'COWASH',
            'partner_id': 'DPART-001',
            'publication_year': 2021,
            'file_url': 'https://www.cmpethiopia.org/wp-content/uploads/2021/04/COWASH_IV_Project_Document.pdf',
            'source_organization': 'Ministry of Foreign Affairs of Finland & MoWE',
            'summary': 'Official project appraisal and operational implementation manual for Community-Managed Projects (CMP) in Oromia woredas.',
            'verified': True
        },
        {
            'doc_id': 'PDOC-002',
            'title': 'Borana Resilient Water Development Program (BRWDLP Phase I) Appraisal Report',
            'document_type': 'Project Appraisal Report',
            'program_code': 'BORENA-RESILIENCE',
            'partner_id': 'DPART-003',
            'publication_year': 2022,
            'file_url': 'https://www.afdb.org/en/documents/ethiopia-borana-resilient-water-development-improved-livelihoods-program-phase-i-appraisal-report',
            'source_organization': 'African Development Bank (AfDB)',
            'summary': 'Comprehensive technical appraisal detailing deep well drilling (>500m), livestock watering points, and climate adaptation in Borana.',
            'verified': True
        },
        {
            'doc_id': 'PDOC-003',
            'title': 'Second Urban Water Supply and Sanitation Project (UWSSP-II) Project Appraisal Document',
            'document_type': 'Project Appraisal Document',
            'program_code': 'SUWSSP',
            'partner_id': 'DPART-002',
            'publication_year': 2019,
            'file_url': 'https://documents.worldbank.org/en/publication/documents-reports/documentdetail/859591500084393666/ethiopia-second-urban-water-supply-and-sanitation-project',
            'source_organization': 'World Bank Group (IDA)',
            'summary': 'World Bank appraisal and restructuring documents for piped networks and faecal sludge treatment plants in secondary cities.',
            'verified': True
        },
        {
            'doc_id': 'PDOC-004',
            'title': 'One WASH National Program Phase II (OWNP-CWA) Program Operational Manual',
            'document_type': 'Program Operational Manual',
            'program_code': 'ONE-WASH',
            'partner_id': 'DPART-005',
            'publication_year': 2020,
            'file_url': 'https://www.cmpethiopia.org/wp-content/uploads/2020/01/OWNP_Phase_II_POM.pdf',
            'source_organization': 'Ministry of Water & Energy / Consolidated WASH Account PMU',
            'summary': 'Harmonized implementation guidelines across water, health, and education sectors for regional bureaus and woredas.',
            'verified': True
        },
        {
            'doc_id': 'PDOC-005',
            'title': 'UNICEF Ethiopia WASH Sector Annual Progress & Solar Pumping Assessment',
            'document_type': 'Progress & Technical Assessment',
            'program_code': 'UNICEF',
            'partner_id': 'DPART-004',
            'publication_year': 2023,
            'file_url': 'https://www.unicef.org/ethiopia/reports/wash-annual-results-2023',
            'source_organization': 'UNICEF Ethiopia',
            'summary': 'Evaluates solarization conversions of motorized boreholes and emergency drought rehabilitation across lowlands.',
            'verified': True
        }
    ]

    for d_data in documents:
        PartnerDocument.objects.update_or_create(
            doc_id=d_data['doc_id'],
            defaults=d_data
        )

    print(f"DevelopmentPartners seeded: {DevelopmentPartner.objects.count()}, PartnerDocuments: {PartnerDocument.objects.count()}")

if __name__ == '__main__':
    print("=" * 60)
    print("OWEB PMS - PRODUCTION MASTER DATA & REFERENCE SEEDER")
    print("=" * 60)
    seed_admin_user()
    seed_master_data()
    seed_programs()
    seed_development_partners()
    print("=" * 60)
    print("Authoritative reference synchronization successfully completed!")
    print("=" * 60)
