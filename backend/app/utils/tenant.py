"""Per-user data access helpers — all clinical records are scoped to the authenticated health worker."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.schemas import PatientDB, ScreeningDB, ReferralDB


def get_user_patient(db: Session, patient_id: int, user_id: int) -> PatientDB:
    patient = (
        db.query(PatientDB)
        .filter(PatientDB.id == patient_id, PatientDB.user_id == user_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def get_user_screening(db: Session, screening_id: int, user_id: int) -> ScreeningDB:
    screening = (
        db.query(ScreeningDB)
        .filter(ScreeningDB.id == screening_id, ScreeningDB.user_id == user_id)
        .first()
    )
    if not screening:
        raise HTTPException(status_code=404, detail="Screening record not found")
    return screening


def get_user_referral(db: Session, referral_id: int, user_id: int) -> ReferralDB:
    referral = (
        db.query(ReferralDB)
        .filter(ReferralDB.id == referral_id, ReferralDB.user_id == user_id)
        .first()
    )
    if not referral:
        raise HTTPException(status_code=404, detail="Referral record not found")
    return referral
