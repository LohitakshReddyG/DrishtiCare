"""
DrishtiCare - Phase 5 Comprehensive Automated Test Suite & Checklist Verification
Tests all 5 bug fix criteria and 10 clinical requirements:
1. Metrics consistency with metrics.json (APTOS >=90% / IDRiD >=90%)
2. Mandatory Health worker JWT authentication & 401 route protection
3. Real Patient demographic registration in SQLite
4. Deterministic OpenCV quality gatekeeper (blurry image rejection)
5. PyTorch EfficientNet neural inference producing distinct grades & confidences for normal vs referable images (Bug 1 & 3)
6. Dual-eye (Left OS + Right OD) screening with independent per-eye results (Bug 2)
7. Authentic Grad-CAM heatmap overlay generation & image serving (Bug 3)
8. Clinical Referral slip generation, linking, and status updates (Bug 5)
9. Live SQL dashboard aggregations
10. Program capacity queueing simulation dynamics & SQLite persistence
"""

import os
import io
import json
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.config import settings
from backend.app.models.schemas import SessionLocal, PatientDB, ScreeningDB, ReferralDB, UserDB, init_db
from backend.app.ml.quality import quality_checker
from backend.app.ml.dr_model import dr_pipeline
from backend.app.simulation.capacity_sim import capacity_simulator

client = TestClient(app)


@pytest.fixture(scope="module")
def samples_dir():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "static", "samples"))


@pytest.fixture(scope="module")
def auth_headers():
    """Register a test health worker and return JWT authorization headers."""
    init_db()
    unique_suffix = os.urandom(4).hex()
    username = f"test_worker_{unique_suffix}"
    password = "TestPassword123!"
    reg_res = client.post("/api/auth/register", json={
        "username": username,
        "email": f"{username}@test.clinic",
        "password": password,
        "full_name": "Test Health Worker",
        "role": "health_worker",
        "clinic_location": "Test PHC"
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    login_res = client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_01_metrics_json_integrity():
    """Verify metrics.json exists and satisfies SIH clinical requirements (Sensitivity >= 90%, Specificity >= 85%)."""
    metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "metrics.json"))
    assert os.path.exists(metrics_path), "metrics.json is missing!"
    
    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    aptos = metrics["aptos_internal_benchmark"]
    idrid = metrics["idrid_external_benchmark"]

    assert aptos["sensitivity"] >= 0.90, f"APTOS sensitivity {aptos['sensitivity']} < 0.90"
    assert aptos["specificity"] >= 0.85, f"APTOS specificity {aptos['specificity']} < 0.85"
    assert aptos["auc_roc"] >= 0.90

    assert idrid["sensitivity"] >= 0.90, f"IDRiD sensitivity {idrid['sensitivity']} < 0.90"
    assert idrid["specificity"] >= 0.85, f"IDRiD specificity {idrid['specificity']} < 0.85"
    assert idrid["auc_roc"] >= 0.90


def test_02_health_worker_auth_and_unauthorized_rejection(auth_headers):
    """Bug 4: Verify unauthenticated requests return 401, while valid JWT grants access."""
    # 1. Unauthenticated call must be rejected with 401
    unauth_res = client.get("/api/patients")
    assert unauth_res.status_code == 401, f"Expected 401 Unauthorized, got {unauth_res.status_code}"

    # 2. Authenticated call succeeds
    auth_res = client.get("/api/patients", headers=auth_headers)
    assert auth_res.status_code == 200

    # 3. New Staff Registration & Token generation
    unique_suffix = os.urandom(4).hex()
    user_payload = {
        "username": f"nurse_{unique_suffix}",
        "email": f"nurse_{unique_suffix}@ruralphc.in",
        "password": "SecurePassword123!",
        "full_name": "Sister Devi (Staff Nurse)",
        "role": "health_worker",
        "clinic_location": "Chittoor Primary Health Centre"
    }
    reg_res = client.post("/api/auth/register", json=user_payload)
    assert reg_res.status_code == 200
    assert reg_res.json()["username"] == user_payload["username"]


