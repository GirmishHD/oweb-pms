import os
import sys
import django
from decimal import Decimal
from datetime import datetime

# Setup django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, RoleDefinition
from apps.programs.models import Program, NGO, Staff
from apps.projects.models import Project
from apps.procurement.models import Procurement
from apps.contracts.models import Contract
from apps.inspections.models import FieldInspectionLog
from apps.tracking.models import WeeklyWorkPlan, WeeklyProgressReport
from apps.masterdata.models import MasterDataStore

def seed_users():
    print("Seeding Users...")
    users_data = [
        {
            'username': 'admin',
            'full_name': 'Girma Worku',
            'email': 'gworku3654@gmail.com',
            'phone': '+251 91 123 4567',
            'role': 'Admin',
            'secondary_roles': ['Director'],
            'status': 'Active',
            'department': 'OWEB Head Office (Finfinnee)',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'All Programs (Bureau Level)',
            'data_scope_override': 'ALL',
            'avatar': 'https://ui-avatars.com/api/?name=Girma+Worku&background=6366F1&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'director_chaltu',
            'full_name': 'Dr. Chaltu Desta',
            'email': 'chaltu.desta@oweb.gov.et',
            'phone': '+251 93 456 7890',
            'role': 'Director',
            'status': 'Active',
            'department': 'Water Supply & Sanitation Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'All Programs (Bureau Level)',
            'data_scope_override': 'ALL',
            'avatar': 'https://ui-avatars.com/api/?name=Chaltu+Desta&background=0f766e&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'coordinator_kenenisa',
            'full_name': 'Kenenisa Bekele',
            'email': 'kenenisa.bekele@oweb.gov.et',
            'phone': '+251 92 111 2233',
            'role': 'Coordinator',
            'status': 'Active',
            'department': 'Project Implementation Unit (PIU)',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'All Programs (Bureau Level)',
            'data_scope_override': 'ALL',
            'avatar': 'https://ui-avatars.com/api/?name=Kenenisa+Bekele&background=0284c7&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'team_leader_tigist',
            'full_name': 'Eng. Tigist Mengistu',
            'email': 'tigist.mengistu@oweb.gov.et',
            'phone': '+251 91 444 5566',
            'role': 'Team Leader',
            'status': 'Active',
            'department': 'Study & Design Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_team': 'Water Supply Team A (East Shewa & Arsi)',
            'assigned_zone': 'East Shewa',
            'assigned_program': 'ONE WASH (OWNP)',
            'assigned_project_ids': ['OWEB-WAT-2025-0001', 'OWEB-SAN-2025-0003', 'OWEB-WAT-2024-0022'],
            'data_scope_override': 'TEAM',
            'avatar': 'https://ui-avatars.com/api/?name=Tigist+Mengistu&background=7c3aed&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'engineer_dawit',
            'full_name': 'Eng. Dawit Alemu',
            'email': 'dawit.alemu@oweb.gov.et',
            'phone': '+251 92 777 8899',
            'role': 'Engineer',
            'status': 'Active',
            'department': 'Water Supply & Sanitation Directorate',
            'organization': 'Zonal Water Resource Bureau',
            'assigned_team': 'Water Supply Team A (East Shewa & Arsi)',
            'assigned_zone': 'West Arsi',
            'assigned_program': 'Second Urban (UWSSP-II)',
            'assigned_project_ids': ['OWEB-WAT-2025-0001', 'OWEB-WAT-2025-0002'],
            'data_scope_override': 'ASSIGNED_PROJECTS',
            'avatar': 'https://ui-avatars.com/api/?name=Dawit+Alemu&background=d97706&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'testuser',
            'full_name': 'Tolasa Bekele',
            'email': 'tolasa.bekele@oweb.gov.et',
            'phone': '+251 92 345 6789',
            'role': 'Engineer',
            'secondary_roles': ['User'],
            'status': 'Active',
            'department': 'Study & Design Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_team': 'Water Supply Team A (East Shewa & Arsi)',
            'assigned_zone': 'West Arsi',
            'assigned_program': 'COWASH',
            'assigned_project_ids': ['OWEB-WAT-2025-0001', 'OWEB-WAT-2025-0030'],
            'data_scope_override': 'ASSIGNED_PROJECTS',
            'avatar': 'https://ui-avatars.com/api/?name=Tolasa+Bekele&background=2563eb&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'supervisor',
            'full_name': 'Eng. Hawi Kebede',
            'email': 'hawi.kebede@oweb.gov.et',
            'phone': '+251 96 789 0123',
            'role': 'Supervisor',
            'status': 'Active',
            'department': 'Zonal Water Resource Bureau',
            'organization': 'Zonal Water Resource Bureau',
            'assigned_team': 'Hydrogeology & Drilling Squad',
            'assigned_zone': 'Bale',
            'assigned_program': 'Borena Resilient Program',
            'assigned_project_ids': ['OWEB-SAN-2024-0015', 'OWEB-WAT-2024-0022', 'OWEB-WAT-2024-0041'],
            'data_scope_override': 'ASSIGNED_PROJECTS',
            'avatar': 'https://ui-avatars.com/api/?name=Hawi+Kebede&background=0284c7&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'manager',
            'full_name': 'Eng. Solomon Tadesse',
            'email': 'solomon.tadesse@oweb.gov.et',
            'phone': '+251 95 678 9012',
            'role': 'Contract Manager',
            'status': 'Active',
            'department': 'Contract Administration Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'Second Urban (UWSSP-II)',
            'data_scope_override': 'ASSIGNED_CONTRACTS',
            'avatar': 'https://ui-avatars.com/api/?name=Solomon+Tadesse&background=e11d48&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'procurement',
            'full_name': 'Abdi Gemechu',
            'email': 'abdi.gemechu@oweb.gov.et',
            'phone': '+251 94 567 8901',
            'role': 'Procurement',
            'status': 'Active',
            'department': 'Procurement & Property Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'All Programs (Bureau Level)',
            'data_scope_override': 'ORGANIZATION',
            'avatar': 'https://ui-avatars.com/api/?name=Abdi+Gemechu&background=f59e0b&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'reviewer',
            'full_name': 'Dr. Chaltu Reviewer',
            'email': 'reviewer.desta@oweb.gov.et',
            'phone': '+251 93 456 7891',
            'role': 'Reviewer',
            'status': 'Active',
            'department': 'Environmental & Social Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'ONE WASH (OWNP)',
            'data_scope_override': 'ORGANIZATION',
            'avatar': 'https://ui-avatars.com/api/?name=Chaltu+Reviewer&background=10b981&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'finance_tadesse',
            'full_name': 'Fikadu Tadesse',
            'email': 'fikadu.tadesse@oweb.gov.et',
            'phone': '+251 91 333 4455',
            'role': 'Finance Officer',
            'status': 'Active',
            'department': 'Finance & Budget Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'data_scope_override': 'ORGANIZATION',
            'avatar': 'https://ui-avatars.com/api/?name=Fikadu+Tadesse&background=15803d&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'planner_tolasa',
            'full_name': 'Gudeta Feyisa',
            'email': 'gudeta.feyisa@oweb.gov.et',
            'phone': '+251 91 666 7788',
            'role': 'Planning Officer',
            'status': 'Active',
            'department': 'Study & Design Directorate',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'data_scope_override': 'ORGANIZATION',
            'avatar': 'https://ui-avatars.com/api/?name=Gudeta+Feyisa&background=0369a1&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'me_galgalo',
            'full_name': 'Galgalo Boru',
            'email': 'galgalo.boru@oweb.gov.et',
            'phone': '+251 92 888 9900',
            'role': 'Monitoring & Evaluation Officer',
            'status': 'Active',
            'department': 'Project Implementation Unit (PIU)',
            'organization': 'OWEB Head Office (Finfinnee)',
            'assigned_zone': 'All Zones (Regional)',
            'data_scope_override': 'ORGANIZATION',
            'avatar': 'https://ui-avatars.com/api/?name=Galgalo+Boru&background=4338ca&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'partner_unicef',
            'full_name': 'Sarah Jenkins',
            'email': 'sjenkins@unicef.org',
            'phone': '+251 91 999 0011',
            'role': 'NGO/Partner Member',
            'status': 'Active',
            'department': 'Donor / Partner Representative',
            'organization': 'UNICEF WaSH Sector Support',
            'partner_organization': 'UNICEF',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'ONE WASH (OWNP)',
            'data_scope_override': 'PARTNER_ORGANIZATION',
            'avatar': 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=4f46e5&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'auditor',
            'full_name': 'Merga Feyisa',
            'email': 'merga.feyisa@donor-audit.org',
            'phone': '+251 97 890 1234',
            'role': 'Auditor',
            'status': 'Active',
            'department': 'Regional Audit & Integrity Bureau',
            'organization': 'Regional Audit & Integrity Bureau',
            'assigned_zone': 'All Zones (Regional)',
            'assigned_program': 'All Programs (Bureau Level)',
            'data_scope_override': 'ALL',
            'avatar': 'https://ui-avatars.com/api/?name=Merga+Feyisa&background=7c3aed&color=fff&bold=true',
            'password': 'password'
        },
        {
            'username': 'viewer_obsa',
            'full_name': 'Obsa Bekele',
            'email': 'obsa.bekele@guest.gov.et',
            'phone': '+251 91 222 3344',
            'role': 'Viewer',
            'status': 'Active',
            'department': 'Urban Water Utility Enterprise',
            'organization': 'Urban Water Utility Enterprise',
            'assigned_zone': 'East Shewa',
            'data_scope_override': 'ORGANIZATION',
            'avatar': 'https://ui-avatars.com/api/?name=Obsa+Bekele&background=64748b&color=fff&bold=true',
            'password': 'password'
        }
    ]

    for ud in users_data:
        pwd = ud.pop('password')
        u, created = User.objects.get_or_create(username=ud['username'], defaults=ud)
        u.set_password(pwd)
        u.is_staff = (u.role in ['Admin', 'Director'])
        u.is_superuser = (u.role == 'Admin')
        u.save()
    print(f"Users seeded: {User.objects.count()}")

