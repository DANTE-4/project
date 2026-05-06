"""
ml/train.py — Train, evaluate and serialize the best chikungunya prediction model.

Usage:
    python train.py --data chikungunya.csv --output backend/app/models/

Dataset: Chikungunya symptom dataset
Target column: 'Severe Chikungunya' (yes = positive, no = negative)

CSV columns mapping:
    sex -> demographics (categorical)
    fever -> sudden_fever
    cold -> chills (proxy)
    joint pains -> joint_pain
    myalgia -> muscle_pain
    headache -> headache
    fatigue -> fatigue
    vomitting -> nausea (proxy)
    arthritis -> swollen_joints (proxy)
    Conjuctivitis -> eye_redness
    Nausea -> nausea
    Maculopapular rash -> rash
    Eye Pain -> eye_redness (combined with Conjuctivitis)
    Chills -> chills
    Swelling -> swollen_joints (combined with arthritis)

Note: age_group, duration_days, and exposure features are not in the raw CSV.
The service layer will handle missing features gracefully during inference.
"""
import argparse
import pickle
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report,
)
from sklearn.calibration import CalibratedClassifierCV
import xgboost as xgb

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# Raw CSV column names
CSV_SEX = "sex"
CSV_SYMPTOMS = [
    "fever", "cold", "joint pains", "myalgia", "headache",
    "fatigue", "vomitting", "arthritis", "Conjuctivitis",
    "Nausea", "Maculopapular rash", "Eye Pain", "Chills", "Swelling",
]
CSV_TARGET = "Severe Chikungunya"

# Canonical feature names used by the service layer
CANONICAL_FEATURES = [
    "age_group_0-17", "age_group_18-30", "age_group_31-45",
    "age_group_46-60", "age_group_60+",
    "sex_female", "sex_male", "sex_other",
    "sudden_fever", "joint_pain", "rash", "headache",
    "muscle_pain", "fatigue", "chills", "nausea",
    "eye_redness", "swollen_joints",
    "recent_travel", "mosquito_exposure",
    "known_contact_with_case", "standing_water_nearby",
    "duration_days",
]

# Mapping from CSV symptom columns to canonical feature names
SYMPTOM_MAP = {
    "fever": "sudden_fever",
    "joint pains": "joint_pain",
    "myalgia": "muscle_pain",
    "headache": "headache",
    "fatigue": "fatigue",
    "vomitting": "nausea",
    "arthritis": "swollen_joints",
    "Conjuctivitis": "eye_redness",
    "Nausea": "nausea",
    "Maculopapular rash": "rash",
    "Eye Pain": "eye_redness",
    "Chills": "chills",
    "Swelling": "swollen_joints",
}


def load_and_preprocess(csv_path: str):
    log.info(f"Loading dataset from {csv_path}")
    df = pd.read_csv(csv_path)
    log.info(f"Loaded {len(df)} records, columns: {list(df.columns)}")

    # Drop fully empty columns (the CSV has trailing empty columns)
    df = df.dropna(axis=1, how="all")
    # Strip whitespace from column names
    df.columns = df.columns.str.strip()

    # Drop rows missing the target
    df = df.dropna(subset=[CSV_TARGET])

    # Convert target to binary
    df["target"] = df[CSV_TARGET].str.strip().str.lower().map({"yes": 1, "no": 0})
    df = df.dropna(subset=["target"])
    df["target"] = df["target"].astype(int)

    log.info(f"After cleaning: {len(df)} records, class balance: {df['target'].mean():.2%} positive")

    # Map symptoms to canonical names, combining duplicates with OR logic
    symptom_features = {}
    for csv_col, canonical in SYMPTOM_MAP.items():
        if csv_col in df.columns:
            vals = df[csv_col].str.strip().str.lower().map({"yes": 1, "no": 0}).fillna(0).astype(int)
            if canonical in symptom_features:
                symptom_features[canonical] = (symptom_features[canonical] | vals).astype(int)
            else:
                symptom_features[canonical] = vals

    # Build boolean feature matrix in canonical order
    boolean_features = [
        "sudden_fever", "joint_pain", "rash", "headache",
        "muscle_pain", "fatigue", "chills", "nausea",
        "eye_redness", "swollen_joints",
    ]
    bool_matrix = np.column_stack([
        symptom_features.get(f, np.zeros(len(df), dtype=int))
        for f in boolean_features
    ])

    # One-hot encode sex
    encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    sex_encoded = encoder.fit_transform(df[[CSV_SEX]])
    sex_feature_names = list(encoder.get_feature_names_out([CSV_SEX]))

    # Age group: not in CSV, encode as all zeros for training (will be provided at inference)
    age_groups = ["age_group_0-17", "age_group_18-30", "age_group_31-45", "age_group_46-60", "age_group_60+"]
    age_matrix = np.zeros((len(df), len(age_groups)), dtype=int)
    # Default to 18-30 as the most common group
    age_18_30_idx = age_groups.index("age_group_18-30")
    age_matrix[:, age_18_30_idx] = 1

    # Exposure features: not in CSV, encode as all zeros
    exposure_features = ["recent_travel", "mosquito_exposure", "known_contact_with_case", "standing_water_nearby"]
    exposure_matrix = np.zeros((len(df), len(exposure_features)), dtype=int)

    # Duration days: not in CSV, use a placeholder value (will be scaled)
    duration_matrix = np.ones((len(df), 1), dtype=float) * 3.0  # default 3 days

    # Combine all features
    X = np.hstack([
        age_matrix,        # 5 cols
        sex_encoded,       # 2-3 cols depending on unique values
        bool_matrix,       # 10 cols
        exposure_matrix,   # 4 cols
        duration_matrix,   # 1 col
    ])

    feature_names = age_groups + sex_feature_names + boolean_features + exposure_features + ["duration_days"]

    y = df["target"].values

    log.info(f"Feature matrix: {X.shape}, features: {feature_names}")

    # Scale duration_days (last column)
    scaler = StandardScaler()
    X[:, -1:] = scaler.fit_transform(X[:, -1:])

    return X, y, feature_names, scaler, encoder


