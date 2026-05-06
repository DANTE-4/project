# System Architecture

## Actors

| Actor | Role | Permissions |
|-------|------|-------------|
| **Patient / General User** | Submits symptom questionnaire; views diagnosis result | Public registration, submit diagnosis, view own history |
| **Healthcare Worker** | Submits diagnoses on behalf of patients; views aggregated results | All patient permissions + view patient list + export records |
| **Admin** | Manages users, monitors system, views analytics dashboard | Full access — user management, system logs, model metrics |
| **ML System (Internal)** | Pre-trained model that scores incoming symptom data | No external auth; internal service-to-service call only |

---

## Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                           │
│                                                                 │
│   ┌──────────────────┐        ┌──────────────────────────────┐  │
│   │  Patient Browser │        │  Healthcare Worker Browser   │  │
│   │  (React SPA)     │        │  (React SPA - extended UI)   │  │
│   └────────┬─────────┘        └──────────────┬───────────────┘  │
└────────────┼──────────────────────────────────┼─────────────────┘
             │ HTTPS (TLS 1.3)                  │
┌────────────▼──────────────────────────────────▼─────────────────┐
│                        API GATEWAY                              │
│              FastAPI — /api/v1/...                              │
│         Rate Limiting | CORS | Request Validation               │
│                                                                 │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────────┐  │
│  │ /auth      │  │ /diagnosis     │  │ /admin               │  │
│  │ login      │  │ submit         │  │ users                │  │
│  │ register   │  │ history        │  │ analytics            │  │
│  │ refresh    │  │ explain        │  │ model-metrics        │  │
│  └─────┬──────┘  └───────┬────────┘  └──────────────────────┘  │
└────────┼─────────────────┼───────────────────────────────────────┘
         │                 │
┌────────▼─────┐  ┌────────▼──────────────────────────────────────┐
│  Auth Service│  │               ML Inference Service            │
│  JWT + bcrypt│  │  model.predict(features) → probability score  │
│  Roles/Perms │  │  CalibratedClassifierCV → reliable scores     │
│              │  │  SHAP explainer → symptom importance scores   │
└────────┬─────┘  └────────┬──────────────────────────────────────┘
         │                 │
┌────────▼─────────────────▼─────────────────────────────────────┐
│                      DATA LAYER                                 │
│                                                                 │
│  ┌─────────────────────┐                                        │
│  │   PostgreSQL         │                                        │
│  │  - users            │                                        │
│  │  - diagnosis_records│                                        │
│  │  - audit_logs       │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization Flow

```
1. User visits /login
2. POST /api/v1/auth/login  { email, password }
3. Server verifies password (bcrypt), returns:
   - access_token  (JWT, 30 min TTL)
   - refresh_token (JWT, 7 day TTL, stored httpOnly cookie)
4. Frontend stores access_token in memory (NOT localStorage)
5. All protected API calls: Authorization: Bearer <access_token>
6. Token expired → POST /api/v1/auth/refresh (uses httpOnly cookie)
7. Role embedded in JWT payload: { sub: user_id, role: "patient"|"healthcare_worker"|"admin" }
```

### Role Permission Matrix

| Endpoint | Patient | Healthcare Worker | Admin |
|----------|---------|-------------------|-------|
| POST /auth/register | ✅ | ✅ | ✅ |
| POST /diagnosis/submit | ✅ | ✅ | ✅ |
| GET /diagnosis/my-history | ✅ | ✅ | ✅ |
| GET /diagnosis/all-records | ❌ | ✅ | ✅ |
| GET /admin/users | ❌ | ❌ | ✅ |
| GET /admin/analytics | ❌ | ❌ | ✅ |
| GET /admin/model-metrics | ❌ | ❌ | ✅ |

---

## ML Pipeline Architecture