def seed_programs():
    print("Seeding Programs...")
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

def seed_ngos():
    print("Seeding NGOs...")
    ngos = [
        {
            'ngo_id': 'NGO-001',
            'name': 'WaterAid Ethiopia (Oromia Regional Chapter)',
            'code': 'NGO-WAE',
            'registration_number': 'FDRE-CSO-1082',
            'contact_person': 'Ato Abebe Tadesse',
            'phone': '+251 911 234567',
            'email': 'abebe.tadesse@wateraid.org',
            'address': 'Bole Subcity / Adama Regional Field Hub',
            'operating_area': 'East Shewa, Arsi, West Hararghe',
            'assigned_program_ids': ['ONE-WASH', 'OTHER-PROG'],
            'assigned_program_names': ['ONE WASH', 'Other Programs'],
            'assigned_project_ids': ['OWEB-WAT-2025-0001', 'OWEB-WAT-2024-0012'],
            'status': 'Active'
        },
        {
            'ngo_id': 'NGO-002',
            'name': 'Plan International Ethiopia',
            'code': 'NGO-PLAN',
            'registration_number': 'FDRE-CSO-0419',
            'contact_person': 'W/ro Tigist Hailu',
            'phone': '+251 912 345678',
            'email': 'tigist.hailu@plan-international.org',
            'address': 'Kirkos / Jimma Zonal Operations Centre',
            'operating_area': 'Jimma, Illubabor, Kelam Welega',
            'assigned_program_ids': ['COWASH', 'UNICEF'],
            'assigned_program_names': ['COWASH', 'UNICEF'],
            'assigned_project_ids': ['OWEB-WAT-2024-0022'],
            'status': 'Active'
        },
        {
            'ngo_id': 'NGO-003',
            'name': 'International Rescue Committee (IRC)',
            'code': 'NGO-IRC',
            'registration_number': 'FDRE-CSO-0328',
            'contact_person': 'Ato Getachew Molla',
            'phone': '+251 913 456789',
            'email': 'getachew.molla@rescue.org',
            'address': 'Yabelo Field Base & Negele Guji Sub-hub',
            'operating_area': 'Borena, Guji, West Guji',
            'assigned_program_ids': ['BORENA-RESILIENCE', 'UNICEF'],
            'assigned_program_names': ['Borena Resilience', 'UNICEF'],
            'assigned_project_ids': ['OWEB-WAT-2024-0041'],
            'status': 'Active'
        }
    ]
    for n in ngos:
        NGO.objects.get_or_create(ngo_id=n['ngo_id'], defaults=n)
    print(f"NGOs seeded: {NGO.objects.count()}")

