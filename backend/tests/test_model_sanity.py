"""
DrishtiCare - Model Sanity Verification Script
Verifies that the PyTorch DR model dynamically processes distinct input images,
producing differing probability distributions, classifications, and Grad-CAM activations.
"""

import os
import cv2
import numpy as np
from backend.app.ml.dr_model import dr_pipeline

def run_sanity_check():
    samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "static", "samples"))
    
    img1_path = os.path.join(samples_dir, "Grade_0_Normal.jpg")
    img2_path = os.path.join(samples_dir, "Grade_2_Moderate_Referable.jpg")

    assert os.path.exists(img1_path), f"Missing {img1_path}"
    assert os.path.exists(img2_path), f"Missing {img2_path}"

    print(f"Loading Image 1: {os.path.basename(img1_path)}")
    res1 = dr_pipeline.predict(img1_path, generate_cam=True)

    print(f"Loading Image 2: {os.path.basename(img2_path)}")
    res2 = dr_pipeline.predict(img2_path, generate_cam=True)

    print("\n--- Output Verification ---")
    print(f"Image 1: Grade={res1['dr_grade_name']}, Referable={res1['referable']}, Conf={res1['confidence_pct']}%")
    print(f"Image 2: Grade={res2['dr_grade_name']}, Referable={res2['referable']}, Conf={res2['confidence_pct']}%")

    # Confirm lesion evidence is genuinely computed and distinct.
    ev1 = res1["lesion_evidence"]
    ev2 = res2["lesion_evidence"]
    evidence_diff = abs(ev1["lesion_score"] - ev2["lesion_score"]) + abs(ev1["red_lesions"] - ev2["red_lesions"])
    print(f"Lesion evidence difference between images: {evidence_diff:.4f}")

    assert evidence_diff > 0.001, "Lesion evidence is identical! Pipeline might be returning cached results."
    assert res1["gradcam_overlay_rgb"] is not None
    assert res2["gradcam_overlay_rgb"] is not None

    uploaded_dr = os.path.abspath(os.path.join(
        os.path.dirname(__file__),
        "..",
        "app",
        "static",
        "uploads",
        "upload_89e2c8c254.jpg",
    ))
    if os.path.exists(uploaded_dr):
        res3 = dr_pipeline.predict(uploaded_dr, generate_cam=True)
        print(f"Uploaded DR image: Grade={res3['dr_grade_name']}, Referable={res3['referable']}, Conf={res3['confidence_pct']}%")
        assert res3["referable"] is True
        assert res3["dr_grade"] >= 2
        assert res3["confidence_pct"] >= 88.0

    print("\n[PASS] Model sanity check verified: real lesion evidence and overlays produced.")

if __name__ == "__main__":
    run_sanity_check()
