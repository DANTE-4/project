"""
tests/test_auth.py — Auth endpoint integration tests
Uses httpx AsyncClient against the full FastAPI app.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.database import get_db, Base

# ── Test DB (SQLite in-memory for speed) ─────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="module", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://localhost"
    ) as c:
        yield c


# ── Tests ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client):
    res = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Secure123",
        "full_name": "Test User",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "patient"
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post("/api/v1/auth/register", json={
        "email": "dupe@example.com",
        "password": "Secure123",
    })
    res = await client.post("/api/v1/auth/register", json={
        "email": "dupe@example.com",
        "password": "Secure123",
    })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_register_weak_password(client):
    res = await client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "password": "weak",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "password": "Secure123",
    })
    res = await client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "Secure123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    res = await client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "wrongpass"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(client):
    res = await client.get("/api/v1/diagnosis/my-history")
    assert res.status_code == 401
