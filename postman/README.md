# OWEB Program Management System - Postman API Test Suite

This directory contains the production REST API test collection and environment configuration for the **Oromia Water and Energy Bureau (OWEB) Program Management System**.

---

## 1. Files Included

- **`OWEB_PMS.postman_collection.json`**: Complete Postman v2.1 collection covering all 11 core API modules with 43 automated assertions.
- **`OWEB_PMS.postman_environment.json`**: Postman environment definition configuring `base_url`, test credentials, and runtime JWT variables (`access_token`, `refresh_token`, `created_scheme_pk`).

---

## 2. Test Coverage Matrix

| # | Test Suite Module | Endpoints Covered | Assertions & Verifications |
|---|-------------------|-------------------|-----------------------------|
| **01** | **Authentication** | `POST /api/auth/login/`<br>`POST /api/auth/refresh/`<br>`GET /api/auth/users/me/` | Status 200, JWT access/refresh token issuance, 401 on bad password, current user role identity match. |
| **02** | **User Management & RBAC** | `GET /api/auth/users/`<br>`GET /api/auth/roles/` | Returns enterprise user directory, returns active system roles (`ROLE_ADMIN`). |
| **03** | **Master Data Store** | `GET /api/masterdata/store/` | Verifies centralized PostgreSQL master data (`catalog_categories`, `regions`, `woredas`). |
| **04** | **Programs Portfolio** | `GET /api/programs/portfolios/`<br>`GET /api/programs/ngos/` | Retrieves active programs (`ONE-WASH`, `COWASH`) and partner NGOs (`Plan International`, `IRC`). |
| **05** | **Schemes & Projects** | `GET /api/projects/schemes/`<br>`GET /api/projects/schemes/?status=Approved&zone=West Arsi`<br>`POST /api/projects/schemes/`<br>`POST /api/projects/schemes/{id}/submit/`<br>`POST /api/projects/schemes/{id}/review/` | Full project lifecycle: listing, index-accelerated compound query filtering, project creation, proposal submission, technical review & approval. |
| **06** | **Procurement & Tenders** | `GET /api/procurement/tenders/` | Verifies tender register and evaluation status. |
| **07** | **Contract Agreements** | `GET /api/contracts/agreements/` | Verifies active contract agreements and assignment to contractors. |
| **08** | **Field Inspections** | `GET /api/inspections/logs/`<br>`POST /api/inspections/logs/` | Lists field inspections, creates new physical progress inspection with PostgreSQL persistence. |
| **09** | **Tracking & Work Plans** | `GET /api/tracking/plans/`<br>`GET /api/tracking/reports/` | Validates weekly work plans and contractor weekly execution reports. |
| **10** | **Reporting & Analytics** | `GET /api/reports/summary/` | Validates high-performance SQL aggregate summary metrics across all portfolios. |
| **11** | **Security & Negative Tests** | `GET /api/projects/schemes/` (no token)<br>`POST /api/projects/schemes/` (invalid payload) | Asserts HTTP 401 Unauthorized for unauthenticated requests; asserts HTTP 400 Bad Request for malformed inputs. |

---

## 3. How to Run the Tests

### Option A: Using Newman (CLI / CI/CD)
Newman runs the collection headless from the command line:

```bash
# From the project root:
npx --yes newman run postman/OWEB_PMS.postman_collection.json -e postman/OWEB_PMS.postman_environment.json --reporters cli
```

Expected output:
```text
┌─────────────────────────┬───────────────────┬──────────────────┐
│                         │          executed │           failed │
├─────────────────────────┼───────────────────┼──────────────────┤
│              iterations │                 1 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│                requests │                23 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│              assertions │                43 │                0 │
└─────────────────────────┴───────────────────┴──────────────────┘
```

### Option B: Using Postman Desktop App
1. Open the Postman application.
2. Click **Import** in the upper left corner.
3. Drag and drop both `postman/OWEB_PMS.postman_collection.json` and `postman/OWEB_PMS.postman_environment.json`.
4. Select the environment **OWEB PMS Development Environment** in the top-right environment selector.
5. Right-click the imported collection **OWEB Program Management System - Production API Suite** and click **Run collection**.
6. Click **Run OWEB Program Management System**.
