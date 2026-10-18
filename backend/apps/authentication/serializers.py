from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
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

    def validate_password(self, value):
        if value:
            try:
                validate_password(value)
            except DjangoValidationError as err:
                raise serializers.ValidationError(list(err.messages))
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        is_admin = bool(
            request and request.user and request.user.is_authenticated and (
                request.user.role == 'Admin' or request.user.is_superuser or request.user.is_staff
            )
        )

        # When creating a new user, require password
        if not self.instance and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'A secure password is required to create a user account.'})

        # Privilege escalation check: non-admins cannot set privileged roles
        privileged_roles = {'Admin', 'Director', 'Supervisor', 'Auditor', 'Executive'}
        target_role = attrs.get('role')
        if target_role and target_role in privileged_roles and not is_admin:
            raise serializers.ValidationError({'role': 'Only system administrators can assign privileged or administrative roles.'})

        # Non-admins cannot alter role, status, or data_scope_override during updates
        if self.instance and not is_admin:
            if 'role' in attrs and attrs['role'] != self.instance.role:
                raise serializers.ValidationError({'role': 'Only administrators can modify user roles.'})
            if 'status' in attrs and attrs['status'] != self.instance.status:
                raise serializers.ValidationError({'status': 'Only administrators can change account activation status.'})
            if 'data_scope_override' in attrs and attrs['data_scope_override'] != self.instance.data_scope_override:
                raise serializers.ValidationError({'data_scope_override': 'Only administrators can modify data scope overrides.'})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = super().create(validated_data)
        user.set_password(password)
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
