"""
DrishtiCare - Environment-Driven Configuration Settings
Supports seamless switching between local SQLite/disk storage and cloud PostgreSQL/S3 without application code modifications.
"""

import os
from typing import Literal, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Information
    app_name: str = "DrishtiCare Clinical AI & Telemedicine Platform"
    app_version: str = "1.0.0"
    environment: str = "development"
    app_debug: bool = True

    # Storage Mode: "local" (single machine disk) or "cloud" (AWS S3 / Cloudflare R2 / Backblaze B2)
    storage_mode: Literal["local", "cloud"] = "local"
    image_storage_path: str = "./data/images"

    # Cloud Object Storage Settings (Used when storage_mode="cloud")
    s3_bucket_name: Optional[str] = "drishticare-fundus-images"
    s3_endpoint_url: Optional[str] = None  # e.g., "https://<account_id>.r2.cloudflarestorage.com"
    s3_access_key_id: Optional[str] = None
    s3_secret_access_key: Optional[str] = None
    s3_region_name: Optional[str] = "ap-south-1"
    s3_public_cdn_url: Optional[str] = None  # e.g. "https://cdn.drishticare.org"

    # Database URL: defaults to local SQLite file; can be pointed to postgresql://... in production
    database_url: str = "sqlite:///./data/drishticare.db"

    # Security & JWT Authentication (Phase 8)
    jwt_secret_key: str = "drishticare_clinical_secret_key_2026_change_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours shift length

    # ML Model Settings
    model_weights_path: str = "./backend/app/ml/model_referable_dr.pt"
    model_device: Optional[str] = None  # "cuda", "cpu", or None for auto-detection
    min_laplacian_var: float = 5.0
    min_brightness: float = 25.0
    max_brightness: float = 220.0

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Global settings singleton
settings = Settings()

