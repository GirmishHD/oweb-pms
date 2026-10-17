import os
import sys
import django
from decimal import Decimal
from rest_framework.test import APITestCase
from rest_framework import status

from apps.authentication.models import User
from apps.projects.models import Project
from apps.programs.models import Program
from apps.procurement.models import Procurement
from apps.contracts.models import Contract

class PMSBackendTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create(
            username='admin',
            email='admin@oweb.gov.et',
            role='Admin',
            status='Active'
        )
        self.admin.set_password('password')
        self.admin.save()
        self.client.force_authenticate(user=self.admin)

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
            status='Approved',
            creator='admin'
        )

        self.procurement = Procurement.objects.create(
            procurement_id='PROC-001',
            project_id=self.project.project_id,
            tender_reference_number='OWEB/NCB/01/2025',
            estimated_budget_etb=Decimal('5000000.00')
        )

        self.contract = Contract.objects.create(
            contract_id='CONT-001',
            project_id=self.project.project_id,
            procurement_id=self.procurement.procurement_id,
            contract_manager='Eng. Solomon',
            supervisor='Eng. Hawi',
            contractor_name='Clean Environment PLC'
        )

    def test_user_authentication(self):
        response = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'password'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)

    def test_projects_list(self):
        response = self.client.get('/api/projects/schemes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_programs_list(self):
        response = self.client.get('/api/programs/portfolios/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_procurements_list(self):
        response = self.client.get('/api/procurement/tenders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_contracts_list(self):
        response = self.client.get('/api/contracts/agreements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_portfolio_summary_report(self):
        response = self.client.get('/api/reports/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('totalProjects', response.data)
        self.assertIn('totalEstimatedBudgetETB', response.data)

    def test_create_project(self):
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
            'status': 'Draft',
            'creator': 'admin'
        }
        response = self.client.post('/api/projects/schemes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Automated Test Water Scheme')
