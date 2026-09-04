"""
DrishtiCare - Retinal Screening API Router
Implements standard clinical endpoints: image upload, OpenCV quality validation, PyTorch inference,
Grad-CAM generation, dual-eye independent processing, and DB recording.
"""

import os
import uuid
import json
import datetime
import cv2
import numpy as np
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body, Path
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.schemas import (
    ScreeningDB, PatientDB, ScreeningResponse, QualityCheckResponse, UserDB, get_db
)
from backend.app.routers.auth import require_auth
from backend.app.ml.quality import quality_checker
from backend.app.ml.dr_model import dr_pipeline, DR_CLASSES
from backend.app.storage.storage_manager import storage_manager
from backend.app.utils.file_validation import read_validated_image_bytes
from backend.app.utils.tenant import get_user_patient, get_user_screening

router = APIRouter(prefix="/screenings", tags=["Screenings"])

STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))


@router.post("/check-quality", response_model=QualityCheckResponse)
async def check_image_quality(
    file: UploadFile = File(...),
    current_user: UserDB = Depends(require_auth)
):
    """
    Stand-alone inline image quality validation endpoint for instant health-worker feedback.
    Evaluates sharpness, illumination, and circular framing before screening.
    """
    contents = await read_validated_image_bytes(file)
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid or unreadable image file")

    res = quality_checker.evaluate(img_bgr)
    return QualityCheckResponse(
        passed=res["passed"],
        issues=res["issues"],
        message=res["message"],
        recommendation=res.get("recommendation", ""),
        laplacian_variance=res["laplacian_variance"],
        mean_brightness=res["mean_brightness"],
        fov_fraction=res["fov_fraction"],
        centered=res["centered"]
    )


