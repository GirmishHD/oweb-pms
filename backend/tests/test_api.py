import os
import sys
from decimal import Decimal
from rest_framework.test import APITestCase
from rest_framework import status

from apps.authentication.models import User, RoleDefinition, Notification, ActivityLog
from apps.projects.models import Project
from apps.programs.models import Program, NGO, Staff
from apps.procurement.models import Procurement
from apps.contracts.models import Contract
from apps.inspections.models import FieldInspectionLog
from apps.tracking.models import WeeklyWorkPlan, WeeklyProgressReport
from apps.masterdata.models import MasterDataStore
from apps.documents.models import Document

class PMSComprehensiveBackendTests(APITestCase):
    def setUp(self):
        # Admin User
        self.admin = User.objects.create(
            username='admin',
            email='admin@oweb.gov.et',
            role='Admin',
            status='Active'
        )
        self.admin.set_password('AdminPassword123!')
        self.admin.save()

        # Regular Engineer User
        self.engineer = User.objects.create(
            username='eng_solomon',
            email='solomon@oweb.gov.et',
            role='Engineer',
            status='Active'
        )
        self.engineer.set_password('EngPassword123!')
        self.engineer.save()

        # Default client authentication with Admin
        self.client.force_authenticate(user=self.admin)

        # Baseline Program
        self.program = Program.objects.create(
            prog_id='PROG-001',
            name='ONE WASH',
            code='ONE-WASH',
            program_manager='Eng. Solomon',
            start_date='2020-07-01',
            end_date='2028-06-30',
            funding_source='World Bank',
            budget_etb=Decimal('450000000.00'),
            target_beneficiaries=1450000
        )

        # Baseline Project
        self.project = Project.objects.create(
            project_id='OWEB-WAT-2025-0001',
            name='Shashamane Town Water Expansion',
            program='ONE WASH',
            zone='West Arsi',
            woreda='Shashamane',
            kebele='03',
            project_type='Water Supply',
            type_of_intervention='Expansion',
            implementing_body='Utility',
            funding_source='OWEB',
            estimated_budget=Decimal('5000000.00'),
            population_coverage=45000,
            status='Approved',
            creator='admin'
        )

        # Baseline Procurement Tender
        self.procurement = Procurement.objects.create(
            procurement_id='PROC-001',
            project_id=self.project.project_id,
            tender_reference_number='OWEB/NCB/01/2025',
            procurement_method='NCB',
            procurement_type='Works',
            tender_stage='Awarded',
            estimated_budget_etb=Decimal('5000000.00')
        )

        # Baseline Contract Agreement
        self.contract = Contract.objects.create(
            contract_id='CONT-001',
            project_id=self.project.project_id,
            procurement_id=self.procurement.procurement_id,
            contract_manager='Eng. Solomon',
            supervisor='Eng. Hawi',
            contractor_name='Clean Environment PLC',
            performance_bond_amount=Decimal('500000.00'),
            is_plan_finalized=True
        )

    # 1. Authentication & Tokens
    def test_user_authentication_success(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'AdminPassword123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'admin')

    def test_user_authentication_invalid_password(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'WrongPassword!'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        self.client.force_authenticate(user=None)
        login_res = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'AdminPassword123!'})
        refresh_token = login_res.data['refresh']

        refresh_res = self.client.post('/api/auth/refresh/', {'refresh': refresh_token})
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_res.data)

    def test_current_user_me_endpoint(self):
        response = self.client.get('/api/auth/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'admin')
        self.assertEqual(response.data['role'], 'Admin')

    def test_unauthenticated_request_rejected(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/projects/schemes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_users_list_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 2. Projects & Scheme Management
    def test_projects_list(self):
        response = self.client.get('/api/projects/schemes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_projects_filtering_by_status_and_zone(self):
        response = self.client.get('/api/projects/schemes/?status=Approved&zone=West Arsi')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertTrue(all(p['status'] == 'Approved' and p['zone'] == 'West Arsi' for p in results))

    def test_create_project_success(self):
        data = {
            'project_id': 'TEST-WAT-2026-0099',
            'name': 'Automated Test Water Scheme',
            'region': 'Oromia',
            'zone': 'East Shewa',
            'woreda': 'Adama',
            'kebele': 'Kebele 01',
            'project_type': 'Water Supply',
            'type_of_intervention': 'New',
            'implementing_body': 'OWEB',
            'funding_source': 'Government',
            'estimated_budget': 1200000.0,
            'population_coverage': 12500,
            'status': 'Draft',
            'creator': 'admin'
        }
        response = self.client.post('/api/projects/schemes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Automated Test Water Scheme')
        self.assertEqual(response.data['project_id'], 'TEST-WAT-2026-0099')

    def test_create_project_missing_required_fields(self):
        invalid_data = {
            'description': 'Incomplete project payload missing mandatory name and ID'
        }
        response = self.client.post('/api/projects/schemes/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('project_id', response.data)

    def test_project_submit_and_review_workflow(self):
        # 1. Create a draft project
        proj = Project.objects.create(
            project_id='PROJ-WF-TEST',
            name='Workflow Verification Borehole',
            zone='Bale',
            woreda='Goba',
            project_type='Water Supply',
            type_of_intervention='New',
            implementing_body='OWEB',
            funding_source='Regional Budget',
            estimated_budget=Decimal('3200000.00'),
            status='Draft',
            creator='eng_solomon'
        )
        
        # 2. Submit project
        submit_res = self.client.post(f'/api/projects/schemes/{proj.id}/submit/')
        self.assertEqual(submit_res.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_res.data['project']['status'], 'Submitted')

        # 3. Review and approve project
        review_res = self.client.post(f'/api/projects/schemes/{proj.id}/review/', {
            'verdict': 'Approved',
            'comments': 'Verified technical drawings and hydrological yield test.',
            'score': 92
        }, format='json')
        self.assertEqual(review_res.status_code, status.HTTP_200_OK)
        self.assertEqual(review_res.data['project']['status'], 'Approved')
        self.assertEqual(review_res.data['project']['appraisal_verdict'], 'Approved')

    # 3. Procurement & Tenders
    def test_procurement_list_and_create(self):
        list_res = self.client.get('/api/procurement/tenders/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

        proc_data = {
            'procurement_id': 'PROC-AUTO-002',
            'project_id': self.project.project_id,
            'tender_reference_number': 'OWEB/NCB/02/2026',
            'procurement_method': 'NCB',
            'procurement_type': 'Works',
            'tender_stage': 'Bidding',
            'estimated_budget_etb': 2500000.00
        }
        create_res = self.client.post('/api/procurement/tenders/', proc_data, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data['procurement_id'], 'PROC-AUTO-002')

    # 4. Contracts & Agreements
    def test_contracts_list_and_update(self):
        list_res = self.client.get('/api/contracts/agreements/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

        update_res = self.client.patch(f'/api/contracts/agreements/{self.contract.id}/', {
            'contractor_name': 'Clean Environment & Water Tech Ltd',
            'variations': [{'id': 'VAR-01', 'date': '2026-03-01', 'type': 'Scope Change', 'status': 'Approved', 'costImpact': 120000.0, 'timeImpactDays': 14}]
        }, format='json')
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['contractor_name'], 'Clean Environment & Water Tech Ltd')
        self.assertEqual(len(update_res.data['variations']), 1)

    # 5. Field Inspection Logs
    def test_field_inspection_create_and_list(self):
        insp_data = {
            'inspection_id': 'INSP-AUTO-2026-01',
            'project_id': self.project.project_id,
            'project_name': self.project.name,
            'zone': 'West Arsi',
            'woreda': 'Shashamane',
            'inspection_date': '2026-03-15',
            'inspector_name': 'Eng. Hawi',
            'inspector_role': 'Supervisor',
            'visit_stage': 'Substructure',
            'overall_physical_progress_pct': 38.5,
            'status': 'Approved'
        }
        create_res = self.client.post('/api/inspections/logs/', insp_data, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data['inspection_id'], 'INSP-AUTO-2026-01')

        list_res = self.client.get('/api/inspections/logs/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

    # 6. Weekly Work Plans & Progress Reports
    def test_weekly_work_plan_and_progress_reports(self):
        # Work Plan
        plan_data = {
            'plan_id': 'PLAN-AUTO-01',
            'project_id': self.project.project_id,
            'project_name': self.project.name,
            'zone': 'West Arsi',
            'woreda': 'Shashamane',
            'week_number': 12,
            'start_date': '2026-03-16',
            'end_date': '2026-03-22',
            'prepared_by_user_id': str(self.engineer.id),
            'prepared_by_name': 'Eng. Solomon',
            'prepared_date': '2026-03-15',
            'target_physical_progress_pct': 5.0,
            'status': 'Approved'
        }
        plan_res = self.client.post('/api/tracking/plans/', plan_data, format='json')
        self.assertEqual(plan_res.status_code, status.HTTP_201_CREATED)

        # Progress Report
        rep_data = {
            'report_id': 'REP-AUTO-01',
            'project_id': self.project.project_id,
            'project_name': self.project.name,
            'work_plan_id': 'PLAN-AUTO-01',
            'week_number': 12,
            'start_date': '2026-03-16',
            'end_date': '2026-03-22',
            'report_date': '2026-03-22',
            'submitted_date': '2026-03-22',
            'submitted_by_user_id': str(self.engineer.id),
            'submitted_by_name': 'Eng. Solomon',
            'previous_physical_progress_pct': 35.0,
            'this_week_physical_progress_pct': 4.5,
            'cumulative_physical_progress_pct': 39.5,
            'status': 'Submitted'
        }
        rep_res = self.client.post('/api/tracking/reports/', rep_data, format='json')
        self.assertEqual(rep_res.status_code, status.HTTP_201_CREATED)

    # 7. Document Vault
    def test_document_vault_metadata_and_deletion(self):
        doc_data = {
            'document_id': 'DOC-AUTO-001',
            'project_id': self.project.project_id,
            'file_name': 'Hydrological_Survey_Report.pdf',
            'file_url': 'data:application/pdf;base64,JVBERi0xLjQK...',
            'category': 'Technical Specification',
            'uploaded_by': 'admin'
        }
        upload_res = self.client.post('/api/documents/files/', doc_data, format='json')
        self.assertEqual(upload_res.status_code, status.HTTP_201_CREATED)
        doc_pk = upload_res.data['id']

        # Delete document
        del_res = self.client.delete(f'/api/documents/files/{doc_pk}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

    # 8. Master Data Store
    def test_masterdata_store_and_sync(self):
        get_res = self.client.get('/api/masterdata/store/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertIn('version', get_res.data)

        sync_data = {
            'version': '2.1.0',
            'changeNotes': 'Automated schema update test',
            'currencies': ['ETB', 'USD', 'EUR'],
            'riskLevels': ['Low', 'Medium', 'High', 'Critical']
        }
        sync_res = self.client.post('/api/masterdata/store/', sync_data, format='json')
        self.assertEqual(sync_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(sync_res.data['version'], '2.1.0')

    # 9. Portfolio Summary & SQL Aggregation
    def test_portfolio_summary_report(self):
        response = self.client.get('/api/reports/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('totalProjects', response.data)
        self.assertIn('totalEstimatedBudgetETB', response.data)
        self.assertIn('programBreakdown', response.data)
        self.assertEqual(response.data['totalProjects'], Project.objects.count())
        self.assertEqual(response.data['totalContracts'], Contract.objects.count())
        self.assertEqual(response.data['totalTenders'], Procurement.objects.count())

    # 10. Security & RBAC Privilege Escalation Tests
    def test_unauthorized_user_cannot_delete_other_user(self):
        # Authenticate as regular Field Engineer
        self.client.force_authenticate(user=self.engineer)
        # Attempt to delete Admin account (IDOR / Vertical Privilege Escalation)
        response = self.client.delete(f'/api/auth/users/{self.admin.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Verify admin still exists in database
        self.assertTrue(User.objects.filter(id=self.admin.id).exists())

    def test_unauthorized_engineer_cannot_review_project(self):
        # Authenticate as regular Field Engineer
        self.client.force_authenticate(user=self.engineer)
        # Attempt to approve scheme
        response = self.client.post(f'/api/projects/schemes/{self.project.id}/review/', {
            'verdict': 'Approved',
            'comments': 'Unauthorized self-approval attempt'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthorized_engineer_cannot_modify_roles(self):
        # Authenticate as regular Field Engineer
        self.client.force_authenticate(user=self.engineer)
        # Attempt to create new role definition
        response = self.client.post('/api/auth/roles/', {
            'code': 'SUPER_HACKER',
            'name': 'Super Hacker Role',
            'permissions': ['ALL_ACCESS']
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthorized_engineer_cannot_overwrite_masterdata(self):
        # Authenticate as regular Field Engineer
        self.client.force_authenticate(user=self.engineer)
        # Attempt to push master data catalog
        response = self.client.post('/api/masterdata/store/', {
            'version': '9.9.9',
            'changeNotes': 'Malicious overwrite'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_review_and_manage_users(self):
        # Authenticate as Admin
        self.client.force_authenticate(user=self.admin)
        # Admin approves scheme
        review_res = self.client.post(f'/api/projects/schemes/{self.project.id}/review/', {
            'verdict': 'Approved',
            'comments': 'Authorized official approval'
        }, format='json')
        self.assertEqual(review_res.status_code, status.HTTP_200_OK)
        self.assertEqual(review_res.data['project']['status'], 'Approved')

    # 11. Dual-Key Business Lookup & API Root Tests
    def test_api_root_endpoint(self):
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'online')
        self.assertIn('documentation', response.data)
        self.assertIn('modules', response.data)

    def test_dual_key_project_lookup(self):
        self.client.force_authenticate(user=self.admin)
        # 1. Lookup by string business ID
        res_string = self.client.get(f'/api/projects/schemes/{self.project.project_id}/')
        self.assertEqual(res_string.status_code, status.HTTP_200_OK)
        self.assertEqual(res_string.data['name'], self.project.name)
        # 2. Lookup by numeric primary key
        res_numeric = self.client.get(f'/api/projects/schemes/{self.project.id}/')
        self.assertEqual(res_numeric.status_code, status.HTTP_200_OK)
        self.assertEqual(res_numeric.data['id'], self.project.id)

    def test_contract_dual_key_upsert(self):
        self.client.force_authenticate(user=self.admin)
        # First save contract
        res = self.client.post('/api/contracts/agreements/', {
            'contract_id': 'CONT-TEST-UPSERT-01',
            'project_id': self.project.project_id,
            'procurement_id': 'PROC-TEST-01',
            'contract_manager': 'Manager One',
            'supervisor': 'Supervisor One'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Upsert with same contract_id should update, not throw 500 duplicate key error
        res_update = self.client.post('/api/contracts/agreements/', {
            'contract_id': 'CONT-TEST-UPSERT-01',
            'contract_manager': 'Manager Updated'
        }, format='json')
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(res_update.data['contract_manager'], 'Manager Updated')


