# DrishtiCare - Cloud Deployment & Production Hosting Guide

This guide details the transition from **Local Mode (Phases 3–5)** to **Hosted Cloud Mode (Phases 6–7)** without changing application business logic.

---

## 1. Local vs. Hosted Architecture Comparison

| Component | Local Mode (Phases 3–5) | Hosted Cloud Mode (Phases 6–7) |
|---|---|---|
| **Database** | SQLite file (`backend/data/drishticare.db`) | Managed PostgreSQL (Supabase / Railway / Neon / RDS) |
| **Retinal Images** | Local disk folder (`backend/data/images/`) | Cloud Object Store (Cloudflare R2 / AWS S3 / Backblaze B2) |
| **Config** | `backend/.env` with local defaults | Environment variables set in cloud hosting dashboard |
| **API URL** | `http://localhost:8000/api` | `https://api.drishticare.org/api` (or Render/Railway URL) |
| **Auth** | Single user / Health Worker JWT | Mandatory JWT Health Worker & Specialist Auth |
| **Migrations** | Automatic table creation (`init_db`) | Alembic migrations (`alembic upgrade head`) |

---

## 2. Setting Up Cloud Database (PostgreSQL)

1. Provision a PostgreSQL instance on **Supabase**, **Neon**, **Railway**, or **Render**.
2. Copy your connection URI, e.g.:
   ```env
   DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```
3. Run Alembic migrations against the database:
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## 3. Setting Up Cloud Object Storage (S3 / Cloudflare R2 / Backblaze B2)

1. Create a bucket (e.g. `drishticare-fundus-images`).
2. Generate S3 API access credentials:
   - `S3_BUCKET_NAME=drishticare-fundus-images`
   - `S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY_ID=<key>`
   - `S3_SECRET_ACCESS_KEY=<secret>`
   - `S3_REGION_NAME=auto`
   - `S3_PUBLIC_CDN_URL=https://cdn.drishticare.org`
3. Update `backend/.env`:
   ```env
   STORAGE_MODE=cloud
   ```

---

## 4. Migrating Existing Local Pilot Data

If you have collected local screening and patient records you wish to transfer to production:
```bash
# 1. Migrate SQLite records to PostgreSQL:
python backend/scripts/migrate_sqlite_to_postgres.py sqlite:///./data/drishticare.db postgresql://user:pass@host:5432/drishticare

# 2. Upload local image files to Cloud S3/R2 bucket:
python backend/scripts/migrate_images_to_s3.py drishticare-fundus-images
```

---

## 5. Deploying Backend to Cloud

### Option A: Deploy on Render / Railway with Docker
1. Connect your GitHub repository to **Render** or **Railway**.
2. Select **Docker** environment (Render automatically detects `backend/Dockerfile`).
3. Configure environment variables in the dashboard:
   - `STORAGE_MODE=cloud`
   - `DATABASE_URL=postgresql://...`
   - `S3_BUCKET_NAME=...`
   - `S3_ENDPOINT_URL=...`
   - `S3_ACCESS_KEY_ID=...`
   - `S3_SECRET_ACCESS_KEY=...`
   - `JWT_SECRET_KEY=<generate_random_64_char_secret>`
4. Deploy service. You will receive an HTTPS endpoint (e.g. `https://drishticare-backend.onrender.com`).

---

## 6. Deploying Frontend to Vercel / Netlify

1. Connect your GitHub repository to **Vercel** or **Netlify**.
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variables:
   - `VITE_API_URL=https://drishticare-backend.onrender.com/api`
6. Deploy. Vercel/Netlify will automatically provision an HTTPS certificate.

