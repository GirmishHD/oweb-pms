from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import User, RoleDefinition, Notification, ActivityLog
from .serializers import UserSerializer, RoleDefinitionSerializer, NotificationSerializer, ActivityLogSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username_or_email = attrs.get('username')
        if username_or_email:
            # Check if user passed an email address instead of username
            user_obj = User.objects.filter(email__iexact=username_or_email).first()
            if user_obj:
                attrs['username'] = user_obj.username

        data = super().validate(attrs)
        user_data = UserSerializer(self.user).data
        data['user'] = user_data
        
        # Log activity
        ActivityLog.objects.create(
            user=self.user.username,
            action='User Logged In',
            target_type='User',
            target_id=str(self.user.id),
            details=f"User {self.user.username} ({self.user.role}) logged in successfully."
        )
        return data

from rest_framework.throttling import ScopedRateThrottle
from .permissions import CanManageUsers, IsAdminOrReadOnly

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class RoleDefinitionViewSet(viewsets.ModelViewSet):
    queryset = RoleDefinition.objects.all().order_by('code')
    serializer_class = RoleDefinitionSerializer
    permission_classes = [IsAdminOrReadOnly]

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.none()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All marked as read'})

class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
