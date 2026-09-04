"""
DrishtiCare - FastAPI Clinical Backend Application
End-to-End Explainable AI Diabetic Retinopathy Screening & District Telemedicine System
"""

import os
import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.models.schemas import init_db
from backend.app.ml.dr_model import dr_pipeline
from backend.app.storage.storage_manager import storage_manager
from backend.app.routers import (
    patients, screenings, referrals, dashboard, sync, capacity, samples, auth
)


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[Startup] Initializing database at: {settings.database_url}")
    init_db()
    
    print(f"[Startup] Storage mode configured as: {settings.storage_mode.upper()}")
    print("[Startup] Pre-warming PyTorch EfficientNet DR model & Grad-CAM pipeline...")
    try:
        import numpy as np
        import cv2
        dummy_img = np.zeros((380, 380, 3), dtype=np.uint8)
        cv2.circle(dummy_img, (190, 190), 160, (50, 80, 180), -1)
        dr_pipeline.predict(dummy_img, generate_cam=True)
        print("[Startup] PyTorch model and Grad-CAM pre-warmed successfully.")
    except Exception as e:
        print(f"[Startup Note] Pre-warming info: {e}")
        
    yield
    print("[Shutdown] DrishtiCare Backend shutting down.")


app = FastAPI(
    title=settings.app_name,
    description="Explainable AI Diabetic Retinopathy Screening & District Telemedicine Workflow API",
    version=settings.app_version,
    lifespan=lifespan
)

# Enable CORS for React Vite development and cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Mount Static directory for bundled samples, Grad-CAM overlays, and assets
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# 2. Mount Images directory for local image storage serving (/images/{path})
IMAGES_DIR = storage_manager.local_base_dir
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# 3. Include API Routers under /api
app.include_router(dashboard.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(screenings.router, prefix="/api")
app.include_router(referrals.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
app.include_router(capacity.router, prefix="/api")
app.include_router(samples.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "DrishtiCare Clinical AI & Telemedicine Backend",
        "version": settings.app_version,
        "storage_mode": settings.storage_mode,
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
