from rest_framework import viewsets, permissions
from .models import WeeklyWorkPlan, WeeklyProgressReport
from .serializers import WeeklyWorkPlanSerializer, WeeklyProgressReportSerializer
from apps.authentication.models import ActivityLog

class WeeklyWorkPlanViewSet(viewsets.ModelViewSet):
    queryset = WeeklyWorkPlan.objects.all().order_by('-week_number')
    serializer_class = WeeklyWorkPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        plan = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Created Weekly Work Plan',
            target_type='WorkPlan',
            target_id=plan.plan_id,
            details=f"Work plan for week {plan.week_number} ({plan.project_name}) submitted."
        )

class WeeklyProgressReportViewSet(viewsets.ModelViewSet):
    queryset = WeeklyProgressReport.objects.all().order_by('-week_number')
    serializer_class = WeeklyProgressReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        rep = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Submitted Weekly Progress Report',
            target_type='ProgressReport',
            target_id=rep.report_id,
            details=f"Weekly progress report for week {rep.week_number} ({rep.project_name}) filed. Progress: {rep.cumulative_physical_progress_pct}%."
        )
