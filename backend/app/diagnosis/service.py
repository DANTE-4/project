"""
diagnosis/service.py — ML inference + SHAP explanation + storage
"""
import pickle
import logging
import uuid
from pathlib import Path
from typing import Any

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import shap

from app.core.config import settings
from app.db.models import DiagnosisRecord, UserRole
from app.diagnosis.schemas import QuestionnaireInput, DiagnosisResponse, SHAPFeature

log = logging.getLogger(__name__)

_model: Any = None
_scaler: Any = None
_encoder: Any = None
_feature_names: list[str] | None = None


def _load_artefacts():
    """Lazy-load ML artefacts on first inference call."""
    global _model, _scaler, _encoder, _feature_names
    if _model is not None:
        return

    model_path = Path(settings.MODEL_PATH)
    scaler_path = Path(settings.SCALER_PATH)
    encoder_path = Path(settings.ENCODER_PATH)

    if not model_path.exists():
        raise RuntimeError(
            f"Model not found at {settings.MODEL_PATH}. Run `python train.py` first."
        )

    with open(model_path, "rb") as f:
        _model = pickle.load(f)
    with open(scaler_path, "rb") as f:
        _scaler = pickle.load(f)
    with open(encoder_path, "rb") as f:
        _encoder = pickle.load(f)

    # Reconstruct feature names to match training order
    age_groups = ["age_group_0-17", "age_group_18-30", "age_group_31-45", "age_group_46-60", "age_group_60+"]
    sex_cols = list(_encoder.get_feature_names_out(["sex"]))
    boolean_features = [
        "sudden_fever", "joint_pain", "rash", "headache",
        "muscle_pain", "fatigue", "chills", "nausea",
        "eye_redness", "swollen_joints",
    ]
    exposure_features = [
        "recent_travel", "mosquito_exposure",
        "known_contact_with_case", "standing_water_nearby",
    ]
    _feature_names = age_groups + sex_cols + boolean_features + exposure_features + ["duration_days"]
    log.info(f"ML artefacts loaded — model={type(_model).__name__}, features={len(_feature_names)}")


def _prepare_features(payload: QuestionnaireInput) -> np.ndarray:
    """Transform questionnaire input into model-ready feature vector."""
    # One-hot encode sex
    sex_df = [{"sex": payload.demographics.sex}]
    import pandas as pd
    sex_encoded = _encoder.transform(pd.DataFrame(sex_df))

    # Age group: one-hot encode manually to match training order
    age_groups = ["0-17", "18-30", "31-45", "46-60", "60+"]
    age_vec = np.zeros((1, len(age_groups)), dtype=int)
    age_idx = age_groups.index(payload.demographics.age_group)
    age_vec[0, age_idx] = 1

    # Symptom boolean features
    symptom_features = [
        "sudden_fever", "joint_pain", "rash", "headache",
        "muscle_pain", "fatigue", "chills", "nausea",
        "eye_redness", "swollen_joints",
    ]
    symptom_vec = np.array([[int(payload.symptoms.get(k, False)) for k in symptom_features]])

    # Exposure boolean features (merge exposure dict with symptoms for lookup)
    exposure_features = [
        "recent_travel", "mosquito_exposure",
        "known_contact_with_case", "standing_water_nearby",
    ]
    all_bools = {**payload.symptoms, **payload.exposure}
    exposure_vec = np.array([[int(all_bools.get(k, False)) for k in exposure_features]])

    # Duration days (scale)
    num_vec = np.array([[float(payload.duration_days)]])
    num_vec = _scaler.transform(num_vec)

    return np.hstack([age_vec, sex_encoded, symptom_vec, exposure_vec, num_vec])


def _classify_risk(prob: float) -> str:
    if prob >= 0.7:
        return "high"
    elif prob >= 0.4:
        return "moderate"
    return "low"


_DISCLAIMER = (
    "This is an AI-assisted screening tool, not a definitive medical diagnosis. "
    "Please consult a qualified healthcare professional for proper evaluation and treatment."
)


async def submit_diagnosis(
    payload: QuestionnaireInput,
    user_id: uuid.UUID,
    submitted_by: uuid.UUID,
    db: AsyncSession,
) -> DiagnosisResponse:
    _load_artefacts()

    X = _prepare_features(payload)
    prob = float(_model.predict_proba(X)[0, 1])
    prediction = "positive" if prob >= 0.5 else "negative"
    risk_level = _classify_risk(prob)

    # SHAP explanation
    try:
        explainer = shap.TreeExplainer(_model)
        shap_values = explainer.shap_values(X)
        if shap_values.ndim > 1 and shap_values.shape[-1] == 2:
            shap_values = shap_values[:, 1]
        top_indices = np.argsort(np.abs(shap_values[0]))[::-1][:5]
        top_factors = [
            SHAPFeature(
                feature=_feature_names[i],
                impact=float(shap_values[0, i]),
            )
            for i in top_indices
        ]
    except Exception as e:
        log.warning(f"SHAP explanation failed: {e}")
        top_factors = []

    # Store in PostgreSQL
    record = DiagnosisRecord(
        user_id=user_id,
        submitted_by=submitted_by,
        prediction=prediction,
        confidence_score=prob,
        model_version=settings.MODEL_VERSION,
        questionnaire_data=payload.model_dump(),
        shap_explanation={
            "top_features": [
                {"feature": f.feature, "impact": f.impact} for f in top_factors
            ]
        },
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return DiagnosisResponse(
        prediction=prediction,
        confidence_score=prob,
        risk_level=risk_level,
        top_contributing_factors=top_factors,
        disclaimer=_DISCLAIMER,
    )


async def get_my_history(user_id: uuid.UUID, db: AsyncSession) -> list[DiagnosisRecord]:
    result = await db.execute(
        select(DiagnosisRecord)
        .where(DiagnosisRecord.user_id == user_id)
        .order_by(DiagnosisRecord.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all_records(db: AsyncSession) -> list[DiagnosisRecord]:
    result = await db.execute(
        select(DiagnosisRecord).order_by(DiagnosisRecord.created_at.desc())
    )
    return list(result.scalars().all())
