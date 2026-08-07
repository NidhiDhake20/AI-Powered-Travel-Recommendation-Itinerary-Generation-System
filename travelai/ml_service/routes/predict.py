# ml-service/routes/predict.py

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

import pickle
import numpy as np
import pandas as pd
import lightgbm as lgb
import warnings
warnings.filterwarnings('ignore')

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from shared_config import (
    DESTINATIONS, HEALTH_RESTRICTIONS,
    DESTINATION_DETAILS, INTEREST_DESTINATIONS,
    PURPOSE_DESTINATIONS, AGE_DESTINATIONS,
)

load_dotenv()
router = APIRouter()

# ── File Paths ────────────────────────────────────────────
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LGB_PATH      = os.path.join(BASE, "lgb_final.txt")
XGB_PATH      = os.path.join(BASE, "xgb_final.pkl")
CAT_PATH      = os.path.join(BASE, "cat_final.pkl")
FEAT_PATH     = os.path.join(BASE, "features_final.pkl")
METRICS_PATH  = os.path.join(BASE, "metrics_final.pkl")
DF_FEAT_PATH  = os.path.join(BASE, "df_features.csv")
DF_NORM_PATH  = os.path.join(BASE, "df_normalized.csv")

# ── Load All Models + Data at Startup ────────────────────
print("📂 Loading models and data...")

lgb_model  = None
xgb_model  = None
cat_model  = None
features   = None
df_feat    = None
df_norm    = None
metrics    = None

try:
    lgb_model = lgb.Booster(model_file=LGB_PATH)
    print("✅ LightGBM loaded")
except Exception as e:
    print(f"❌ LightGBM failed: {e}")

try:
    with open(XGB_PATH, "rb") as f:
        xgb_model = pickle.load(f)
    print("✅ XGBoost loaded")
except Exception as e:
    print(f"❌ XGBoost failed: {e}")

try:
    with open(CAT_PATH, "rb") as f:
        cat_model = pickle.load(f)
    print("✅ CatBoost loaded")
except Exception as e:
    print(f"❌ CatBoost failed: {e}")

try:
    with open(FEAT_PATH, "rb") as f:
        features = pickle.load(f)
    print(f"✅ Features loaded: {len(features)} features")
except Exception as e:
    print(f"❌ Features failed: {e}")

try:
    with open(METRICS_PATH, "rb") as f:
        metrics = pickle.load(f)
    print(f"✅ Metrics loaded: Best={metrics.get('best','?')}")
except Exception as e:
    print(f"❌ Metrics failed: {e}")

try:
    df_feat = pd.read_csv(DF_FEAT_PATH)
    print(f"✅ df_features loaded: {len(df_feat)} rows")
except Exception as e:
    print(f"❌ df_features failed: {e}")

try:
    df_norm = pd.read_csv(DF_NORM_PATH)
    print(f"✅ df_normalized loaded: {len(df_norm)} rows")
except Exception as e:
    print(f"❌ df_normalized failed: {e}")

MODELS_LOADED = all([
    lgb_model is not None,
    xgb_model is not None,
    cat_model is not None,
    features   is not None,
    df_feat    is not None,
    df_norm    is not None,
])
print(f"\n{'✅ All models loaded' if MODELS_LOADED else '⚠️ Some models missing — fallback active'}")


# ── Request Schema ────────────────────────────────────────
class PredictRequest(BaseModel):
    age_range:    str
    budget_inr:   int
    num_adults:   int
    num_children: int = 0
    no_of_days:   int
    interests:    List[str]
    purpose:      str
    health_issue: str = "None"
    cuisine_type: Optional[str] = ""
    firebase_uid: str = ""
    user_email:   str = ""
    user_name:    str = ""


