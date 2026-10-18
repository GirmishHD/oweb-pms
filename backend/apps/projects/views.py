from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer
from apps.authentication.models import ActivityLog
from apps.authentication.permissions import CanReviewProjects

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, CanReviewProjects]
    filterset_fields = ['status', 'zone', 'woreda', 'program', 'assigned_engineer_id', 'assigned_supervisor_id']
    search_fields = ['project_id', 'name', 'scheme_type', 'zone', 'woreda', 'kebele', 'community_name']
    ordering_fields = ['created_at', 'estimated_budget', 'population_coverage', 'name', 'status']

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        obj = None
        if lookup_value is not None:
            if str(lookup_value).isdigit():
                obj = queryset.filter(id=lookup_value).first()
            if not obj:
                obj = queryset.filter(project_id=lookup_value).first()
        if not obj:
            return super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project_id')
        if project_id:
            existing = Project.objects.filter(project_id=project_id).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        project = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Created Project',
            target_type='Project',
            target_id=project.project_id,
            details=f"Project '{project.name}' created with status {project.status} in woreda {project.woreda}."
        )

    def perform_update(self, serializer):
        project = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user.username,
            action='Updated Project',
            target_type='Project',
            target_id=project.project_id,
            details=f"Project '{project.name}' updated. Current status: {project.status}."
        )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        project = self.get_object()
        project.status = 'Submitted'
        project.save()
        ActivityLog.objects.create(
            user=request.user.username,
            action='Submitted Project Proposal',
            target_type='Project',
            target_id=project.project_id,
            details=f"Project '{project.name}' submitted for technical review."
        )
        return Response({'status': 'Project submitted successfully', 'project': ProjectSerializer(project).data})

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        project = self.get_object()
        verdict = request.data.get('verdict', 'Approved')
        comments = request.data.get('comments', '')
        score = request.data.get('score') or request.data.get('review_score', 85)
        
        status_val = request.data.get('status')
        if not status_val:
            if verdict in ['Approved', 'Conditional']:
                status_val = 'Approved'
            elif verdict in ['Revision Requested', 'Under Review']:
                status_val = 'Under Review'
            else:
                status_val = 'Rejected'
        
        project.status = status_val
        project.appraisal_verdict = verdict
        project.review_comments = comments
        project.review_score = score
        project.reviewed_by = request.data.get('reviewed_by') or request.user.username
        
        if request.data.get('approval_certificate_no'):
            project.approval_certificate_no = request.data.get('approval_certificate_no')
        if request.data.get('revision_points') is not None:
            project.revision_points = request.data.get('revision_points')
        if request.data.get('review_checklist') is not None:
            project.review_checklist = request.data.get('review_checklist')
        if request.data.get('ai_risk_assessment') is not None:
            project.ai_risk_assessment = request.data.get('ai_risk_assessment')
            
        from django.utils import timezone
        review_date_input = request.data.get('review_date')
        if review_date_input:
            project.review_date = str(review_date_input).split('T')[0]
        else:
            project.review_date = timezone.now().date()
            
        project.save()
        
        ActivityLog.objects.create(
            user=request.user.username,
            action=f"Reviewed Project ({verdict})",
            target_type='Project',
            target_id=project.project_id,
            details=f"Project verdict: {verdict}. Score: {score}. Status: {status_val}. Remarks: {comments[:100]}"
        )
        return Response({'status': f"Project marked as {verdict}", 'project': ProjectSerializer(project).data})