def seed_staff():
    print("Seeding Staff...")
    staff_members = [
        {
            'staff_id': 'STF-001',
            'staff_code': 'STF-OW-01',
            'full_name': 'Eng. Solomon Tadesse',
            'job_title': 'Senior WaSH Project Engineer',
            'department': 'Study & Design Directorate',
            'phone': '+251 911 234567',
            'email': 'solomon.tadesse@oweb.gov.et',
            'assigned_program_id': 'ONE-WASH',
            'assigned_program_name': 'ONE WASH',
            'assigned_project_ids': ['OWEB-WAT-2025-0001', 'OWEB-SAN-2024-0015'],
            'supervisor_name': 'Dr. Chaltu Desta',
            'employment_start_date': '2021-02-01',
            'status': 'Active',
            'linked_user_id': '8'
        },
        {
            'staff_id': 'STF-002',
            'staff_code': 'STF-CO-02',
            'full_name': 'Ato Worku Assefa',
            'job_title': 'CMP Community Water Specialist',
            'department': 'Community Management Unit',
            'phone': '+251 912 345678',
            'email': 'worku.assefa@oweb.gov.et',
            'assigned_program_id': 'COWASH',
            'assigned_program_name': 'COWASH',
            'assigned_ngo_id': 'NGO-002',
            'assigned_ngo_name': 'Plan International Ethiopia',
            'assigned_project_ids': ['OWEB-WAT-2024-0022'],
            'supervisor_name': 'Eng. Birhanu Kebede',
            'employment_start_date': '2022-04-15',
            'status': 'Active'
        },
        {
            'staff_id': 'STF-003',
            'staff_code': 'STF-UN-03',
            'full_name': 'W/ro Genet Desta',
            'job_title': 'Emergency WaSH & Rapid Response Coordinator',
            'department': 'Emergency & Drought Directorate',
            'phone': '+251 913 456789',
            'email': 'genet.desta@oweb.gov.et',
            'assigned_program_id': 'UNICEF',
            'assigned_program_name': 'UNICEF',
            'assigned_project_ids': ['OWEB-SAN-2024-0015'],
            'supervisor_name': 'Dr. Chaltu Desta',
            'employment_start_date': '2022-06-01',
            'status': 'Active'
        }
    ]
    for s in staff_members:
        Staff.objects.get_or_create(staff_id=s['staff_id'], defaults=s)
    print(f"Staff seeded: {Staff.objects.count()}")

