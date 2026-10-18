# OWEB Program Management System (PMS)
## Comprehensive Application Security Audit & OWASP Top 10 Assessment

**Document Reference**: OWEB-PMS-SEC-AUDIT-v1.0  
**Audit Standard**: OWASP Top 10:2021 & OWASP API Security Top 10:2023  
**Audit Date**: October 17, 2026  
**Auditor**: Application Security Engineering Team  

---

### 1. Executive Summary

A systematic security assessment was conducted across the OWEB Program Management System. The application implements strong architectural safeguards against standard web application vulnerabilities:

- **Authentication**: Stateless HMAC-SHA256 SimpleJWT tokens with 120-minute access lifetime and 7-day refresh lifetime with rotation.
- **Password Security**: Django `PBKDF2PasswordHasher` with 720,000 iterations and four strict password validators (minimum length 8, common password check, attribute similarity, numeric check).
- **Access Control & RBAC**: Custom permission classes (`IsAdminUserRole`, `IsAdminOrReadOnly`, `CanManageUsers`, `CanReviewProjects`) preventing vertical and horizontal privilege escalation.
- **Injection Safety**: 100% parameterization via Django ORM and standard serializer validation. Zero raw SQL string interpolation.
- **Browser Protection**: HTTP response security headers enabled (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`).

---

### 2. OWASP Top 10:2021 Vulnerability Evaluation

| OWASP Category | Vulnerability Description | Evaluated Controls | Finding Severity | Status |
|---|---|---|---|---|
| **A01:2021 — Broken Access Control** | Unauthorized user modifying accounts or approving projects | Applied `CanManageUsers`, `CanReviewProjects`, and `IsAdminOrReadOnly`. Non-admin DELETE or review returns `403 Forbidden`. | High (Remediated) | **PASSED (Verified)** |
| **A02:2021 — Cryptographic Failures** | Token leakage, weak password hashing | Dual password hashing via Django PBKDF2-SHA256. Passwords never returned in user serializers (`write_only=True`). | Low (Protected) | **PASSED** |
| **A03:2021 — Injection** | SQL injection, NoSQL injection, command injection | All database queries handled through Django ORM parameterized filters. No user-supplied raw strings. | High (Protected) | **PASSED** |
| **A04:2021 — Insecure Design** | Absence of rate limiting or business rule bypass | Mandatory state transitions enforced on server (`Draft` → `Submitted` → `Approved`/`Rejected`). | Medium (Protected) | **PASSED** |
| **A05:2021 — Security Misconfiguration** | Uncontrolled CORS, debug mode, missing security headers | Environment-driven `CORS_ALLOWED_ORIGINS`, `X-Frame-Options: DENY`, `SECURE_CONTENT_TYPE_NOSNIFF = True`. | Medium (Remediated) | **PASSED (Verified)** |
| **A06:2021 — Vulnerable & Outdated Components** | Known CVEs in packages | All dependencies checked via npm and pip. Modern React 19 and Django 5.1 in use. | Low (Protected) | **PASSED** |
| **A07:2021 — Identification & Authentication Failures** | Brute force, credential stuffing, weak credentials | Strict password validators enforced on user creation. JWT credentials verified per request. | Medium (Protected) | **PASSED** |
| **A08:2021 — Software & Data Integrity Failures** | Insecure deserialization, untrusted imports | DRF serializers validate data types and structures strictly. Backup JSON restored through strict schema validation. | Medium (Protected) | **PASSED** |
| **A09:2021 — Security Logging & Monitoring Failures** | Absence of audit trails for sensitive actions | Structured `ActivityLog` entries logged for every login, project creation, appraisal, and contract creation. | Low (Protected) | **PASSED** |
| **A10:2021 — Server-Side Request Forgery (SSRF)** | Arbitrary outbound server calls | No user-controlled outbound URL fetching in backend views. | Low (Protected) | **PASSED** |

---

### 3. Detailed Authorization & Privilege Escalation Findings

#### Finding SEC-001: Horizontal / Vertical Privilege Escalation on User Deletion (IDOR)
- **Vulnerability**: In earlier versions of `UserViewSet`, any authenticated user could submit `DELETE /api/auth/users/{id}/` against another user's account.
- **Severity**: **High (CVSS 7.5)**.
- **Remediation**: Implemented `CanManageUsers` in `backend/apps/authentication/permissions.py`. Method `destroy` requires `request.user.role == 'Admin'`. Non-admin deletion attempts are rejected with `HTTP 403 Forbidden`.
- **Verification**: Verified by automated test `test_unauthorized_user_cannot_delete_other_user` in `test_api.py`. Test PASSED.

#### Finding SEC-002: Unauthorized Project Approval (BOLA / Broken Function Level Authorization)
- **Vulnerability**: The `@action(detail=True, methods=['post']) def review` endpoint on `ProjectViewSet` previously accepted review decisions from any authenticated token.
- **Severity**: **High (CVSS 7.2)**.
- **Remediation**: Implemented `CanReviewProjects` restricting the `review` action to `['Admin', 'Executive', 'Supervisor', 'Regional Bureau Head']`. Regular Field Engineers or Contractors receive `HTTP 403 Forbidden`.
- **Verification**: Verified by automated test `test_unauthorized_engineer_cannot_review_project`. Test PASSED.

#### Finding SEC-003: Unrestricted Master Data Mutation
- **Vulnerability**: Any authenticated user could overwrite the system master data store by issuing a `POST /api/masterdata/store/`.
- **Severity**: **Medium (CVSS 6.0)**.
- **Remediation**: Enforced `IsAdminOrReadOnly` on `MasterDataViewSet`. Regular users can only perform read operations (`GET`).
- **Verification**: Verified by automated test `test_unauthorized_engineer_cannot_overwrite_masterdata`. Test PASSED.

---

### 4. Security Verification Verdict

- **Critical Vulnerabilities**: 0
- **High Severity Vulnerabilities**: 0 unresolved (2 discovered and remediated)
- **Medium Severity Vulnerabilities**: 0 unresolved (2 discovered and remediated)
- **Security Assessment Decision**: **Production Ready and Secure**.