# ── Map user interest → destination type ─────────────────
def interests_to_type(interests: List[str]) -> Optional[str]:
    """
    Map user interests to destination type
    that the model understands
    """
    type_map = {
        "Trekking":            "Adventure",
        "Adventure Sports":    "Adventure",
        "Water Sports":        "Beach",
        "Nightlife":           "Beach",
        "Nature & Relaxation": "Nature",
        "Cultural Exploration":"Historical",
        "Photography":         None,
        "Food & Local Cuisine":"City",
        "Shopping":            "City",
        "Relaxation":          "Nature",
    }
    for interest in interests:
        t = type_map.get(interest)
        if t:
            return t
    return None


# ── Health Issue Mapping ──────────────────────────────────
def normalize_health(health: str) -> str:
    """Normalize health issue to match dataset values"""
    if not health or health == "None":
        return ""
    return health


# ── Core ML Recommendation Function ──────────────────────
def get_ml_recommendations(req: PredictRequest) -> List[dict]:
    """
    Filter df_features using user inputs,
    score using ensemble models,
    return top destinations
    """
    if not MODELS_LOADED:
        return []

    try:
        dest_type    = interests_to_type(req.interests)
        health_issue = normalize_health(req.health_issue)
        budget       = req.budget_inr
        adults       = req.num_adults
        kids         = req.num_children
        age          = req.age_range
        purpose      = req.purpose
        cuisine      = req.cuisine_type or ""

        # Get unique destinations from df_features
        df_unique = df_feat.drop_duplicates('Name_x').reset_index(drop=True)

        # ── 6 Level Fallback Filtering ──────────────────
        # Each level relaxes constraints if not enough results

        def filter_df(tol, use_type, use_age, use_health,
                      use_purpose, use_cuisine):
            f = df_unique.copy()

            # Budget always applied
            f = f[
                (f['EstimatedBudget'] >= budget * (1 - tol)) &
                (f['EstimatedBudget'] <= budget * (1 + tol))
            ]

            if use_type and dest_type:
                f = f[f['Type'].str.lower() == dest_type.lower()]

            if use_age and age:
                f = f[f['Age_Range'] == age]

            if use_health and health_issue:
                f = f[f['Health_Issue'].str.lower() == health_issue.lower()]

            if use_purpose and purpose:
                f = f[f['Purpose'].str.lower() == purpose.lower()]

            if use_cuisine and cuisine:
                f = f[f['Cuisine_Type'].str.lower() == cuisine.lower()]

            return f

        # Try each level
        levels = [
            # tol,  type,  age,   health, purpose, cuisine
            (0.15, True,  True,  True,   True,    True),
            (0.25, True,  True,  True,   True,    False),
            (0.35, True,  True,  True,   False,   False),
            (0.45, True,  True,  False,  False,   False),
            (0.60, True,  False, False,  False,   False),
            (0.80, False, False, False,  False,   False),
        ]

        filtered = pd.DataFrame()
        for level_args in levels:
            filtered = filter_df(*level_args)
            if len(filtered) >= 3:
                break

        if len(filtered) == 0:
            print("⚠️ No filtered results — using all destinations")
            filtered = df_unique.copy()

        # ── Score With Ensemble Models ───────────────────
        idx = filtered.index
        X   = df_norm.loc[
            df_norm.index.isin(idx), features
        ].fillna(0)

        # Align index properly
        # Some rows might not be in df_norm
        valid_idx = [i for i in idx if i in df_norm.index]
        if not valid_idx:
            # fallback: use first rows of df_norm
            valid_idx = list(df_norm.index[:len(filtered)])

        X = df_norm.loc[valid_idx, features].fillna(0)

        # Ensemble scoring
        lgb_s = lgb_model.predict(X)
        xgb_s = xgb_model.predict_proba(X)[:, 1]
        cat_s = cat_model.predict_proba(X)[:, 1]

        # Weights: LGB=40%, XGB=35%, CAT=25%
        ensemble_score = 0.40 * lgb_s + 0.35 * xgb_s + 0.25 * cat_s

        # Boost for high rating destinations
        subset = filtered.loc[valid_idx].copy()
        if 'Rating' in subset.columns:
            rating_boost = 1 + 0.1 * (subset['Rating'].values - 3)
            final_score  = ensemble_score * rating_boost
        else:
            final_score = ensemble_score

        subset['MLScore']    = ensemble_score
        subset['FinalScore'] = final_score

        # Sort by final score
        subset = subset.sort_values('FinalScore', ascending=False)

        # ── Build Result List ────────────────────────────
        results  = []
        seen     = set()

        for _, row in subset.iterrows():
            name = row.get('Name_x', '')
            if not name or name in seen:
                continue
            seen.add(name)

            ml_score = round(float(row['FinalScore']) * 100, 2)

            results.append({
                "name":     name,
                "ml_score": ml_score,
                "ml_rank":  len(results) + 1,
            })

            if len(results) >= 3:
                break

        return results

    except Exception as e:
        print(f"ML prediction error: {e}")
        import traceback
        traceback.print_exc()
        return []