def seed_projects():
    print("Seeding Projects...")
    projects = [
        {
            'project_id': 'OWEB-WAT-2025-0001',
            'name': 'Shashamane Town Water Expansion',
            'program': 'Second Urban (UWSSP-II)',
            'program_component': 'Urban Piped Network Expansion',
            'region': 'Oromia',
            'zone': 'West Arsi',
            'woreda': 'Shashamane',
            'kebele': 'Kebele 03',
            'gps_coordinates': {'lat': 7.1002, 'long': 38.6031},
            'elevation': 1900,
            'project_type': 'Water Supply',
            'project_sub_type': 'Urban Piped System',
            'source_of_water': 'Borehole',
            'energy_source': 'Grid',
            'type_of_intervention': 'Expansion',
            'population_coverage': 12000,
            'daily_demand_estimate': 180000,
            'storage_requirement': 200000,
            'pipe_length_estimation': 15,
            'implementing_body': 'Utility',
            'washco_exists': True,
            'washco_details': '5 Members',
            'land_ownership_cleared': True,
            'power_source_available': True,
            'skilled_operators_available': True,
            'estimated_budget': Decimal('5000000.00'),
            'funding_source': 'OWEB',
            'community_contribution': 'Labor, 200,000 ETB',
            'environmental_risk_level': 'Medium',
            'source_reliability': 'Reliable',
            'conflict_over_source': False,
            'feasibility_study_conducted': True,
            'feasibility_consultant': 'ABC Engineering PLC',
            'feasibility_study_date': '2025-07-20',
            'eia_conducted': True,
            'eia_consultant': 'Ethio Environ Consult',
            'eia_approval_date': '2025-07-15',
            'status': 'Approved',
            'creator': 'testuser',
            'assigned_engineer_id': 'testuser',
            'assigned_engineer_name': 'Tolasa Bekele',
            'assigned_supervisor_id': 'supervisor',
            'assigned_supervisor_name': 'Eng. Hawi Kebede',
            'assigned_team_leader_id': 'team_leader_tigist',
            'assigned_team': 'Water Supply Team A (East Shewa & Arsi)',
            'planned_start_date': '2025-03-01',
            'planned_completion_date': '2026-01-30',
            'actual_start_date': '2025-03-20',
            'summary': 'This project aims to expand the existing water supply system in Shashamane town, covering an additional 12,000 people. It involves constructing new boreholes and extending the pipe network by 15km. The total estimated budget is 5,000,000 ETB, funded by OWEB.'
        },
        {
            'project_id': 'OWEB-SAN-2024-0015',
            'name': 'Bale Zone Waste Management',
            'program': 'ONE WASH (OWNP)',
            'program_component': 'Rural WaSH Schemes',
            'region': 'Oromia',
            'zone': 'Bale',
            'woreda': 'Goba',
            'kebele': 'Kebele 01',
            'gps_coordinates': {'lat': 7.13, 'long': 40.0},
            'elevation': 2200,
            'project_type': 'Sanitation',
            'project_sub_type': 'Waste Management System',
            'type_of_intervention': 'New',
            'population_coverage': 50000,
            'daily_demand_estimate': 0,
            'storage_requirement': 0,
            'pipe_length_estimation': 0,
            'implementing_body': 'UNICEF',
            'washco_exists': False,
            'land_ownership_cleared': True,
            'power_source_available': False,
            'skilled_operators_available': True,
            'estimated_budget': Decimal('8000000.00'),
            'funding_source': 'UNICEF',
            'community_contribution': 'Land',
            'environmental_risk_level': 'High',
            'source_reliability': 'N/A',
            'conflict_over_source': False,
            'feasibility_study_conducted': True,
            'eia_conducted': True,
            'status': 'Approved',
            'creator': 'admin',
            'assigned_engineer_id': 'admin',
            'assigned_engineer_name': 'Girma Worku',
            'assigned_supervisor_id': 'supervisor',
            'assigned_supervisor_name': 'Eng. Hawi Kebede',
            'partner_organization': 'UNICEF',
            'planned_start_date': '2024-11-01',
            'planned_completion_date': '2025-10-31',
            'actual_start_date': '2024-12-01'
        },
        {
            'project_id': 'OWEB-WAT-2025-0002',
            'name': 'Jimma Solar Water Pump',
            'program': 'COWASH',
            'program_component': 'Community-Managed Projects (CMP)',
            'region': 'Oromia',
            'zone': 'Jimma',
            'woreda': 'Goma',
            'kebele': 'Kebele 10',
            'gps_coordinates': {'lat': 7.67, 'long': 36.83},
            'elevation': 1780,
            'project_type': 'Water Supply',
            'project_sub_type': 'Solar-Powered Rural Scheme',
            'type_of_intervention': 'New',
            'population_coverage': 2500,
            'daily_demand_estimate': 50000,
            'storage_requirement': 75000,
            'pipe_length_estimation': 5,
            'implementing_body': 'OWEB',
            'estimated_budget': Decimal('2500000.00'),
            'funding_source': 'World Bank',
            'community_contribution': '',
            'environmental_risk_level': 'Low',
            'source_reliability': 'Moderate',
            'conflict_over_source': False,
            'status': 'Draft',
            'creator': 'testuser',
            'assigned_engineer_id': 'engineer_dawit',
            'assigned_engineer_name': 'Eng. Dawit Alemu',
            'assigned_supervisor_id': 'manager',
            'assigned_supervisor_name': 'Eng. Solomon Tadesse',
            'assigned_team_leader_id': 'team_leader_tigist',
            'assigned_team': 'Water Supply Team A (East Shewa & Arsi)',
            'planned_start_date': '2025-09-01',
            'planned_completion_date': '2026-06-30'
        },
        {
            'project_id': 'OWEB-SAN-2025-0003',
            'name': 'Adama Urban Sanitation Upgrade',
            'program': 'Second Urban (UWSSP-II)',
            'program_component': 'Faecal Sludge Treatment Plant (FSTP)',
            'region': 'Oromia',
            'zone': 'East Shewa',
            'woreda': 'Adama',
            'kebele': 'Kebele 05',
            'gps_coordinates': {'lat': 8.54, 'long': 39.27},
            'elevation': 1712,
            'project_type': 'Sanitation',
            'project_sub_type': 'Public Toilet Construction',
            'type_of_intervention': 'Rehabilitation',
            'population_coverage': 25000,
            'daily_demand_estimate': 0,
            'storage_requirement': 0,
            'pipe_length_estimation': 0,
            'implementing_body': 'Utility',
            'estimated_budget': Decimal('3500000.00'),
            'funding_source': 'Government',
            'community_contribution': '150,000 ETB',
            'environmental_risk_level': 'Medium',
            'source_reliability': 'N/A',
            'conflict_over_source': False,
            'status': 'Approved',
            'creator': 'admin',
            'planned_start_date': '2025-05-01',
            'planned_completion_date': '2026-02-28',
            'actual_start_date': '2025-05-20'
        },
        {
            'project_id': 'OWEB-WAT-2024-0018',
            'name': 'North Shewa Multi-Village Gravity Water Scheme',
            'program': 'COWASH',
            'program_component': 'Community-Managed Projects (CMP)',
            'region': 'Oromia',
            'zone': 'North Shewa',
            'woreda': 'Fiche',
            'kebele': 'Rural Kebele 2',
            'gps_coordinates': {'lat': 9.8, 'long': 38.73},
            'elevation': 2700,
            'project_type': 'Water Supply',
            'project_sub_type': 'Multi-Village Gravity Scheme',
            'type_of_intervention': 'New',
            'population_coverage': 38500,
            'daily_demand_estimate': 460000,
            'storage_requirement': 500000,
            'pipe_length_estimation': 32,
            'implementing_body': 'OWEB',
            'estimated_budget': Decimal('150000000.00'),
            'funding_source': 'World Bank',
            'community_contribution': 'Community labor and quarry stone collection',
            'environmental_risk_level': 'Low',
            'source_reliability': 'Reliable',
            'conflict_over_source': False,
            'status': 'Completed',
            'creator': 'admin',
            'planned_start_date': '2024-04-01',
            'planned_completion_date': '2025-06-30',
            'actual_start_date': '2024-05-01',
            'actual_completion_date': '2025-06-25'
        },
        {
            'project_id': 'OWEB-WAT-2024-0022',
            'name': 'Asella Multi-Village Gravity Scheme',
            'program': 'ONE WASH (OWNP)',
            'program_component': 'Rural WaSH Schemes',
            'region': 'Oromia',
            'zone': 'Arsi',
            'woreda': 'Tiyo',
            'kebele': 'Asella Zuria',
            'gps_coordinates': {'lat': 7.95, 'long': 39.12},
            'elevation': 2430,
            'project_type': 'Water Supply',
            'project_sub_type': 'Urban Piped System',
            'type_of_intervention': 'Expansion',
            'population_coverage': 35000,
            'daily_demand_estimate': 450000,
            'storage_requirement': 500000,
            'pipe_length_estimation': 28,
            'implementing_body': 'OWEB',
            'estimated_budget': Decimal('18500000.00'),
            'funding_source': 'World Bank',
            'community_contribution': '500,000 ETB',
            'environmental_risk_level': 'Medium',
            'source_reliability': 'Reliable',
            'conflict_over_source': False,
            'status': 'Approved',
            'creator': 'admin',
            'planned_start_date': '2024-07-15',
            'planned_completion_date': '2025-11-30',
            'actual_start_date': '2024-08-01'
        },
        {
            'project_id': 'OWEB-WAT-2025-0030',
            'name': 'Ambo Rural Water Supply Project',
            'program': 'COWASH',
            'program_component': 'Community-Managed Projects (CMP)',
            'region': 'Oromia',
            'zone': 'West Shewa',
            'woreda': 'Ambo',
            'kebele': 'Awaro',
            'gps_coordinates': {'lat': 8.98, 'long': 37.85},
            'elevation': 2100,
            'project_type': 'Water Supply',
            'project_sub_type': 'Solar-Powered Rural Scheme',
            'type_of_intervention': 'New',
            'population_coverage': 8500,
            'daily_demand_estimate': 120000,
            'storage_requirement': 150000,
            'pipe_length_estimation': 8,
            'implementing_body': 'Cowash',
            'estimated_budget': Decimal('6200000.00'),
            'funding_source': 'Government',
            'community_contribution': 'Labor & Local materials',
            'environmental_risk_level': 'Low',
            'source_reliability': 'Reliable',
            'conflict_over_source': False,
            'status': 'Approved',
            'creator': 'testuser',
            'planned_start_date': '2025-02-01',
            'planned_completion_date': '2025-12-31',
            'actual_start_date': '2025-02-15'
        },
        {
            'project_id': 'OWEB-WAT-2024-0041',
            'name': 'Yabelo Deep Well & Distribution',
            'program': 'Borena Resilient Program',
            'program_component': 'Deep Groundwater Drilling (>500m)',
            'region': 'Oromia',
            'zone': 'Borena',
            'woreda': 'Yabelo',
            'kebele': 'Dida Yabelo',
            'gps_coordinates': {'lat': 4.88, 'long': 38.08},
            'elevation': 1850,
            'project_type': 'Water Supply',
            'project_sub_type': 'Solar-Powered Rural Scheme',
            'type_of_intervention': 'New',
            'population_coverage': 15000,
            'daily_demand_estimate': 200000,
            'storage_requirement': 250000,
            'pipe_length_estimation': 18,
            'implementing_body': 'Borena Program',
            'estimated_budget': Decimal('12000000.00'),
            'funding_source': 'OWEB',
            'community_contribution': 'Labor',
            'environmental_risk_level': 'Medium',
            'source_reliability': 'Reliable',
            'conflict_over_source': False,
            'status': 'Approved',
            'creator': 'admin',
            'planned_start_date': '2024-10-05',
            'planned_completion_date': '2025-12-15',
            'actual_start_date': '2024-11-01'
        }
    ]
    for p in projects:
        Project.objects.get_or_create(project_id=p['project_id'], defaults=p)
    print(f"Projects seeded: {Project.objects.count()}")

