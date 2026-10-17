# OWEB Program Management System (PMS)

Production-Ready Program-Based Project Management System for Oromia Water & Energy Bureau (OWEB).

---

## 🏛️ System Overview

The **OWEB Program Management System (PMS)** provides complete institutional lifecycle management across all regional capital water supply, sanitation, and hygiene infrastructure programs (e.g., ONE WASH / OWNP, COWASH, Second Urban UWSSP-II, Borena Drought Resilience, Basket Fund, and Regional Treasury initiatives).

### Technology Stack
- **Frontend**: React (JavaScript/ES6+, JSX, HTML5, CSS3) bundled via Vite.
- **Backend API**: Python 3.12+ / Django 5.2 & Django REST Framework (DRF) with SimpleJWT authentication.
- **Database**: PostgreSQL with relational schema design, indexes, and transactional integrity.
- **API Documentation**: OpenAPI / Swagger UI via DRF Spectacular (`/api/docs/` and `/api/schema/`).
- **Production Server**: Gunicorn WSGI + Nginx reverse proxy on Ubuntu Linux.

---

## 🚀 Key Modules & Capabilities

1. **Executive Dashboard**: Key indicators, zone-wise execution, and financial performance.
2. **Programs & Portfolios**: Multi-donor portfolio management, budget allocations, and focus area tracking.
3. **NGOs & Implementing Partners**: Partner accreditation, active schemes registry, and MOU tracking.
4. **Staff Management**: Personnel profiles, duty stations, and engineer assignments.
5. **GIS Regional Map**: Geospatial coordinates, corridors, and GPS mapping across all 21 Oromia zones.
6. **Project Planning & Scoping**: Multi-step engineering scoping, demographic demand modeling, and budget formulation.
7. **Technical Review & Approval**: Feasibility and EIA validation, scoring, and appraisal certificates.
8. **Procurement & Tenders**: Bidding lifecycle, evaluation committees, lot manager, and standstill periods.
9. **Contract Administration**: Performance securities, deliverables, variations, claims, and IPC settlements.
10. **QA/QC & Field Inspections**: Site verification logbooks, defect tracking, and water quality testing.
11. **Weekly Tracking**: Field engineer weekly work plans and cumulative physical progress reports.
12. **Performance & Overruns**: Earned Value Management (EVM), budget variance, and cost overrun tracking.
13. **Document Vault**: Feasibility studies, EIA clearance certificates, and engineering drawings.
14. **Reporting & Analytics**: Cross-portfolio financial execution, zone breakdowns, and data exports.
15. **User Management & Security**: 16 institutional roles with query-level data scoping.
16. **Master Data & Registry**: Centralized administrative catalog, org hierarchy, and approval thresholds.

---

## 🛠️ Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL 14+ running locally

### 1. Database Setup
Ensure PostgreSQL is running and create the database:
```sql
CREATE DATABASE oweb_pms;
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python seed_data.py
python manage.py runserver
```
The Django REST API will be available at `http://localhost:8000/`.
- API Docs: `http://localhost:8000/api/docs/`
- Admin Panel: `http://localhost:8000/admin/`

### 3. Frontend Setup
```bash
# In the repository root:
npm install
npm run dev
```
The React frontend will be available at `http://localhost:5173/`.

---

## 🧪 Testing

Run backend automated tests:
```bash
cd backend
python manage.py test tests
```

Build the production frontend bundle:
```bash
npm run build
```

---

## 📦 Ubuntu Production Deployment

See [DEPLOYMENT.md](file:///c:/Users/oweb/Desktop/Program%20Mgt%20system/DEPLOYMENT.md) for complete instructions on configuring Gunicorn, Nginx, systemd, SSL/TLS, and automated database backups on Ubuntu Linux.