```
RAW DATA (18,887 records, Recife Open Data)
    │
    ▼
[PREPROCESSING]
  - Remove duplicates
  - Impute missing: mean (continuous), mode (categorical)
  - Normalize: StandardScaler (SVM, NN)
  - Encode: OneHotEncoder (categorical symptoms)
    │
    ▼
[FEATURE SELECTION]
  - Recursive Feature Elimination (RFE)
  - Random Forest Feature Importance
  - Output: ~20-30 most predictive features
    │
    ▼
[MODEL TRAINING — 70/30 split]
  ┌──────────────────────────────────────┐
  │  1. XGBoost (primary)               │
  │  2. Random Forest (interpretable)   │
  │  3. SVM                             │
  │  4. Neural Network (Keras)          │
  │  5. Logistic Regression (baseline)  │
  └──────────────────────────────────────┘
  - Grid Search hyperparameter tuning
  - k-fold cross-validation (k=10)
    │
    ▼
[EVALUATION]
  - Accuracy, Precision, Recall, F1
  - ROC-AUC
  - Best model serialized to models/best_model.pkl
    │
    ▼
[INFERENCE API]
  POST /diagnosis/submit
  → preprocess input
  → model.predict_proba()
  → SHAP explanation
  → store result + return to client
```

---

## Data Models

### PostgreSQL — users table
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name   VARCHAR(255),
  role        VARCHAR(50) DEFAULT 'patient',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### PostgreSQL — diagnosis_records table
```sql
CREATE TABLE diagnosis_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  submitted_by    UUID REFERENCES users(id),  -- could be HW submitting for patient
  prediction      VARCHAR(50) NOT NULL,        -- 'positive' | 'negative'
  confidence_score DECIMAL(5,4) NOT NULL,      -- 0.0000 to 1.0000
  model_version   VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### MongoDB — symptom_submissions collection
```json
{
  "_id": "ObjectId",
  "diagnosis_record_id": "UUID (FK to postgres)",
  "user_id": "UUID",
  "submitted_at": "ISODate",
  "questionnaire": {
    "demographics": {
      "age_group": "18-30",
      "sex": "female"
    },
    "symptoms": {
      "sudden_fever": true,
      "joint_pain": true,
      "rash": false,
      "headache": true,
      "muscle_pain": true,
      "fatigue": true,
      "chills": false,
      "nausea": false
    },
    "exposure": {
      "recent_travel": false,
      "mosquito_exposure": true,
      "known_contact_with_case": false
    },
    "duration_days": 3
  },
  "shap_explanation": {
    "top_features": [
      { "feature": "joint_pain", "value": 0.42 },
      { "feature": "sudden_fever", "value": 0.31 }
    ]
  }
}
```

---

## Security Architecture

| Concern | Approach |
|---------|---------|
| Password storage | bcrypt (cost factor 12) |
| Tokens | JWT signed with HS256 / RS256 |
| Access token storage | In-memory (JS variable), NOT localStorage |
| Refresh token storage | httpOnly, Secure, SameSite=Strict cookie |
| Transport | TLS 1.3 minimum |
| Data at rest | AES-256 (DB encryption, S3 SSE) |
| Input validation | Pydantic v2 on all API inputs |
| Rate limiting | 10 req/min on /auth endpoints |
| CORS | Whitelist only known frontend origins |
| Audit logs | Every diagnosis submission logged with user_id, timestamp, IP |

---

## Deployment Architecture

```
Developer pushes → GitHub Actions CI
    → Run tests (pytest + Vitest)
    → Build Docker images
    → Push to ECR / Docker Hub
    → Deploy to AWS ECS (backend) + S3+CloudFront (frontend)

Services:
  - Backend: AWS ECS Fargate (auto-scaling)
  - PostgreSQL: AWS RDS PostgreSQL
  - MongoDB: MongoDB Atlas
  - Frontend: S3 + CloudFront CDN
  - Secrets: AWS Secrets Manager
  - Monitoring: AWS CloudWatch + Sentry
```
