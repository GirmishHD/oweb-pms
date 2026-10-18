from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to users with the 'Admin' role or superusers.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role == 'Admin' or request.user.is_superuser or request.user.is_staff

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allows authenticated users to read records, but limits mutations (POST, PUT, PATCH, DELETE)
    to Administrators.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'Admin' or request.user.is_superuser or request.user.is_staff

class CanManageUsers(permissions.BasePermission):
    """
    Permission rules for UserViewSet:
    - User registration (create): Anyone (or Admin)
    - Reading directory (list, retrieve, me): Any authenticated user
    - Updating profile: User themselves or Admin
    - Deleting user: Only Admin
    """
    def has_permission(self, request, view):
        if view.action == 'create':
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if view.action in permissions.SAFE_METHODS:
            return True
        if view.action == 'destroy':
            return request.user.role == 'Admin' or request.user.is_superuser
        # Update / partial_update: User themselves or Admin
        return request.user.id == obj.id or request.user.role == 'Admin' or request.user.is_superuser

class CanReviewProjects(permissions.BasePermission):
    """
    Enforces review/approval authority. Only executive, supervisor, or admin roles can approve schemes.
    """
    ALLOWED_ROLES = {'Admin', 'Executive', 'Supervisor', 'Regional Bureau Head'}

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if view.action == 'review':
            return request.user.role in self.ALLOWED_ROLES or request.user.is_superuser or request.user.is_staff
        return True
