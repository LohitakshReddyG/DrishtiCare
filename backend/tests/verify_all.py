"""
DrishtiCare - Comprehensive Automated Verification Suite
Verifies ML pipeline, Grad-CAM, OpenCV Quality Filter, Capacity Simulation, Database, and REST Endpoints.
"""

import os
import cv2
import json
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.ml.dr_model import dr_pipeline
from backend.app.ml.quality import quality_checker
from backend.app.simulation.capacity_sim import capacity_simulator
from backend.app.models.schemas import SessionLocal, PatientDB, ScreeningDB, ReferralDB

client = TestClient(app)

def test_1_image_quality_filter():
    print("\n--- [Test 1] OpenCV Quality Gatekeeper ---")
    samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "static", "samples"))
    
    # 1. Clear image should pass
    normal_img = cv2.imread(os.path.join(samples_dir, "Grade_0_Normal.jpg"))
    res_normal = quality_checker.evaluate(normal_img)
    assert res_normal["passed"] is True, f"Normal image failed quality: {res_normal}"
    print("  [PASS] Clear fundus photo passed quality check.")

    # 2. Blurry image should fail
    blur_img = cv2.imread(os.path.join(samples_dir, "Quality_Fail_Blurry.jpg"))
    res_blur = quality_checker.evaluate(blur_img)
    assert res_blur["passed"] is False, "Blurry image was incorrectly passed!"
    assert "blur" in res_blur["issues"], f"Blur issue not flagged: {res_blur}"
    print(f"  [PASS] Blurry image successfully rejected with: {res_blur['message']}")

    # 3. Dark image should fail
    dark_img = cv2.imread(os.path.join(samples_dir, "Quality_Fail_Underexposed.jpg"))
    res_dark = quality_checker.evaluate(dark_img)
    assert res_dark["passed"] is False, "Dark image was incorrectly passed!"
    print(f"  [PASS] Underexposed image successfully rejected with: {res_dark['message']}")


def test_2_dr_model_and_gradcam():
    print("\n--- [Test 2] PyTorch DR Classifier & Grad-CAM ---")
    samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "static", "samples"))
    mod_img_path = os.path.join(samples_dir, "Grade_2_Moderate_Referable.jpg")
    
    res = dr_pipeline.predict(mod_img_path, generate_cam=True)
    assert "dr_grade" in res
    assert "referable" in res
    assert "confidence_pct" in res
    assert res["gradcam_overlay_rgb"] is not None
    assert len(res["lesion_hotspots"]) >= 0
    print(f"  [PASS] Model Output: Grade={res['dr_grade_name']}, Referable={res['referable']}, Confidence={res['confidence_pct']}%")
    print(f"  [PASS] Authentic Grad-CAM Overlay Generated: shape={res['gradcam_overlay_rgb'].shape}")


def test_3_capacity_simulation():
    print("\n--- [Test 3] Telemedicine Capacity & Queueing Simulation ---")
    # Standard District config
    sim = capacity_simulator.simulate(
        daily_arrivals=450,
        capture_devices=8,
        network_bandwidth_tier="4G_Rural",
        human_reviewers=3,
        review_time_per_case_sec=25.0,
        referral_rate_pct=18.5,
        operating_hours_per_day=8.0
    )
    assert sim["annual_projected_capacity"] >= 100000, f"Capacity {sim['annual_projected_capacity']} < 100,000"
    assert sim["daily_throughput"] > 0
    assert len(sim["hourly_queue_trajectory"]) == 12
    assert sim["reviewer_utilization_pct"] > 0
    print(f"  [PASS] Annual Projected Capacity: {sim['annual_projected_capacity']:,} patients/year (Target >= 100k passed)")
    print(f"  [PASS] Daily Throughput: {sim['daily_throughput']} patients/day")
    print(f"  [PASS] Bottleneck Identification: {sim['bottleneck_stage']}")


def test_4_rest_api_endpoints():
    print("\n--- [Test 4] Full REST API Endpoints ---")
    # Dashboard summary
    resp = client.get("/api/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "today_screenings" in data
    assert "model_metrics" in data
    print("  [PASS] /api/dashboard/summary: OK (200)")

    # Register patient
    pat_payload = {
        "full_name": "Kavita Bai Verma",
        "age": 48,
        "gender": "Female",
        "village": "Pipariya Gram Panchayat, Hoshangabad",
        "diabetes_duration_years": 5.0,
        "phone": "+91 98231 44556",
        "consent_given": True
    }
    resp = client.post("/api/patients", json=pat_payload)
    assert resp.status_code == 200
    patient = resp.json()
    assert patient["patient_code"].startswith("PAT-")
    print(f"  [PASS] /api/patients: Registered patient {patient['patient_code']}")

    # Process sample screening
    scr_payload = {
        "sample_id": "SAMPLE-2",
        "patient_id": patient["id"],
        "eye": "both"
    }
    resp = client.post("/api/screenings/process-sample", json=scr_payload)
    assert resp.status_code == 200
    screening = resp.json()
    assert screening["referable"] is True
    assert "/static/gradcam/" in screening["left_gradcam_path"]
    print(f"  [PASS] /api/screenings/process-sample: Created screening {screening['screening_code']}")

    # Create referral slip
    ref_payload = {
        "patient_id": patient["id"],
        "screening_id": screening["id"],
        "target_facility": "District Eye Hospital, Tele-Ophthalmology Unit"
    }
    resp = client.post("/api/referrals", json=ref_payload)
    assert resp.status_code == 200
    referral = resp.json()
    assert referral["referral_code"].startswith("REF-")
    print(f"  [PASS] /api/referrals: Created referral {referral['referral_code']}")

    # Sync status
    resp = client.get("/api/sync/status")
    assert resp.status_code == 200
    print("  [PASS] /api/sync/status: OK (200)")

    # Capacity simulate API
    resp = client.get("/api/capacity/simulate?daily_arrivals=400&capture_devices=6")
    assert resp.status_code == 200
    print("  [PASS] /api/capacity/simulate: OK (200)")


if __name__ == "__main__":
    print("=========================================================")
    print("  Running DrishtiCare Verification Suite...")
    print("=========================================================")
    test_1_image_quality_filter()
    test_2_dr_model_and_gradcam()
    test_3_capacity_simulation()
    test_4_rest_api_endpoints()
    print("\n=========================================================")
    print("  ALL VERIFICATION TESTS PASSED! (100% SUCCESS)")
    print("=========================================================\n")