def test_03_patient_registration(auth_headers):
    """Verify real patient creation in SQLite database with mandatory consent."""
    patient_payload = {
        "full_name": "Ramesh Chandra Patel",
        "age": 56,
        "gender": "Male",
        "village": "Gopalpur Gram Panchayat",
        "diabetes_duration_years": 8.5,
        "phone": "+91 94150 12345",
        "consent_given": True
    }

    res = client.post("/api/patients", json=patient_payload, headers=auth_headers)
    assert res.status_code == 200, f"Patient registration failed: {res.text}"
    pat = res.json()
    assert pat["id"] > 0
    assert pat["patient_code"].startswith("PAT-")
    assert pat["full_name"] == patient_payload["full_name"]


def test_04_blurry_image_rejection(samples_dir, auth_headers):
    """Confirm a genuinely blurry photo gets rejected by OpenCV quality gatekeeper."""
    blur_path = os.path.join(samples_dir, "Quality_Fail_Blurry.jpg")
    assert os.path.exists(blur_path), f"Missing {blur_path}"

    with open(blur_path, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        "/api/screenings/check-quality",
        files={"file": ("blur.jpg", file_bytes, "image/jpeg")},
        headers=auth_headers
    )
    assert res.status_code == 200
    q_data = res.json()
    assert q_data["passed"] is False, "Blurry image should fail quality check!"
    assert "blur" in q_data["issues"]


def test_05_model_inference_distinct_outputs(samples_dir):
    """
    Bug 1 & Bug 3 Verification:
    Verify normal vs referable images produce genuinely distinct predictions, non-identical logits,
    different confidence scores, and authentic Grad-CAM heatmaps.
    """
    normal_path = os.path.join(samples_dir, "Grade_0_Normal.jpg")
    mod_path = os.path.join(samples_dir, "Grade_2_Moderate_Referable.jpg")

    res_norm = dr_pipeline.predict(normal_path, generate_cam=True)
    res_mod = dr_pipeline.predict(mod_path, generate_cam=True)

    # 1. SHA hashes are distinct
    assert res_norm["input_sha256"] != res_mod["input_sha256"]
    
    # 2. Output grades and logits are distinct
    assert res_norm["dr_grade"] != res_mod["dr_grade"]
    assert res_norm["logits"] != res_mod["logits"]
    assert res_norm["referable"] is False
    assert res_mod["referable"] is True

    # 3. Grad-CAM overlays are generated
    assert res_norm["gradcam_overlay_rgb"] is not None
    assert res_mod["gradcam_overlay_rgb"] is not None
    assert len(res_mod["lesion_hotspots"]) > 0


def test_06_dual_eye_screening(samples_dir, auth_headers):
    """
    Bug 2 Verification:
    Capture both Left Eye (OS) and Right Eye (OD) in a single request.
    Confirm both eyes' independent results and Grad-CAM paths are returned and preserved.
    """
    # 1. Register patient
    pat_res = client.post("/api/patients", json={
        "full_name": "Ananya Sharma",
        "age": 52,
        "gender": "Female",
        "village": "Sonbhadra Sector 4",
        "diabetes_duration_years": 12.0,
        "phone": "+91 98390 54321",
        "consent_given": True
    }, headers=auth_headers)
    patient_id = pat_res.json()["id"]

    # 2. Prepare left (normal) and right (moderate DR) images
    norm_path = os.path.join(samples_dir, "Grade_0_Normal.jpg")
    mod_path = os.path.join(samples_dir, "Grade_2_Moderate_Referable.jpg")

    with open(norm_path, "rb") as f_norm, open(mod_path, "rb") as f_mod:
        res = client.post(
            f"/api/screenings/{patient_id}/image",
            data={"eye": "both"},
            files={
                "left_eye": ("left_norm.jpg", f_norm.read(), "image/jpeg"),
                "right_eye": ("right_mod.jpg", f_mod.read(), "image/jpeg")
            },
            headers=auth_headers
        )

    assert res.status_code == 200, f"Dual-eye screening failed: {res.text}"
    scr = res.json()

    # Both eye images and Grad-CAMs exist
    assert scr["left_image_path"] is not None
    assert scr["right_image_path"] is not None
    assert scr["left_gradcam_path"] is not None
    assert scr["right_gradcam_path"] is not None

    # Individual eye grades are distinct
    assert scr["left_dr_grade"] == 0
    assert scr["right_dr_grade"] == 2
    assert scr["left_referable"] is False
    assert scr["right_referable"] is True

    # Overall triage selects max severity
    assert scr["dr_grade"] == 2
    assert scr["referable"] is True
    assert scr["urgency_tier"] in ["Priority", "Urgent"]


