from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer
from apps.authentication.models import ActivityLog

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

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
        score = request.data.get('score', 85)
        
        project.status = 'Approved' if verdict == 'Approved' else 'Rejected'
        project.appraisal_verdict = verdict
        project.review_comments = comments
        project.review_score = score
        project.reviewed_by = request.user.username
        project.save()
        
        ActivityLog.objects.create(
            user=request.user.username,
            action=f"Reviewed Project ({verdict})",
            target_type='Project',
            target_id=project.project_id,
            details=f"Project verdict: {verdict}. Score: {score}. Remarks: {comments[:100]}"
        )
        return Response({'status': f"Project marked as {verdict}", 'project': ProjectSerializer(project).data})
