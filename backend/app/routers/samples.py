import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/samples", tags=["Samples"])

STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
SAMPLES_DIR = os.path.join(STATIC_DIR, "samples")
MANIFEST_FILE = os.path.join(SAMPLES_DIR, "manifest.json")


@router.get("", response_model=List[Dict[str, Any]])
def get_sample_cases():
    if not os.path.exists(MANIFEST_FILE):
        # Fallback if manifest not created yet
        return []
    with open(MANIFEST_FILE, "r") as f:
        manifest = json.load(f)
    return manifest