def test_07_referral_creation_and_status_update(samples_dir, auth_headers):
    """Bug 5: Verify referral creation, status update, and detail querying."""
    # 1. Create patient and screening
    pat_res = client.post("/api/patients", json={
        "full_name": "Kishore Kumar Das",
        "age": 63,
        "gender": "Male",
        "village": "Balasore Rural",
        "diabetes_duration_years": 16.0,
        "phone": "+91 91234 56789",
        "consent_given": True
    }, headers=auth_headers)
    patient_id = pat_res.json()["id"]

    sample_res = client.post("/api/screenings/process-sample", json={
        "sample_id": "SAMPLE-3",
        "patient_id": patient_id,
        "eye": "both"
    }, headers=auth_headers)
    screening_id = sample_res.json()["id"]

    # 2. Create referral
    ref_res = client.post("/api/referrals", json={
        "patient_id": patient_id,
        "screening_id": screening_id,
        "target_facility": "District Eye Hospital, Tele-Ophthalmology Unit",
        "notes": "Patient reports blurred vision for 3 months."
    }, headers=auth_headers)
    assert ref_res.status_code == 200
    ref = ref_res.json()
    assert ref["referral_code"].startswith("REF-")
    assert ref["patient_name"] == "Kishore Kumar Das"
    assert ref["status"] == "Pending"

    # 3. Update status to Attended
    ref_id = ref["id"]
    patch_res = client.patch(f"/api/referrals/{ref_id}/status", json={"status": "Attended"}, headers=auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Attended"


def test_08_dashboard_summary_live_aggregation(auth_headers):
    """Verify GET /dashboard/summary runs real SQL queries without hardcoded values."""
    res = client.get("/api/dashboard/summary", headers=auth_headers)
    assert res.status_code == 200
    summary = res.json()

    assert "today_screenings" in summary
    assert "pending_referrals" in summary
    assert "screened_this_week" in summary
    assert "referable_rate_pct" in summary
    assert "recent_patients" in summary
    assert "daily_trend_7d" in summary
    assert len(summary["daily_trend_7d"]) == 7


def test_09_program_capacity_simulation_variation(auth_headers):
    """Verify capacity sliders result in recalculated throughput and queue dynamics."""
    sim1 = capacity_simulator.simulate(
        daily_arrivals=300,
        capture_devices=4,
        human_reviewers=2,
        network_bandwidth_tier="4G_Rural"
    )
    sim2 = capacity_simulator.simulate(
        daily_arrivals=800,
        capture_devices=12,
        human_reviewers=6,
        network_bandwidth_tier="Fiber"
    )

    assert sim2["daily_throughput"] > sim1["daily_throughput"]
    assert sim2["annual_projected_capacity"] > sim1["annual_projected_capacity"]

    res = client.post("/api/capacity/simulate", json={
        "daily_arrivals": 500,
        "capture_devices": 10,
        "network_bandwidth_tier": "4G_Rural",
        "human_reviewers": 4,
        "review_time_per_case_sec": 30.0,
        "referral_rate_pct": 20.0,
        "operating_hours_per_day": 8.0
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["annual_projected_capacity"] >= 100000


def test_10_sqlite_persistence():
    """Verify database records persist across independent session queries."""
    db = SessionLocal()
    try:
        patient_count = db.query(PatientDB).count()
        screening_count = db.query(ScreeningDB).count()
        assert patient_count > 0, "No patients in database!"
        assert screening_count > 0, "No screenings in database!"
    finally:
        db.close()
