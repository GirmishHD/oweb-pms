from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Avg
from apps.projects.models import Project
from apps.contracts.models import Contract
from apps.procurement.models import Procurement
from apps.programs.models import Program
from apps.inspections.models import FieldInspectionLog

class PortfolioSummaryReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_projects = Project.objects.count()
        approved_projects = Project.objects.filter(status='Approved').count()
        completed_projects = Project.objects.filter(status='Completed').count()
        total_budget = Project.objects.aggregate(total=Sum('estimated_budget'))['total'] or 0
        total_beneficiaries = Project.objects.aggregate(total=Sum('population_coverage'))['total'] or 0
        
        # Single optimized database query aggregating projects by program
        project_aggregates = {
            item['program']: item
            for item in Project.objects.values('program').annotate(
                total_schemes=Count('id'),
                committed_budget=Sum('estimated_budget'),
                actual_pop=Sum('population_coverage')
            )
        }
        
        programs_stats = []
        for p in Program.objects.all():
            match = project_aggregates.get(p.name) or project_aggregates.get(p.code)
            schemes_count = match['total_schemes'] if match else 0
            p_budget = match['committed_budget'] if match else 0
            p_pop = match['actual_pop'] if match else 0

            programs_stats.append({
                'programId': p.prog_id,
                'programName': p.name,
                'programCode': p.code,
                'totalSchemes': schemes_count,
                'allocatedBudgetETB': float(p.budget_etb),
                'schemesCommittedBudgetETB': float(p_budget),
                'targetBeneficiaries': p.target_beneficiaries,
                'actualBeneficiaries': p_pop
            })

        return Response({
            'totalProjects': total_projects,
            'approvedProjects': approved_projects,
            'completedProjects': completed_projects,
            'totalEstimatedBudgetETB': float(total_budget),
            'totalPopulationCoverage': total_beneficiaries,
            'totalContracts': Contract.objects.count(),
            'totalTenders': Procurement.objects.count(),
            'totalInspectionLogs': FieldInspectionLog.objects.count(),
            'programBreakdown': programs_stats
        })
