"""
diagnosis/router.py — Diagnosis endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.auth.dependencies import get_current_user, require_any_authenticated, require_healthcare_or_admin
from app.diagnosis.schemas import QuestionnaireInput, DiagnosisResponse, DiagnosisHistoryItem
from app.diagnosis import service

router = APIRouter()


@router.post("/submit", response_model=DiagnosisResponse)
async def submit_diagnosis(
    payload: QuestionnaireInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """Submit symptoms and get AI prediction."""
    return await service.submit_diagnosis(
        payload=payload,
        user_id=current_user.id,
        submitted_by=current_user.id,
        db=db,
    )


@router.get("/my-history", response_model=list[DiagnosisHistoryItem])
async def my_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """Get current user's diagnosis history."""
    records = await service.get_my_history(current_user.id, db)
    return records


@router.get("/all-records", response_model=list[DiagnosisHistoryItem])
async def all_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_healthcare_or_admin),
):
    """Get all diagnosis records (healthcare worker + admin only)."""
    records = await service.get_all_records(db)
    return records
