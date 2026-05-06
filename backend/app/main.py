"""
main.py — FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import create_tables
from app.auth.router import router as auth_router
from app.diagnosis.router import router as diagnosis_router
from app.admin.router import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    await create_tables()
    yield


app = FastAPI(
    title="Chikungunya AI Diagnosis API",
    description="AI-based chikungunya virus prediction system.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

app.include_router(auth_router,      prefix="/api/v1/auth",      tags=["Auth"])
app.include_router(diagnosis_router, prefix="/api/v1/diagnosis",  tags=["Diagnosis"])
app.include_router(admin_router,     prefix="/api/v1/admin",      tags=["Admin"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
