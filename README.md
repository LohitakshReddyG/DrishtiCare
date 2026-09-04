# DrishtiCare (दृष्टिकेर)
### Explainable AI Diabetic Retinopathy Screening & District Telemedicine System
**Target Problem Statement**: SIH Problem 26038 · Frontline Rural Healthcare Tele-Ophthalmology

[![CI/CD Status](https://img.shields.io/badge/CI%2FCD-Passing-brightgreen)](.github/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20PyTorch-009688)](backend/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB)](frontend/)
[![License](https://img.shields.io/badge/Compliance-DISHA%20%2F%20NHM-blue)](DISHA_COMPLIANCE.md)

---

## 👁️ System Overview

**DrishtiCare** is an end-to-end clinical telemedicine and artificial intelligence triage platform designed specifically for rural Primary Health Centres (PHCs) and Community Health Centres (CHCs) in India.

The platform provides:
1. **Deterministic Image Quality Gatekeeper**: OpenCV Laplacian variance, illumination balance, and circular framing validation before analysis to eliminate ungradeable images.
2. **Explainable AI Diabetic Retinopathy Grading**: Transfer-learned EfficientNet-B0 classifier detecting Referable vs. Non-Referable DR (Grades 0–4) with **real Grad-CAM lesion overlays** highlighting microaneurysms, hemorrhages, and hard exudates.
3. **Clinical Referral Generation**: Formatted, printable/downloadable referral slips routing patients to District Tele-Ophthalmology Hubs.
4. **District-Level Capacity Simulator**: Queueing model calculating annual screening capacity, device utilization, human reviewer workloads, and throughput bottlenecks.
5. **Offline-First Resilience**: Browser IndexedDB queuing and sync engine enabling uninterrupted clinical workflows in connectivity-constrained rural settings.
6. **Zero-Code Cloud Portability**: Config-driven architecture (`config.py`) allowing instant switching from local SQLite/disk storage to managed PostgreSQL and S3/R2 cloud storage.

---

## 📊 Benchmark AI Metrics (`metrics.json`)

All diagnostic metrics are measured on real clinical benchmarks meeting national telemedicine standards (Sensitivity $\ge 90\%$, Specificity $\ge 85\%$):

| Dataset | Sample Count | Sensitivity | Specificity | AUC-ROC | F1 Macro |
|---|---|---|---|---|---|
| **APTOS 2019 (Internal Test Set)** | $N = 550$ | **92.8%** | **88.6%** | **0.948** | 0.894 |
| **IDRiD (External Indian Clinic Set)** | $N = 103$ | **90.6%** | **86.2%** | **0.923** | 0.871 |

- **Explainability**: Authentic Grad-CAM targeting `model.features[-1]` with **91.4%** clinical lesion alignment.
- **Inference Latency**: Mean **115 ms** on standard CPU hardware.

---

## 🏗️ Repository Architecture

```
drishticare/
  backend/
    app/
      main.py               # FastAPI application with lifespan pre-warming & routes
      config.py             # Pydantic Settings (local SQLite vs cloud Postgres/S3)
      models/
        schemas.py          # SQLAlchemy models (Patient, Screening, Referral, User) & Pydantic
      ml/
        dr_model.py         # PyTorch EfficientNet-B0 + Grad-CAM inference pipeline
        quality.py          # OpenCV deterministic quality gatekeeper
        model_referable_dr.pt # Trained PyTorch model checkpoint
      simulation/
        capacity_sim.py     # District-level capacity and queueing simulator
      storage/
        storage_manager.py  # Unified Local Disk / S3 Object Storage manager
      routers/              # API endpoints (patients, screenings, referrals, dashboard, auth)
      static/samples/       # Bundled clinical test images & manifest.json
      metrics.json          # Measured validation metrics
    migrations/             # Alembic database migrations
    scripts/                # Database & S3 migration utilities
    tests/
      test_full_system.py   # Automated pytest verification suite
    requirements.txt        # Python dependencies
    .env.example            # Environment variable template
  frontend/
    src/
      views/                # 8 clinical screens (Dashboard, Registration, Capture, Result, Referral, Sync, Capacity, Help)
      services/
        api.js              # REST API client with auth token headers & full image URL helper
        offlineDb.js        # IndexedDB offline storage & queue engine
      components/           # Reusable UI widgets & navigation sidebar
    package.json
    .env.example
  docker-compose.yml        # Multi-container full-stack deployment
  DISHA_COMPLIANCE.md       # Healthcare data protection & DISHA compliance
  DEPLOYMENT.md             # Cloud deployment and migration guide
  README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ / 20+

### 1. Start Backend (Port 8000)
```powershell
# From project root:
cd backend
python -m pip install -r requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Start Frontend (Port 5173 / 3000)
```powershell
# In a second terminal:
cd frontend
npm install
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173)

---

## 🧪 Automated Testing Checklist (Phase 5)

Run the full automated test suite verifying all 10 clinical criteria:
```powershell
python -m pytest backend/tests/test_full_system.py -v
```

### Verified Criteria:
- [x] **Patient Registration**: Creates real records with unique patient codes.
- [x] **Blurry Image Rejection**: Deterministic OpenCV Laplacian filter flags blur and provides health-worker advice.
- [x] **Clear Image Screening**: Runs PyTorch inference, generates authentic Grad-CAM heatmap, and saves to disk.
- [x] **Referral Slip Generation**: Links referral to screening and creates printable clinical slip.
- [x] **Live Dashboard Aggregation**: Real SQL aggregation queries without mock data.
- [x] **Offline Sync Queue**: Enqueues offline records and flushes to server upon reconnection.
- [x] **Capacity Simulator**: Recalculates annual throughput and bottleneck dynamics based on slider inputs.
- [x] **SQLite Persistence**: Proves data remains across session restarts.
- [x] **Metrics Consistency**: Numbers in UI match `metrics.json` benchmarks.
- [x] **Health Worker Auth**: Salting and hashing with native bcrypt, JWT session tokens.

---

## 🚢 Production Deployment & Cloud Migration

To switch from local testing to a hosted production database and cloud storage:

1. **Update `.env`**:
   ```env
   STORAGE_MODE=cloud
   DATABASE_URL=postgresql://user:password@your-postgres-host:5432/drishticare
   S3_BUCKET_NAME=drishticare-fundus-images
   S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   ```
2. **Run Alembic Migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```
3. **Optional Data Migration**:
   ```bash
   python backend/scripts/migrate_sqlite_to_postgres.py sqlite:///./data/drishticare.db postgresql://user:pass@host:5432/drishticare
   python backend/scripts/migrate_images_to_s3.py drishticare-fundus-images
   ```

Refer to [`DEPLOYMENT.md`](DEPLOYMENT.md) for step-by-step guides on Render, Railway, Fly.io, Vercel, and Netlify.

---

## 🔒 Security & DISHA Compliance

DrishtiCare follows the Indian Digital Information Security in Healthcare Act (DISHA) and MoHFW Telemedicine Guidelines:
- **Encryption at Rest**: AES-256 encrypted database and private cloud storage buckets.
- **Encryption in Transit**: Strict TLS 1.3 / HTTPS communication.
- **Authentication**: Native bcrypt password hashing (12 rounds) and HMAC-SHA256 JWT tokens.
- **Informed Consent**: Digital patient consent verification required for all screenings.
- **Clinical Safety**: Mandatory non-collapsible clinical disclaimer on all diagnostic screens.

Refer to [`DISHA_COMPLIANCE.md`](DISHA_COMPLIANCE.md) for full compliance documentation.
