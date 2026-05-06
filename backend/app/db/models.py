"""
db/models.py — SQLAlchemy ORM models (PostgreSQL)
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, ForeignKey, TypeDecorator, CHAR, Float, JSON
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import enum

from app.db.database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32) as fallback.
    """
    impl = CHAR(32)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return value.hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            if isinstance(value, str):
                value = uuid.UUID(hex=value)
            else:
                value = uuid.UUID(bytes=value)
        return value


class UserRole(str, enum.Enum):
    patient = "patient"
    healthcare_worker = "healthcare_worker"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole), default=UserRole.patient, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    diagnosis_records: Mapped[list["DiagnosisRecord"]] = relationship(
        back_populates="user", lazy="select", foreign_keys="DiagnosisRecord.user_id"
    )


class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID, ForeignKey("users.id"), nullable=False, index=True
    )
    submitted_by: Mapped[uuid.UUID] = mapped_column(
        GUID, ForeignKey("users.id"), nullable=False
    )
    prediction: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(50))
    questionnaire_data: Mapped[dict | None] = mapped_column(JSON)
    shap_explanation: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(
        "User", foreign_keys=[user_id], back_populates="diagnosis_records"
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(GUID, nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(50))
    detail: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