def seed_procurements():
    print("Seeding Procurements...")
    procurements = [
        {
            'procurement_id': 'PROC-OWEB-SAN-2024-0015',
            'project_id': 'OWEB-SAN-2024-0015',
            'tender_reference_number': 'OWEB/NCB/W-01/2024',
            'procurement_method': 'National Competitive Bidding (NCB)',
            'bid_issued_date': '2024-09-01',
            'procurement_type': 'Works',
            'bidding_period_start': '2024-09-02',
            'bidding_period_end': '2024-10-01',
            'evaluation_status': 'Award Endorsed',
            'awarded_bidder_id': 'B-001',
            'award_date': '2024-10-15',
            'estimated_budget_etb': Decimal('8000000.00'),
            'final_contract_value_etb': Decimal('7800000.00'),
            'bidders': [
                {
                    'id': 'B-001',
                    'name': 'Clean Environment PLC',
                    'address': 'Addis Ababa',
                    'type': 'Company',
                    'evaluationStatus': 'Evaluated',
                    'readoutPrice': 7800000,
                    'correctedPrice': 7800000,
                    'currency': 'ETB',
                    'finalRank': 1
                }
            ]
        },
        {
            'procurement_id': 'PROC-OWEB-WAT-2025-0001',
            'project_id': 'OWEB-WAT-2025-0001',
            'tender_reference_number': 'OWEB/NCB/W-08/2025',
            'procurement_method': 'National Competitive Bidding (NCB)',
            'bid_issued_date': '2025-01-10',
            'procurement_type': 'Works',
            'bidding_period_start': '2025-01-11',
            'bidding_period_end': '2025-02-10',
            'evaluation_status': 'Award Endorsed',
            'awarded_bidder_id': 'BID-01',
            'award_date': '2025-02-25',
            'estimated_budget_etb': Decimal('5000000.00'),
            'final_contract_value_etb': Decimal('4850000.00'),
            'bidders': [
                {
                    'id': 'BID-01',
                    'name': 'Oromia Water Works Construction Enterprise',
                    'address': 'Finfinnee, Oromia',
                    'type': 'Company',
                    'evaluationStatus': 'Evaluated',
                    'readoutPrice': 4850000,
                    'correctedPrice': 4850000,
                    'currency': 'ETB',
                    'finalRank': 1
                }
            ]
        }
    ]
    for pr in procurements:
        Procurement.objects.get_or_create(procurement_id=pr['procurement_id'], defaults=pr)
    print(f"Procurements seeded: {Procurement.objects.count()}")

