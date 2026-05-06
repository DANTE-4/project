"""
admin/router.py — Admin-only endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.db.models import User, UserRole, DiagnosisRecord, AuditLog
from app.auth.dependencies import require_admin
from app.auth.schemas import UserResponse

router = APIRouter()


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all registered users."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """System analytics: user counts, diagnosis stats, positive rate."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_diagnoses = (await db.execute(select(func.count(DiagnosisRecord.id)))).scalar()
    positive_count = (
        await db.execute(
            select(func.count(DiagnosisRecord.id)).where(DiagnosisRecord.prediction == "positive")
        )
    ).scalar()

    return {
        "total_users": total_users,
        "total_diagnoses": total_diagnoses,
        "positive_count": positive_count,
        "positive_rate": round(positive_count / total_diagnoses, 4) if total_diagnoses else 0,
    }


@router.get("/model-metrics")
async def get_model_metrics(
    _admin: User = Depends(require_admin),
):
    """Return stored evaluation report."""
    from pathlib import Path
    report_path = Path("app/models/evaluation_report.txt")
    if report_path.exists():
        return {"report": report_path.read_text()}
    return {"report": "No evaluation report available. Train the model first."}
