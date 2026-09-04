"""
DrishtiCare - Unified Storage Manager
Implements an identical interface for Local Disk Storage and Cloud Object Storage (AWS S3, Cloudflare R2, Backblaze B2).
Switching between Local and Cloud storage is 100% config-driven via Settings.storage_mode without code changes.
"""

import os
import io
import cv2
import numpy as np
from typing import Optional, Tuple
from backend.app.config import settings


class StorageManager:
    def __init__(self):
        self.mode = settings.storage_mode.lower()
        self.local_base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", settings.image_storage_path)
        )
        os.makedirs(self.local_base_dir, exist_ok=True)
        
        self.s3_client = None
        if self.mode == "cloud":
            self._init_cloud_client()

    def _init_cloud_client(self):
        """Initializes boto3 S3 client for Cloudflare R2 / AWS S3 / Backblaze B2."""
        try:
            import boto3
            kwargs = {}
            if settings.s3_endpoint_url:
                kwargs["endpoint_url"] = settings.s3_endpoint_url
            if settings.s3_region_name:
                kwargs["region_name"] = settings.s3_region_name
            if settings.s3_access_key_id and settings.s3_secret_access_key:
                kwargs["aws_access_key_id"] = settings.s3_access_key_id
                kwargs["aws_secret_access_key"] = settings.s3_secret_access_key
            
            self.s3_client = boto3.client("s3", **kwargs)
            print(f"[Storage] Cloud S3 storage initialized for bucket: {settings.s3_bucket_name}")
        except Exception as e:
            print(f"[Storage Warning] Could not initialize S3 client: {e}. Falling back to local storage.")
            self.mode = "local"

    def save_bytes(self, file_bytes: bytes, relative_path: str, content_type: str = "image/jpeg") -> str:
        """
        Saves raw bytes to either local disk or cloud bucket.
        Returns the accessible URL path for serving to the frontend.
        """
        # Normalize relative path (forward slashes)
        clean_rel_path = relative_path.replace("\\", "/").lstrip("/")

        if self.mode == "cloud" and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=settings.s3_bucket_name,
                    Key=clean_rel_path,
                    Body=file_bytes,
                    ContentType=content_type
                )
                if settings.s3_public_cdn_url:
                    return f"{settings.s3_public_cdn_url.rstrip('/')}/{clean_rel_path}"
                return f"https://{settings.s3_bucket_name}.s3.amazonaws.com/{clean_rel_path}"
            except Exception as e:
                print(f"[Storage Cloud Error] Upload to S3 failed: {e}. Saving to local disk.")

        # Local storage mode
        local_full_path = os.path.join(self.local_base_dir, clean_rel_path)
        os.makedirs(os.path.dirname(local_full_path), exist_ok=True)
        with open(local_full_path, "wb") as f:
            f.write(file_bytes)

        return f"/images/{clean_rel_path}"

    def save_cv2_image(self, img_bgr: np.ndarray, relative_path: str, quality: int = 95) -> str:
        """
        Encodes and saves an OpenCV BGR NumPy image array.
        """
        success, encoded = cv2.imencode(".jpg", img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        if not success:
            raise ValueError("Failed to encode image to JPEG format")
        return self.save_bytes(encoded.tobytes(), relative_path, content_type="image/jpeg")

    def get_image_bytes(self, relative_path: str) -> Optional[bytes]:
        """
        Reads image bytes from local disk or cloud S3 bucket.
        """
        clean_rel_path = relative_path.replace("\\", "/").lstrip("/")
        # If relative_path starts with /images/, strip it
        if clean_rel_path.startswith("images/"):
            clean_rel_path = clean_rel_path[7:]

        if self.mode == "cloud" and self.s3_client:
            try:
                response = self.s3_client.get_object(Bucket=settings.s3_bucket_name, Key=clean_rel_path)
                return response["Body"].read()
            except Exception as e:
                print(f"[Storage Cloud Error] S3 read error: {e}")

        # Local disk read
        local_full_path = os.path.join(self.local_base_dir, clean_rel_path)
        if os.path.exists(local_full_path):
            with open(local_full_path, "rb") as f:
                return f.read()
        return None

    def get_local_path(self, relative_path: str) -> str:
        """Returns the absolute local filesystem path for a relative path."""
        clean_rel_path = relative_path.replace("\\", "/").lstrip("/")
        if clean_rel_path.startswith("images/"):
            clean_rel_path = clean_rel_path[7:]
        return os.path.join(self.local_base_dir, clean_rel_path)


# Singleton storage manager instance
storage_manager = StorageManager()