def seed_contracts():
    print("Seeding Contracts...")
    contracts = [
        {
            'contract_id': 'CONT-OWEB-SAN-2024-0015',
            'project_id': 'OWEB-SAN-2024-0015',
            'procurement_id': 'PROC-OWEB-SAN-2024-0015',
            'contract_manager': 'Eng. Solomon Tadesse',
            'cm_plan_assignment_date': '2024-10-20',
            'cm_actual_assignment_date': '2024-10-25',
            'supervisor': 'Eng. Hawi Kebede',
            'supervisor_plan_assignment_date': '2024-10-22',
            'supervisor_actual_assignment_date': '2024-10-28',
            'contractor_name': 'Clean Environment PLC',
            'performance_security_plan_date': '2024-11-01',
            'performance_security_actual_date': '2024-11-05',
            'performance_security_expiry_date': '2025-11-05',
            'performance_bond_amount': Decimal('780000.00'),
            'signing_date': '2024-11-10',
            'commencement_plan_date': '2024-11-15',
            'commencement_actual_date': '2024-12-01',
            'planned_completion_date': '2025-10-31',
            'is_plan_finalized': True,
            'kpis': [
                {
                    'id': 'KPI-1',
                    'description': 'Waste Processing Pond Excavation Completion',
                    'unitOfMeasurement': 'Percentage',
                    'periodStartDate': '2024-12-01',
                    'periodEndDate': '2025-03-31',
                    'target': '100%'
                }
            ]
        },
        {
            'contract_id': 'CONT-OWEB-WAT-2025-0001',
            'project_id': 'OWEB-WAT-2025-0001',
            'procurement_id': 'PROC-OWEB-WAT-2025-0001',
            'contract_manager': 'Eng. Solomon Tadesse',
            'cm_plan_assignment_date': '2025-02-28',
            'cm_actual_assignment_date': '2025-03-05',
            'supervisor': 'Eng. Hawi Kebede',
            'supervisor_plan_assignment_date': '2025-03-01',
            'supervisor_actual_assignment_date': '2025-03-08',
            'contractor_name': 'Oromia Water Works Construction Enterprise',
            'performance_security_plan_date': '2025-03-10',
            'performance_security_actual_date': '2025-03-12',
            'performance_security_expiry_date': '2026-03-12',
            'performance_bond_amount': Decimal('485000.00'),
            'signing_date': '2025-03-15',
            'commencement_plan_date': '2025-03-20',
            'commencement_actual_date': '2025-03-20',
            'planned_completion_date': '2026-01-30',
            'is_plan_finalized': True
        }
    ]
    for c in contracts:
        Contract.objects.get_or_create(contract_id=c['contract_id'], defaults=c)
    print(f"Contracts seeded: {Contract.objects.count()}")

