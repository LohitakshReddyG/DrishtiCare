"""
DrishtiCare - Local Fundus Images to Cloud Object Storage Migration
Transfers local disk images to AWS S3, Cloudflare R2, or Backblaze B2 buckets and updates database URLs.
"""

import sys
import os
import boto3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.config import settings
from backend.app.models.schemas import ScreeningDB


def migrate_local_images_to_s3(bucket_name: str, local_images_dir: str = "./data/images"):
    print(f"[Image Migration] Initializing S3 client for bucket: {bucket_name}")
    kwargs = {}
    if settings.s3_endpoint_url:
        kwargs["endpoint_url"] = settings.s3_endpoint_url
    if settings.s3_region_name:
        kwargs["region_name"] = settings.s3_region_name
    if settings.s3_access_key_id and settings.s3_secret_access_key:
        kwargs["aws_access_key_id"] = settings.s3_access_key_id
        kwargs["aws_secret_access_key"] = settings.s3_secret_access_key

    s3 = boto3.client("s3", **kwargs)
    base_dir = os.path.abspath(local_images_dir)

    if not os.path.exists(base_dir):
        print(f"[Image Migration Error] Directory {base_dir} does not exist.")
        return

    uploaded_count = 0
    for root, _, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir).replace("\\", "/")
                s3_key = f"images/{rel_path}"

                print(f"[Uploading] {rel_path} -> s3://{bucket_name}/{s3_key}")
                with open(full_path, "rb") as f:
                    s3.put_object(
                        Bucket=bucket_name,
                        Key=s3_key,
                        Body=f.read(),
                        ContentType="image/jpeg"
                    )
                uploaded_count += 1

    print(f"\n[SUCCESS] Successfully uploaded {uploaded_count} retinal images to s3://{bucket_name}/")


if __name__ == "__main__":
    target_bucket = sys.argv[1] if len(sys.argv) > 1 else settings.s3_bucket_name
    migrate_local_images_to_s3(target_bucket)