# ── Fallback Scoring (when models not loaded) ─────────────
def fallback_scoring(req: PredictRequest, allowed: List[str]) -> List[dict]:
    """Score destinations using rule-based logic"""
    scores = {}

    for dest in allowed:
        score = 50.0

        # Interest match
        for interest in req.interests:
            if dest in INTEREST_DESTINATIONS.get(interest, []):
                score += 10

        # Purpose match
        if dest in PURPOSE_DESTINATIONS.get(req.purpose, []):
            score += 20

        # Age match
        if dest in AGE_DESTINATIONS.get(req.age_range, []):
            score += 15

        scores[dest] = min(100.0, score)

    sorted_dests = sorted(
        scores.items(), key=lambda x: x[1], reverse=True
    )

    return [
        {
            "name":     name,
            "ml_score": round(score, 2),
            "ml_rank":  i + 1,
        }
        for i, (name, score) in enumerate(sorted_dests[:3])
    ]


# ── Health Filter ─────────────────────────────────────────
def apply_health_filter(destinations: List[str], health: str) -> List[str]:
    restricted = HEALTH_RESTRICTIONS.get(health, [])
    return [d for d in destinations if d not in restricted]


# ── API Endpoint ──────────────────────────────────────────
@router.post("/predict")
async def predict(req: PredictRequest):
    try:
        # Apply health filter to allowed destinations
        allowed = apply_health_filter(DESTINATIONS, req.health_issue)

        # Try ML model first
        if MODELS_LOADED:
            ml_results = get_ml_recommendations(req)

            # Filter out health-restricted destinations from ML results
            ml_results = [
                r for r in ml_results
                if r["name"] in allowed
            ]

            if ml_results:
                return {
                    "success":    True,
                    "model_used": True,
                    "destinations": ml_results,
                }

        # Fallback if models not loaded or ML returned nothing
        fallback = fallback_scoring(req, allowed)
        return {
            "success":    True,
            "model_used": False,
            "destinations": fallback,
        }

    except Exception as e:
        print(f"Predict endpoint error: {e}")
        import traceback
        traceback.print_exc()
        # Always return something
        allowed  = apply_health_filter(DESTINATIONS, req.health_issue)
        fallback = fallback_scoring(req, allowed)
        return {
            "success":    True,
            "model_used": False,
            "destinations": fallback,
        }


# ── Health Check ──────────────────────────────────────────
@router.get("/health")
async def health():
    return {
        "status":       "healthy",
        "models_loaded": MODELS_LOADED,
        "lgb_loaded":   lgb_model  is not None,
        "xgb_loaded":   xgb_model  is not None,
        "cat_loaded":   cat_model  is not None,
        "features":     len(features) if features else 0,
        "df_feat_rows": len(df_feat)  if df_feat  is not None else 0,
        "df_norm_rows": len (df_norm)  if df_norm  is not None else 0,
    }