def seed_inspections():
    print("Seeding Inspections...")
    inspections = [
        {
            'inspection_id': 'INSP-2025-001',
            'project_id': 'OWEB-WAT-2025-0001',
            'project_name': 'Shashamane Water Supply Extension',
            'program': 'ONE WASH (OWNP)',
            'zone': 'West Arsi',
            'woreda': 'Shashamane',
            'inspection_date': '2025-05-18',
            'inspector_name': 'Eng. Kebede Tadesse',
            'inspector_role': 'OWEB Senior Water Quality & Civil Engineer',
            'visit_stage': 'Pipelaying & Pressure Test',
            'overall_physical_progress_pct': 62.0,
            'workmanship_rating': 'Satisfactory',
            'site_cleanliness_and_safety': 'Satisfactory',
            'environmental_compliance': 'Compliant',
            'water_quality_test': {
                'testDate': '2025-05-18',
                'testedBy': 'Central Oromia Water Testing Lab (Adama)',
                'ph': 7.4,
                'turbidityNTU': 1.8,
                'tdsMgL': 340,
                'residualChlorineMgL': 0.4,
                'fluorideMgL': 1.1,
                'ecoliCFU': 0,
                'complianceStatus': 'Compliant'
            },
            'defects': [
                {
                    'id': 'DEF-001',
                    'itemDescription': 'Air release valve box at Ch. 3+450 requires concrete apron reinforcement.',
                    'category': 'Civil Works',
                    'severity': 'Minor',
                    'status': 'Verified & Closed'
                }
            ],
            'supervisor_remarks': 'Pipeline trenching, HDPE pipe fusion, and hydro-testing on Sector B executed in compliance with specifications.',
            'recommended_actions': 'Proceed with backfilling of tested sector.',
            'signed_off_by': 'Eng. Kebede Tadesse & Regional Supervisor',
            'status': 'Approved by Bureau Lead'
        }
    ]
    for i in inspections:
        FieldInspectionLog.objects.get_or_create(inspection_id=i['inspection_id'], defaults=i)
    print(f"Inspections seeded: {FieldInspectionLog.objects.count()}")

