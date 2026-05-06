
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.calibration import calibration_curve
from sklearn.model_selection import train_test_split
from pathlib import Path

# Reuse preprocessing logic from train.py (simplified)
def load_and_preprocess(csv_path: str, scaler, encoder):
    df = pd.read_csv(csv_path)
    df = df.dropna(axis=1, how="all")
    df.columns = df.columns.str.strip()
    CSV_TARGET = "Severe Chikungunya"
    df = df.dropna(subset=[CSV_TARGET])
    df["target"] = df[CSV_TARGET].str.strip().str.lower().map({"yes": 1, "no": 0})
    df = df.dropna(subset=["target"])
    df["target"] = df["target"].astype(int)

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

    symptom_features = {}
    for csv_col, canonical in SYMPTOM_MAP.items():
        if csv_col in df.columns:
            vals = df[csv_col].str.strip().str.lower().map({"yes": 1, "no": 0}).fillna(0).astype(int)
            if canonical in symptom_features:
                symptom_features[canonical] = (symptom_features[canonical] | vals).astype(int)
            else:
                symptom_features[canonical] = vals

    boolean_features = [
        "sudden_fever", "joint_pain", "rash", "headache",
        "muscle_pain", "fatigue", "chills", "nausea",
        "eye_redness", "swollen_joints",
    ]
    bool_matrix = np.column_stack([
        symptom_features.get(f, np.zeros(len(df), dtype=int))
        for f in boolean_features
    ])

    sex_encoded = encoder.transform(df[["sex"]])
    
    age_groups = ["age_group_0-17", "age_group_18-30", "age_group_31-45", "age_group_46-60", "age_group_60+"]
    age_matrix = np.zeros((len(df), len(age_groups)), dtype=int)
    age_matrix[:, 1] = 1 # 18-30

    exposure_features = ["recent_travel", "mosquito_exposure", "known_contact_with_case", "standing_water_nearby"]
    exposure_matrix = np.zeros((len(df), len(exposure_features)), dtype=int)

    duration_matrix = np.ones((len(df), 1), dtype=float) * 3.0
    
    X = np.hstack([age_matrix, sex_encoded, bool_matrix, exposure_matrix, duration_matrix])
    X[:, -1:] = scaler.transform(X[:, -1:])
    y = df["target"].values
    return X, y

def check_calibration():
    model_dir = Path("backend/app/models")
    with open(model_dir / "best_model.pkl", "rb") as f:
        model = pickle.load(f)
    with open(model_dir / "scaler.pkl", "rb") as f:
        scaler = pickle.load(f)
    with open(model_dir / "encoder.pkl", "rb") as f:
        encoder = pickle.load(f)

    X, y = load_and_preprocess("chikungunya.csv", scaler, encoder)
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)

    probs = model.predict_proba(X_test)[:, 1]
    
    # Calculate Brier score
    from sklearn.metrics import brier_score_loss
    brier = brier_score_loss(y_test, probs)
    print(f"Brier Score (lower is better): {brier:.4f}")

    # Calibration curve
    prob_true, prob_pred = calibration_curve(y_test, probs, n_bins=10)
    
    print("\nCalibration Data:")
    print("Predicted Probabilities (bins):", prob_pred)
    print("Actual Frequencies:", prob_true)

    # Check for overconfidence
    # Overconfidence often means predicted probs are high (e.g. > 0.8) but actual frequency is much lower
    diff = prob_pred - prob_true
    max_overconf = np.max(diff)
    print(f"\nMax Overconfidence (pred - actual): {max_overconf:.4f}")

    if max_overconf > 0.15:
        print("WARNING: Model appears to be overconfident in some probability bins.")
    else:
        print("Model calibration seems reasonable (no extreme overconfidence detected).")

if __name__ == "__main__":
    check_calibration()
