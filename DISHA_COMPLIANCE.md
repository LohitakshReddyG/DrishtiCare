# DrishtiCare - Health Data Security & DISHA Compliance Policy

This document outlines the clinical data governance, security architecture, and regulatory compliance standards implemented across **DrishtiCare** in alignment with the **Digital Information Security in Healthcare Act (DISHA)** and the **National Health Mission (NHM) Telemedicine Practice Guidelines**.

---

## 1. Statutory & Regulatory Alignment

DrishtiCare is architected to operate safely in rural Primary Health Centres (PHCs), Community Health Centres (CHCs), and District Tele-Ophthalmology Hubs:
- **DISHA Compliance**: Protection of Digital Health Data (DHD), strict privacy of Personally Identifiable Information (PII), and patient consent ownership.
- **MoHFW Telemedicine Practice Guidelines**: Protocolized tele-triage referral pathways and standardized electronic health documentation.
- **WCAG 2.1 AA Accessibility**: High-contrast clinical typography, multi-modal indicators (never color alone), and multilingual frontline interfaces.

---

## 2. Cryptographic Security & Protection at Rest

1. **Local SQLite / Managed PostgreSQL Encryption**:
   - Patient records, diagnostic grades, and referral slips are protected using database-level AES-256 encryption.
   - Database credentials are managed through environment variables (`DATABASE_URL`) without committing secrets to version control.
2. **Fundus Image & Grad-CAM Storage**:
   - Local mode: Saved under restrictive OS permissions in `backend/data/images/{patient_id}/`.
   - Cloud mode: Uploaded to private S3/R2 buckets with server-side encryption (SSE-S3 / SSE-KMS) and served via short-lived signed URLs or authenticated CDNs.
3. **Password Security**:
   - Health worker and specialist passwords are salted and hashed using **native bcrypt (12 rounds)**. Plaintext passwords are never logged or stored.

---

## 3. Communication Security & Transport Layer (In-Transit)

1. **HTTPS / TLS 1.3 Enforcement**:
   - All REST API endpoints and telemetry synchronizations strictly mandate HTTPS in production.
   - Unencrypted HTTP requests are automatically redirected by reverse proxies (Nginx/Render/Cloudflare).
2. **Stateless JWT Session Management**:
   - Health workers authenticate via JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).
   - Tokens carry an explicit expiration timeframe (default: 8 hours shift length) and user roles (`health_worker`, `ophthalmologist`, `admin`).

---

## 4. Offline-First Data Protection & Sync Governance

Rural clinics frequently experience intermittent network connectivity:
1. **Browser IndexedDB Storage**:
   - Offline records created on frontline laptops/tablets are stored in browser `IndexedDB`.
   - Synchronizations are queued with status tracking (`Pending`, `Synced`, `Failed`).
2. **Audit Logging & Idempotent Sync**:
   - Flushes from IndexedDB to the central backend use unique UUIDs (`SCR-...`, `REF-...`) preventing duplicate record creation.
   - Sync logs track timestamp, payload hash, and network retry attempts.

---

## 5. Patient Consent & Data Retention Protocol

1. **Explicit Informed Consent**:
   - Every patient registration requires digital confirmation (`consent_given=True`) before fundus image capture or AI inference.
2. **Data Minimization & Retention**:
   - Frontline triage nodes retain local cache records for a configurable duration (default: 30 days post-sync) before purging local cache to conserve disk storage.
   - Central district database retains full clinical history for longitudinal diabetic eye monitoring in accordance with national health records retention laws.
3. **Role-Based Access Control (RBAC)**:
   - **Frontline Health Worker**: Patient registration, fundus capture, quality verification, referral slip issuance.
   - **District Ophthalmologist**: Full diagnostic record review, triage confirmation, tele-consultation notes.
   - **System Administrator**: Health worker management, capacity configuration, audit log review.

---

## 6. Security Checklist for Production Deployment

- [x] Passwords hashed using bcrypt.
- [x] JWT authentication with expiration.
- [x] PII separated and protected in relational schema.
- [x] Deterministic OpenCV quality checks rejecting unusable clinical data.
- [x] Clinical disclaimer present on all AI explainability views.
- [x] Environment configuration isolated in `.env` (never committed).
- [x] Least-privilege database user permissions.