def train(csv_path: str, output_dir: str):
    X, y, feature_names, scaler, encoder = load_and_preprocess(csv_path)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    models = {
        "xgboost": xgb.XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=42, n_jobs=1,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=200, max_depth=10,
            random_state=42, n_jobs=1,
        ),
        "logistic_regression": LogisticRegression(
            max_iter=1000, random_state=42
        ),
    }

    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    results = {}

    for name, base_clf in models.items():
        log.info(f"Training and calibrating {name}...")
        
        # Wrap in calibration to ensure probabilities are reliable (not overconfident)
        clf = CalibratedClassifierCV(base_clf, method="sigmoid", cv=5)
        clf.fit(X_train, y_train)
        
        y_pred = clf.predict(X_test)
        y_prob = clf.predict_proba(X_test)[:, 1]

        # Use the calibrated model for cross-validation as well
        cv_scores = cross_val_score(clf, X, y, cv=cv, scoring="f1", n_jobs=1)

        results[name] = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1": f1_score(y_test, y_pred),
            "roc_auc": roc_auc_score(y_test, y_prob),
            "cv_f1_mean": cv_scores.mean(),
            "cv_f1_std": cv_scores.std(),
            "model": clf,
        }

        log.info(
            f"  {name}: acc={results[name]['accuracy']:.3f} "
            f"f1={results[name]['f1']:.3f} "
            f"auc={results[name]['roc_auc']:.3f} "
            f"cv_f1={results[name]['cv_f1_mean']:.3f}±{results[name]['cv_f1_std']:.3f}"
        )
        log.info(classification_report(y_test, y_pred))

    best_name = max(results, key=lambda k: results[k]["roc_auc"])
    best_model = results[best_name]["model"]
    log.info(f"\n Best model: {best_name} (AUC={results[best_name]['roc_auc']:.4f})")

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    with open(out / "best_model.pkl", "wb") as f:
        pickle.dump(best_model, f)
    with open(out / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open(out / "encoder.pkl", "wb") as f:
        pickle.dump(encoder, f)

    report_lines = [f"Best model: {best_name}\n"]
    for name, r in results.items():
        report_lines.append(
            f"{name}: acc={r['accuracy']:.4f} prec={r['precision']:.4f} "
            f"rec={r['recall']:.4f} f1={r['f1']:.4f} auc={r['roc_auc']:.4f} "
            f"cv_f1={r['cv_f1_mean']:.4f}±{r['cv_f1_std']:.4f}\n"
        )
    (out / "evaluation_report.txt").write_text("".join(report_lines))

    log.info(f"Artefacts saved to {out}")
    return best_model, scaler, encoder


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to CSV dataset")
    parser.add_argument("--output", default="backend/app/models/", help="Output directory")
    args = parser.parse_args()
    train(args.data, args.output)
