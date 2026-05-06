# Chikungunya AI Diagnosis System

AI-powered chikungunya screening tool using symptom questionnaires and ML prediction.

## Architecture

- **Backend**: FastAPI (Python 3.12) with PostgreSQL + MongoDB
- **Frontend**: React 18 + Vite + TailwindCSS
- **ML**: XGBoost/RandomForest with SHAP explanations
- **Auth**: JWT access tokens (in-memory) + refresh tokens (httpOnly cookie)

## Quick Start

### 1. Start databases

```bash
docker-compose up -d postgres mongodb
```

### 2. Train the model

```bash
# Create virtual environment
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt

# Train model
python train.py --data chikungunya.csv --output backend/app/models/
```

### 3. Run backend

```bash
cd backend
cp .env.example .env  # Edit as needed
uvicorn app.main:app --reload
```

### 4. Run frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Or run everything with Docker

```bash
docker-compose up --build
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── core/              # Config, security
│   │   ├── db/                # Database connection, ORM models
│   │   ├── auth/              # Authentication endpoints & logic
│   │   ├── diagnosis/         # Diagnosis endpoints, ML inference
│   │   ├── admin/             # Admin endpoints
│   │   └── models/            # Trained model artefacts (gitignored)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── store/AuthContext.jsx
│   │   ├── services/api.js
│   │   ├── pages/
│   │   └── components/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── train.py                   # ML training script
├── chikungunya.csv            # Training dataset
├── docker-compose.yml
└── ARCHITECTURE.md
```

## Roles

| Role | Permissions |
|------|-------------|
| Patient | Submit diagnosis, view own history |
| Healthcare Worker | All patient permissions + view all records |
| Admin | Full access including user management & analytics |

## API

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (OAuth2 form)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/diagnosis/submit` - Submit symptoms for prediction
- `GET /api/v1/diagnosis/my-history` - User's diagnosis history
- `GET /api/v1/diagnosis/all-records` - All records (healthcare worker+)
- `GET /api/v1/admin/users` - List users (admin)
- `GET /api/v1/admin/analytics` - System analytics (admin)
- `GET /api/v1/admin/model-metrics` - Model evaluation report (admin)