def seed_weekly_tracking():
    print("Seeding Weekly Tracking...")
    plans = [
        {
            'plan_id': 'WP-2025-W34-001',
            'project_id': 'OWEB-WAT-2025-0001',
            'project_name': 'Shashamane Town Water Expansion',
            'zone': 'West Arsi',
            'woreda': 'Shashamane',
            'week_number': 34,
            'start_date': '2025-08-18',
            'end_date': '2025-08-24',
            'prepared_by_user_id': 'testuser',
            'prepared_by_name': 'Tolasa Bekele',
            'prepared_date': '2025-08-17',
            'target_physical_progress_pct': 5.5,
            'status': 'Approved',
            'planned_activities': [
                {
                    'id': 'act-1',
                    'activityName': 'Trench excavation for DN250 HDPE transmission main (Ch 4+200 to 6+700)',
                    'woreda': 'Shashamane',
                    'unit': 'meters',
                    'plannedQuantity': 2500,
                    'actualQuantity': 2200,
                    'weightPct': 35,
                    'status': 'In Progress'
                }
            ]
        }
    ]
    for pl in plans:
        WeeklyWorkPlan.objects.get_or_create(plan_id=pl['plan_id'], defaults=pl)
    print(f"Weekly work plans seeded: {WeeklyWorkPlan.objects.count()}")

def seed_master_data():
    print("Seeding Master Data...")
    if not MasterDataStore.objects.exists():
        MasterDataStore.objects.create(
            version='2.0.0',
            last_pushed_by='admin',
            change_notes='Production initialization from OWEB constants catalog.'
        )
    print(f"MasterDataStore initialized: {MasterDataStore.objects.count()}")

if __name__ == '__main__':
    seed_users()
    seed_programs()
    seed_ngos()
    seed_staff()
    seed_projects()
    seed_procurements()
    seed_contracts()
    seed_inspections()
    seed_weekly_tracking()
    seed_master_data()
    print("All seed data successfully committed to PostgreSQL!")
