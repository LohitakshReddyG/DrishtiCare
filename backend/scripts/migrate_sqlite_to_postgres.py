"""
DrishtiCare - SQLite to PostgreSQL Database Migration Utility
Transfers local pilot data from SQLite to a remote managed PostgreSQL database (Supabase, Railway, Neon, AWS RDS).
"""

import sys
import os
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.models.schemas import Base, UserDB, PatientDB, ScreeningDB, ReferralDB, SyncQueueDB


def migrate_database(sqlite_url: str, postgres_url: str):
    print(f"[Migration] Connecting to Source SQLite: {sqlite_url}")
    sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_db = SqliteSession()

    print(f"[Migration] Connecting to Target PostgreSQL: {postgres_url}")
    pg_engine = create_engine(postgres_url, pool_pre_ping=True)
    
    # 1. Create target schema
    print("[Migration] Creating tables in PostgreSQL schema...")
    Base.metadata.create_all(bind=pg_engine)
    
    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    try:
        # 2. Migrate Users
        users = sqlite_db.query(UserDB).all()
        print(f"[Migration] Migrating {len(users)} User records...")
        for u in users:
            if not pg_db.query(UserDB).filter(UserDB.id == u.id).first():
                pg_db.add(UserDB(
                    id=u.id, username=u.username, email=u.email, hashed_password=u.hashed_password,
                    full_name=u.full_name, role=u.role, clinic_location=u.clinic_location,
                    is_active=u.is_active, created_at=u.created_at
                ))
        pg_db.commit()

        # 3. Migrate Patients
        patients = sqlite_db.query(PatientDB).all()
        print(f"[Migration] Migrating {len(patients)} Patient records...")
        for p in patients:
            if not pg_db.query(PatientDB).filter(PatientDB.id == p.id).first():
                pg_db.add(PatientDB(
                    id=p.id, patient_code=p.patient_code, full_name=p.full_name,
                    age=p.age, gender=p.gender, village=p.village,
                    diabetes_duration_years=p.diabetes_duration_years,
                    phone=p.phone, consent_given=p.consent_given, created_at=p.created_at
                ))
        pg_db.commit()

        # 4. Migrate Screenings
        screenings = sqlite_db.query(ScreeningDB).all()
        print(f"[Migration] Migrating {len(screenings)} Screening records...")
        for s in screenings:
            if not pg_db.query(ScreeningDB).filter(ScreeningDB.id == s.id).first():
                pg_db.add(ScreeningDB(
                    id=s.id, screening_code=s.screening_code, patient_id=s.patient_id,
                    patient_code=s.patient_code, eye=s.eye, left_image_path=s.left_image_path,
                    right_image_path=s.right_image_path, left_gradcam_path=s.left_gradcam_path,
                    right_gradcam_path=s.right_gradcam_path, quality_passed=s.quality_passed,
                    quality_issues=s.quality_issues, quality_message=s.quality_message,
                    dr_grade=s.dr_grade, dr_grade_name=s.dr_grade_name, referable=s.referable,
                    confidence=s.confidence, confidence_tier=s.confidence_tier,
                    urgency_tier=s.urgency_tier, suggested_timeframe=s.suggested_timeframe,
                    explanation_text=s.explanation_text, lesion_summary=s.lesion_summary,
                    status=s.status, created_at=s.created_at
                ))
        pg_db.commit()

        # 5. Migrate Referrals
        referrals = sqlite_db.query(ReferralDB).all()
        print(f"[Migration] Migrating {len(referrals)} Referral records...")
        for r in referrals:
            if not pg_db.query(ReferralDB).filter(ReferralDB.id == r.id).first():
                pg_db.add(ReferralDB(
                    id=r.id, referral_code=r.referral_code, patient_id=r.patient_id,
                    patient_code=r.patient_code, patient_name=r.patient_name,
                    screening_id=r.screening_id, dr_grade=r.dr_grade, dr_grade_name=r.dr_grade_name,
                    urgency=r.urgency, target_facility=r.target_facility,
                    referral_reason=r.referral_reason, suggested_timeframe=r.suggested_timeframe,
                    notes=r.notes, status=r.status, created_at=r.created_at
                ))
        pg_db.commit()

        # 6. Migrate Sync Queue
        sync_items = sqlite_db.query(SyncQueueDB).all()
        print(f"[Migration] Migrating {len(sync_items)} Sync Queue items...")
        for sq in sync_items:
            if not pg_db.query(SyncQueueDB).filter(SyncQueueDB.id == sq.id).first():
                pg_db.add(SyncQueueDB(
                    id=sq.id, entity_type=sq.entity_type, entity_id=sq.entity_id,
                    payload_json=sq.payload_json, status=sq.status, retry_count=sq.retry_count,
                    error_message=sq.error_message, created_at=sq.created_at, synced_at=sq.synced_at
                ))
        pg_db.commit()

        print("\n[SUCCESS] All data successfully migrated from SQLite to PostgreSQL!")
    except Exception as e:
        pg_db.rollback()
        print(f"[Migration Error] {e}")
        raise e
    finally:
        sqlite_db.close()
        pg_db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python migrate_sqlite_to_postgres.py <sqlite_url> <postgres_url>")
        print("Example: python migrate_sqlite_to_postgres.py sqlite:///./data/drishticare.db postgresql://user:pass@db.supabase.co:5432/postgres")
        sys.exit(1)
    migrate_database(sys.argv[1], sys.argv[2])

