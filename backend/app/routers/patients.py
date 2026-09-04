import datetime
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.schemas import PatientDB, PatientCreate, PatientResponse, UserDB, get_db
from backend.app.routers.auth import require_auth
from backend.app.utils.tenant import get_user_patient

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse)
def register_patient(
    patient: PatientCreate,
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    if not patient.patient_code or patient.patient_code.strip() == "":
        random_suffix = random.randint(1000, 9999)
        patient_code = f"PAT-U{current_user.id}-{random_suffix}"
    else:
        patient_code = patient.patient_code.strip()

    existing = (
        db.query(PatientDB)
        .filter(
            PatientDB.user_id == current_user.id,
            PatientDB.patient_code == patient_code,
        )
        .first()
    )
    if existing:
        patient_code = f"{patient_code}-{random.randint(10, 99)}"

    new_patient = PatientDB(
        user_id=current_user.id,
        patient_code=patient_code,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        village=patient.village,
        diabetes_duration_years=patient.diabetes_duration_years,
        phone=patient.phone,
        consent_given=patient.consent_given,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.get("", response_model=List[PatientResponse])
def list_patients(
    limit: int = 100,
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    return (
        db.query(PatientDB)
        .filter(PatientDB.user_id == current_user.id)
        .order_by(desc(PatientDB.created_at))
        .limit(limit)
        .all()
    )


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    current_user: UserDB = Depends(require_auth),
    db: Session = Depends(get_db)
):
    return get_user_patient(db, patient_id, current_user.id)
