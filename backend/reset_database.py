import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from apps.authentication.models import User, RoleDefinition, ActivityLog, Notification
from apps.masterdata.models import OrgUnit
from apps.projects.models import Project
from apps.contracts.models import Contract
from apps.procurement.models import Procurement
from apps.inspections.models import FieldInspectionLog
from apps.tracking.models import WeeklyWorkPlan, WeeklyProgressReport
from apps.programs.models import Program, DevelopmentPartner, PartnerDocument, NGO, Staff

def run_reset():
    print("=" * 60)
    print("OWEB PMS - DATABASE RESET & PURGE OF MOCK/DEMO RECORDS")
    print("=" * 60)

    admin_username = os.environ.get('INITIAL_ADMIN_USERNAME', 'admin')
    admin_password = os.environ.get('INITIAL_ADMIN_PASSWORD', 'OwebAdmin2026!#Secure')
    admin_email = os.environ.get('INITIAL_ADMIN_EMAIL', 'admin@oweb.gov.et')

    with transaction.atomic():
        # 1. Purge business transaction & demo entities
        proj_count = Project.objects.all().count()
        Project.objects.all().delete()
        print(f"[-] Purged Projects: {proj_count} deleted.")

        contract_count = Contract.objects.all().count()
        Contract.objects.all().delete()
        print(f"[-] Purged Contracts: {contract_count} deleted.")

        proc_count = Procurement.objects.all().count()
        Procurement.objects.all().delete()
        print(f"[-] Purged Procurements: {proc_count} deleted.")

        insp_count = FieldInspectionLog.objects.all().count()
        FieldInspectionLog.objects.all().delete()
        print(f"[-] Purged Field Inspection Logs: {insp_count} deleted.")

        plan_count = WeeklyWorkPlan.objects.all().count()
        WeeklyWorkPlan.objects.all().delete()
        print(f"[-] Purged Weekly Work Plans: {plan_count} deleted.")

        rep_count = WeeklyProgressReport.objects.all().count()
        WeeklyProgressReport.objects.all().delete()
        print(f"[-] Purged Weekly Progress Reports: {rep_count} deleted.")

        ngo_count = NGO.objects.all().count()
        NGO.objects.all().delete()
        print(f"[-] Purged Sample NGOs: {ngo_count} deleted.")

        staff_count = Staff.objects.all().count()
        Staff.objects.all().delete()
        print(f"[-] Purged Sample Staff: {staff_count} deleted.")

        act_count = ActivityLog.objects.all().count()
        ActivityLog.objects.all().delete()
        print(f"[-] Purged Activity Logs: {act_count} deleted.")

        notif_count = Notification.objects.all().count()
        Notification.objects.all().delete()
        print(f"[-] Purged Notifications: {notif_count} deleted.")

        # 2. Clean up demo users while keeping/bootstrapping the official system administrator
        demo_users = User.objects.exclude(username=admin_username)
        demo_count = demo_users.count()
        demo_users.delete()
        print(f"[-] Purged Demo/Mock Users: {demo_count} deleted.")

        # Ensure single official Admin exists with strong credentials
        admin_user, created = User.objects.get_or_create(username=admin_username)
        admin_user.email = admin_email
        admin_user.full_name = "Oromia Water Bureau Administrator"
        admin_user.role = "Admin"
        admin_user.status = "Active"
        admin_user.organization = "Oromia Water and Energy Bureau"
        admin_user.department = "Information Technology & Water Resources Administration"
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password(admin_password)
        admin_user.save()
        
        status_str = "Created new" if created else "Updated existing"
        print(f"[+] {status_str} official Administrator account: '{admin_username}' ({admin_email})")

        # 3. Verify preservation of official structural reference data
        org_units = OrgUnit.objects.count()
        roles = RoleDefinition.objects.count()
        programs = Program.objects.count()
        partners = DevelopmentPartner.objects.count()
        docs = PartnerDocument.objects.count()

        print("-" * 60)
        print("PRESERVED ADMINISTRATIVE & MASTER DATA VERIFICATION:")
        print(f"  - OrgUnits (Hierarchy & Woredas): {org_units} records")
        print(f"  - RBAC Role Definitions:          {roles} records")
        print(f"  - Official WASH Programs:         {programs} records")
        print(f"  - Official Development Partners:  {partners} records")
        print(f"  - Official Partner Documents:     {docs} records")
        print("-" * 60)
        print("DATABASE RESET SUCCESSFULLY COMPLETED.")
        print("=" * 60)

if __name__ == '__main__':
    run_reset()
