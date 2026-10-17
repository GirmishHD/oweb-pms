from django.urls import path
from .views import PortfolioSummaryReportView

urlpatterns = [
    path('summary/', PortfolioSummaryReportView.as_view(), name='reports-summary'),
]
