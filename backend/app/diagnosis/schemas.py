"""
diagnosis/schemas.py — Pydantic schemas for diagnosis submission and results
"""
from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class DemographicsInput(BaseModel):
    age_group: str = "18-30"
    sex: str = "female"


class QuestionnaireInput(BaseModel):
    demographics: DemographicsInput
    symptoms: dict[str, bool]
    exposure: dict[str, bool]
    duration_days: int = Field(ge=0, le=90)


class SHAPFeature(BaseModel):
    feature: str
    impact: float


class DiagnosisResponse(BaseModel):
    prediction: str                       # "positive" | "negative"
    confidence_score: float
    risk_level: str                       # "low" | "moderate" | "high"
    top_contributing_factors: list[SHAPFeature]
    disclaimer: str


class DiagnosisHistoryItem(BaseModel):
    id: uuid.UUID
    prediction: str
    confidence_score: float
    model_version: str | None
    questionnaire_data: dict | None
    shap_explanation: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