def _process_single_eye_image(
    patient_id: int,
    screening_code: str,
    eye_label: str,
    file_bytes: bytes
):
    """Helper to run quality check, PyTorch inference, and save Grad-CAM for one eye."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return None

    raw_rel_path = f"images/{patient_id}/{screening_code}_{eye_label}.jpg"
    image_url = storage_manager.save_bytes(file_bytes, raw_rel_path)

    # 1. Quality Gatekeeper
    quality_res = quality_checker.evaluate(img_bgr)
    if not quality_res["passed"]:
        return {
            "image_url": image_url,
            "gradcam_url": None,
            "quality_passed": False,
            "quality_issues": quality_res["issues"],
            "quality_message": quality_res["message"],
            "dr_grade": -1,
            "dr_grade_name": "Ungradeable (Quality Failed)",
            "referable": False,
            "confidence": 0.0,
            "confidence_tier": "N/A",
            "urgency": "Retake",
            "timeframe": "Immediate retake required",
            "explanation": quality_res.get("recommendation", "Image quality is insufficient. Please retake photo."),
            "hotspots": []
        }

    # 2. PyTorch Neural Inference & Grad-CAM
    ml_res = dr_pipeline.predict(img_bgr, generate_cam=True)

    gradcam_url = image_url
    if ml_res.get("gradcam_overlay_rgb") is not None:
        gradcam_bgr = cv2.cvtColor(ml_res["gradcam_overlay_rgb"], cv2.COLOR_RGB2BGR)
        cam_rel_path = f"images/{patient_id}/{screening_code}_{eye_label}_gradcam.jpg"
        gradcam_url = storage_manager.save_cv2_image(gradcam_bgr, cam_rel_path)

    return {
        "image_url": image_url,
        "gradcam_url": gradcam_url,
        "quality_passed": True,
        "quality_issues": [],
        "quality_message": quality_res["message"],
        "dr_grade": ml_res["dr_grade"],
        "dr_grade_name": ml_res["dr_grade_name"],
        "referable": ml_res["referable"],
        "confidence": ml_res["confidence_pct"],
        "confidence_tier": ml_res["confidence_tier"],
        "urgency": ml_res["urgency_tier"],
        "timeframe": ml_res["suggested_timeframe"],
        "explanation": ml_res["explanation_text"],
        "hotspots": ml_res.get("lesion_hotspots", [])
    }


@router.post("/{patient_id}/image", response_model=ScreeningResponse)
async def screen_patient_image(
    patient_id: int = Path(..., description="ID of the registered patient"),
    eye: str = Form("both", description="left, right, or both"),
    file: Optional[UploadFile] = File(None),
    left_eye: Optional[UploadFile] = File(None),
    right_eye: Optional[UploadFile] = File(None),
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Phase 3.3 Core Dual-Eye Endpoint:
    Saves upload -> Quality check -> PyTorch neural inference -> Authentic Grad-CAM -> Writes DB row -> Returns result.
    Processes both Left Eye (OS) and Right Eye (OD) independently if provided.
    """
    patient = get_user_patient(db, patient_id, current_user.id)

    left_file = left_eye or (file if eye == "left" else None)
    right_file = right_eye or (file if eye == "right" else None)
    if not left_file and not right_file and file:
        if eye == "left":
            left_file = file
        elif eye == "right":
            right_file = file
        else:
            left_file = file

    if not left_file and not right_file:
        raise HTTPException(status_code=400, detail="At least one retinal image (left or right eye) must be provided")

    screening_code = f"SCR-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    left_res = None
    right_res = None

    if left_file:
        left_bytes = await read_validated_image_bytes(left_file)
        left_res = _process_single_eye_image(patient.id, screening_code, "left", left_bytes)

    if right_file:
        right_bytes = await read_validated_image_bytes(right_file)
        right_res = _process_single_eye_image(patient.id, screening_code, "right", right_bytes)

    # Determine overall screening metrics (max severity between eyes)
    primary_eye_res = left_res or right_res
    if left_res and right_res:
        # Pick the eye with higher grade (or higher confidence if grades match)
        if right_res["dr_grade"] > left_res["dr_grade"]:
            primary_eye_res = right_res
        elif right_res["dr_grade"] == left_res["dr_grade"] and right_res["confidence"] > left_res["confidence"]:
            primary_eye_res = right_res
        else:
            primary_eye_res = left_res

    overall_grade = primary_eye_res["dr_grade"]
    overall_grade_name = primary_eye_res["dr_grade_name"]
    overall_referable = bool(
        (left_res and left_res["referable"]) or (right_res and right_res["referable"])
    )
    overall_confidence = primary_eye_res["confidence"]
    overall_confidence_tier = primary_eye_res["confidence_tier"]
    overall_urgency = "Urgent" if overall_grade == 4 else ("Priority" if overall_referable else "Routine")
    overall_timeframe = primary_eye_res["timeframe"]
    overall_explanation = primary_eye_res["explanation"]
    overall_quality_passed = bool(
        (left_res is None or left_res["quality_passed"]) and (right_res is None or right_res["quality_passed"])
    )

    screening_db = ScreeningDB(
        user_id=current_user.id,
        screening_code=screening_code,
        patient_id=patient.id,
        patient_code=patient.patient_code,
        eye="both" if (left_res and right_res) else ("left" if left_res else "right"),
        left_image_path=left_res["image_url"] if left_res else None,
        right_image_path=right_res["image_url"] if right_res else None,
        left_gradcam_path=left_res["gradcam_url"] if left_res else None,
        right_gradcam_path=right_res["gradcam_url"] if right_res else None,
        left_dr_grade=left_res["dr_grade"] if left_res else None,
        right_dr_grade=right_res["dr_grade"] if right_res else None,
        left_dr_grade_name=left_res["dr_grade_name"] if left_res else None,
        right_dr_grade_name=right_res["dr_grade_name"] if right_res else None,
        left_confidence=left_res["confidence"] if left_res else None,
        right_confidence=right_res["confidence"] if right_res else None,
        left_referable=left_res["referable"] if left_res else None,
        right_referable=right_res["referable"] if right_res else None,
        left_explanation=left_res["explanation"] if left_res else None,
        right_explanation=right_res["explanation"] if right_res else None,
        quality_passed=overall_quality_passed,
        quality_issues=json.dumps((left_res["quality_issues"] if left_res else []) + (right_res["quality_issues"] if right_res else [])),
        quality_message=primary_eye_res["quality_message"],
        dr_grade=overall_grade,
        dr_grade_name=overall_grade_name,
        referable=overall_referable,
        confidence=overall_confidence,
        confidence_tier=overall_confidence_tier,
        urgency_tier=overall_urgency,
        suggested_timeframe=overall_timeframe,
        explanation_text=overall_explanation,
        lesion_summary=json.dumps({
            "left_hotspots": left_res.get("hotspots", []) if left_res else [],
            "right_hotspots": right_res.get("hotspots", []) if right_res else []
        }),
        status="Completed" if overall_quality_passed else "Failed_Quality",
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(screening_db)
    db.commit()
    db.refresh(screening_db)

    return _format_screening_response(screening_db)


@router.post("/upload", response_model=ScreeningResponse)
async def upload_and_screen(
    patient_id: int = Form(...),
    eye: str = Form("both"),
    file: Optional[UploadFile] = File(None),
    left_eye: Optional[UploadFile] = File(None),
    right_eye: Optional[UploadFile] = File(None),
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Upload endpoint supporting single file or left/right eye dual capture.
    """
    return await screen_patient_image(
        patient_id=patient_id,
        eye=eye,
        file=file,
        left_eye=left_eye,
        right_eye=right_eye,
        current_user=current_user,
        db=db
    )


@router.post("/process-sample", response_model=ScreeningResponse)
def process_sample_case(
    sample_id: str = Body(..., embed=True),
    patient_id: int = Body(..., embed=True),
    eye: str = Body("both", embed=True),
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Runs full analysis on a pre-bundled IDRiD/APTOS sample image for instant demo verification.
    """
    patient = get_user_patient(db, patient_id, current_user.id)
    manifest_path = os.path.join(samples_dir, "manifest.json")
    
    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Sample manifest not found")
        
    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    target_sample = next((s for s in manifest if s["id"] == sample_id), None)
    if not target_sample:
        raise HTTPException(status_code=404, detail="Sample case not found")

    sample_img_path = os.path.join(samples_dir, target_sample["file_name"])
    img_bgr = cv2.imread(sample_img_path)
    if img_bgr is None:
        raise HTTPException(status_code=500, detail="Could not load sample image file")

    screening_code = f"SCR-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    quality_res = quality_checker.evaluate(img_bgr)

    if not quality_res["passed"]:
        screening_db = ScreeningDB(
            user_id=current_user.id,
            screening_code=screening_code,
            patient_id=patient.id,
            patient_code=patient.patient_code,
            eye=eye,
            left_image_path=f"/static/samples/{target_sample['file_name']}",
            right_image_path=f"/static/samples/{target_sample['file_name']}",
            quality_passed=False,
            quality_issues=json.dumps(quality_res["issues"]),
            quality_message=quality_res["message"],
            dr_grade=-1,
            dr_grade_name="Ungradeable (Quality Failed)",
            referable=False,
            confidence=0.0,
            confidence_tier="N/A",
            urgency_tier="Retake",
            suggested_timeframe="Immediate retake required",
            explanation_text=quality_res.get("recommendation", "Please recapture clear image."),
            lesion_summary="{}",
            status="Failed_Quality",
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(screening_db)
        db.commit()
        db.refresh(screening_db)
        return _format_screening_response(screening_db)

    ml_res = dr_pipeline.predict(img_bgr, generate_cam=True)

    cam_rel_path = f"images/{patient.id}/{screening_code}_{eye}_gradcam.jpg"
    if ml_res.get("gradcam_overlay_rgb") is not None:
        gradcam_bgr = cv2.cvtColor(ml_res["gradcam_overlay_rgb"], cv2.COLOR_RGB2BGR)
        gradcam_url = storage_manager.save_cv2_image(gradcam_bgr, cam_rel_path)
    else:
        gradcam_url = f"/static/samples/{target_sample['file_name']}"

    screening_db = ScreeningDB(
        user_id=current_user.id,
        screening_code=screening_code,
        patient_id=patient.id,
        patient_code=patient.patient_code,
        eye=eye,
        left_image_path=f"/static/samples/{target_sample['file_name']}",
        right_image_path=f"/static/samples/{target_sample['file_name']}",
        left_gradcam_path=gradcam_url,
        right_gradcam_path=gradcam_url,
        left_dr_grade=ml_res["dr_grade"],
        right_dr_grade=ml_res["dr_grade"],
        left_dr_grade_name=ml_res["dr_grade_name"],
        right_dr_grade_name=ml_res["dr_grade_name"],
        left_confidence=ml_res["confidence_pct"],
        right_confidence=ml_res["confidence_pct"],
        left_referable=ml_res["referable"],
        right_referable=ml_res["referable"],
        left_explanation=ml_res["explanation_text"],
        right_explanation=ml_res["explanation_text"],
        quality_passed=True,
        quality_issues=json.dumps([]),
        quality_message=quality_res["message"],
        dr_grade=ml_res["dr_grade"],
        dr_grade_name=ml_res["dr_grade_name"],
        referable=ml_res["referable"],
        confidence=ml_res["confidence_pct"],
        confidence_tier=ml_res["confidence_tier"],
        urgency_tier=ml_res["urgency_tier"],
        suggested_timeframe=ml_res["suggested_timeframe"],
        explanation_text=ml_res["explanation_text"],
        lesion_summary=json.dumps({
            "hotspots": ml_res.get("lesion_hotspots", []),
        }),
        status="Completed",
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(screening_db)
    db.commit()
    db.refresh(screening_db)

    return _format_screening_response(screening_db)


@router.get("", response_model=List[ScreeningResponse])
def list_screenings(
    limit: int = 50,
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    screenings = (
        db.query(ScreeningDB)
        .filter(ScreeningDB.user_id == current_user.id)
        .order_by(desc(ScreeningDB.created_at))
        .limit(limit)
        .all()
    )
    return [_format_screening_response(s) for s in screenings]


@router.get("/{screening_id}", response_model=ScreeningResponse)
def get_screening(
    screening_id: int,
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    screening = get_user_screening(db, screening_id, current_user.id)
    return _format_screening_response(screening)


def _format_screening_response(s: ScreeningDB) -> ScreeningResponse:
    issues = []
    if s.quality_issues:
        try:
            issues = json.loads(s.quality_issues)
        except Exception:
            issues = []

    lesion_sum = {}
    if s.lesion_summary:
        try:
            lesion_sum = json.loads(s.lesion_summary)
        except Exception:
            lesion_sum = {}

    return ScreeningResponse(
        id=s.id,
        screening_code=s.screening_code,
        patient_id=s.patient_id,
        patient_code=s.patient_code,
        eye=s.eye or "both",
        left_image_path=s.left_image_path,
        right_image_path=s.right_image_path,
        left_gradcam_path=s.left_gradcam_path,
        right_gradcam_path=s.right_gradcam_path,
        left_dr_grade=s.left_dr_grade,
        right_dr_grade=s.right_dr_grade,
        left_dr_grade_name=s.left_dr_grade_name,
        right_dr_grade_name=s.right_dr_grade_name,
        left_confidence=s.left_confidence,
        right_confidence=s.right_confidence,
        left_referable=s.left_referable,
        right_referable=s.right_referable,
        left_explanation=s.left_explanation,
        right_explanation=s.right_explanation,
        quality_passed=bool(s.quality_passed),
        quality_issues=issues,
        quality_message=s.quality_message or "",
        dr_grade=int(s.dr_grade),
        dr_grade_name=s.dr_grade_name or "No DR",
        referable=bool(s.referable),
        confidence=float(s.confidence),
        confidence_tier=s.confidence_tier or "High Confidence",
        urgency_tier=s.urgency_tier or "Routine",
        suggested_timeframe=s.suggested_timeframe or "Annual review",
        explanation_text=s.explanation_text or "",
        lesion_summary=lesion_sum,
        status=s.status or "Completed",
        created_at=s.created_at
    )
