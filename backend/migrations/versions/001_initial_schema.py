"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-01 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=120), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=True, server_default="health_worker"),
        sa.Column('clinic_location', sa.String(length=150), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('patient_code', sa.String(length=50), nullable=False),
        sa.Column('full_name', sa.String(length=120), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(length=20), nullable=False),
        sa.Column('village', sa.String(length=120), nullable=False),
        sa.Column('diabetes_duration_years', sa.Float(), nullable=True, server_default="0.0"),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('consent_given', sa.Boolean(), nullable=True, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_patients_patient_code'), 'patients', ['patient_code'], unique=True)
    op.create_index(op.f('ix_patients_id'), 'patients', ['id'], unique=False)

    # 3. screenings table
    op.create_table(
        'screenings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('screening_code', sa.String(length=50), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('patient_code', sa.String(length=50), nullable=False),
        sa.Column('eye', sa.String(length=10), nullable=True, server_default="both"),
        sa.Column('left_image_path', sa.String(length=255), nullable=True),
        sa.Column('right_image_path', sa.String(length=255), nullable=True),
        sa.Column('left_gradcam_path', sa.String(length=255), nullable=True),
        sa.Column('right_gradcam_path', sa.String(length=255), nullable=True),
        sa.Column('quality_passed', sa.Boolean(), nullable=True, server_default=sa.true()),
        sa.Column('quality_issues', sa.Text(), nullable=True, server_default="[]"),
        sa.Column('quality_message', sa.Text(), nullable=True),
        sa.Column('dr_grade', sa.Integer(), nullable=True, server_default="0"),
        sa.Column('dr_grade_name', sa.String(length=80), nullable=True),
        sa.Column('referable', sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column('confidence', sa.Float(), nullable=True, server_default="0.0"),
        sa.Column('confidence_tier', sa.String(length=30), nullable=True),
        sa.Column('urgency_tier', sa.String(length=30), nullable=True),
        sa.Column('suggested_timeframe', sa.String(length=80), nullable=True),
        sa.Column('explanation_text', sa.Text(), nullable=True),
        sa.Column('lesion_summary', sa.Text(), nullable=True, server_default="{}"),
        sa.Column('status', sa.String(length=30), nullable=True, server_default="Completed"),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_screenings_screening_code'), 'screenings', ['screening_code'], unique=True)
    op.create_index(op.f('ix_screenings_id'), 'screenings', ['id'], unique=False)

    # 4. referrals table
    op.create_table(
        'referrals',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('referral_code', sa.String(length=50), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('patient_code', sa.String(length=50), nullable=False),
        sa.Column('patient_name', sa.String(length=120), nullable=False),
        sa.Column('screening_id', sa.Integer(), nullable=False),
        sa.Column('dr_grade', sa.Integer(), nullable=True, server_default="2"),
        sa.Column('dr_grade_name', sa.String(length=80), nullable=True),
        sa.Column('urgency', sa.String(length=30), nullable=True, server_default="Priority"),
        sa.Column('target_facility', sa.String(length=150), nullable=True),
        sa.Column('referral_reason', sa.Text(), nullable=True),
        sa.Column('suggested_timeframe', sa.String(length=80), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=True, server_default="Pending"),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_referrals_referral_code'), 'referrals', ['referral_code'], unique=True)
    op.create_index(op.f('ix_referrals_id'), 'referrals', ['id'], unique=False)

    # 5. sync_queue table
    op.create_table(
        'sync_queue',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=50), nullable=False),
        sa.Column('payload_json', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=True, server_default="Pending"),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default="0"),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('synced_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_sync_queue_id'), 'sync_queue', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('sync_queue')
    op.drop_table('referrals')
    op.drop_table('screenings')
    op.drop_table('patients')
    op.drop_table('users')

