from rest_framework import serializers
from .models import User, RoleDefinition, Notification, ActivityLog

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'phone', 'role',
            'secondary_roles', 'custom_role_ids', 'custom_permissions',
            'status', 'department', 'organization', 'partner_organization',
            'assigned_team', 'assigned_zone', 'assigned_woreda',
            'assigned_program', 'assigned_programs', 'assigned_ngo_id',
            'assigned_ngo_name', 'staff_profile_id', 'assigned_project_ids',
            'data_scope_override', 'avatar', 'created_at', 'updated_at',
            'last_login', 'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password('password')
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class RoleDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleDefinition
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
