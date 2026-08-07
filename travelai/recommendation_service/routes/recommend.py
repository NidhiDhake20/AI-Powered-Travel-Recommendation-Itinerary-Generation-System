# recommendation-service/routes/recommend.py

import sys, os, asyncio, httpx
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List, Optional
from dotenv import load_dotenv
from shared_config import DESTINATIONS, DESTINATION_DETAILS, HEALTH_RESTRICTIONS
from services.google_places_service import score_destination_by_interests
from services.scoring_engine import (
    apply_health_filter, score_purpose, score_age,
    score_budget, merge_scores, build_reasons,
)
from utils.db import ensure_user, save_trip, get_user_by_uid
from sarvam_translation import translate_list, translate_text

load_dotenv()
router         = APIRouter()
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8004")


class RecommendRequest(BaseModel):
    age_range:    str
    budget_inr:   int
    num_adults:   int
    num_children: int = 0
    no_of_days:   int
    interests:    List[str]
    purpose:      str
    health_issue: str = "None"
    cuisine_type: Optional[str] = ""
    language:     str = "en"
    firebase_uid: str = ""
    user_email:   str = ""
    user_name:    str = ""

    @validator("age_range")
    def val_age(cls, v):
        if v not in ["18-25", "26-35", "36-45", "46-60"]:
            raise ValueError("Invalid age_range")
        return v

    @validator("purpose")
    def val_purpose(cls, v):
        if v not in ["Adventure", "Business", "Family Vacation", "Honeymoon", "Leisure"]:
            raise ValueError("Invalid purpose")
        return v

    @validator("interests")
    def val_interests(cls, v):
        if not v:
            raise ValueError("Select at least one interest")
        return v


async def get_ml_predictions(req: RecommendRequest) -> list:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/ml/predict",
                json={
                    "age_range":    req.age_range,
                    "budget_inr":   req.budget_inr,
                    "num_adults":   req.num_adults,
                    "num_children": req.num_children,
                    "no_of_days":   req.no_of_days,
                    "interests":    req.interests,
                    "purpose":      req.purpose,
                    "health_issue": req.health_issue,
                    "cuisine_type": req.cuisine_type or "",
                    "firebase_uid": req.firebase_uid,
                }
            )
            if resp.status_code == 200:
                return resp.json().get("destinations", [])
    except Exception as e:
        print(f"ML service error: {e}")
    return []


async def score_single_destination(dest_name, req, ml_scores_dict):
    dest_info = DESTINATION_DETAILS.get(dest_name, {})

    # Google Places API scoring
    api_result = await score_destination_by_interests(
        destination=dest_name,
        dest_type=dest_info.get("type", "City"),
        interests=req.interests,
        no_of_days=req.no_of_days,
    )
    api_score = api_result.get("api_score", 0)

    # Static scores
    purpose_score = score_purpose(dest_name, req.purpose)
    age_score     = score_age(dest_name, req.age_range)
    budget_score  = score_budget(dest_name, req.budget_inr)

    ml_score = ml_scores_dict.get(dest_name, 0)
    has_ml   = dest_name in ml_scores_dict
    has_api  = api_score > 0

    final_score = merge_scores(
        destination=dest_name,
        ml_score=ml_score,
        api_score=api_score,
        purpose_score=purpose_score,
        age_score=age_score,
        budget_score=budget_score,
        has_ml=has_ml,
        has_api=has_api,
    )

    reasons = build_reasons(
        destination=dest_name,
        interests=req.interests,
        purpose=req.purpose,
        age_range=req.age_range,
        budget_inr=req.budget_inr,
        purpose_score=purpose_score,
    )

    # Use dataset image URL
    image_url = dest_info.get("image_url", "")

    budget_split = calculate_budget_split(
    destination=dest_name,
    budget_inr=req.budget_inr,
    no_of_days=req.no_of_days,
    num_adults=req.num_adults,
    num_children=req.num_children,
    purpose=req.purpose,         # ← ADD THIS
    interests=req.interests,     # ← ADD THIS
)

    basic_plan = generate_basic_plan(
        destination=dest_name,
        no_of_days=req.no_of_days,
        interests=req.interests,
        purpose=req.purpose,
    )

    return {
        "name":           dest_name,
        "state":          dest_info.get("state", ""),
        "type":           dest_info.get("type", ""),
        "best_time":      dest_info.get("best_time", ""),
        "cuisine_type":   dest_info.get("cuisine", ""),
        "image_url":      image_url,
        "ml_score":       round(ml_score, 2),
        "api_score":      round(api_score, 2),
        "purpose_score":  round(purpose_score, 2),
        "age_score":      round(age_score, 2),
        "budget_score":   round(budget_score, 2),
        "final_score":    final_score,
        "source":         "both" if (has_ml and has_api) else ("ml_only" if has_ml else "api_only"),
        "reasons":        reasons,
        "total_venues":   api_result.get("total_venues", 0),
        "budget_split":   budget_split,   # ← NEW
        "basic_plan":     basic_plan,     # ← NEW
    }

def calculate_budget_split(
    destination: str,
    budget_inr: int,
    no_of_days: int,
    num_adults: int,
    num_children: int,
    purpose: str = "Leisure",
    interests: list = [],
) -> dict:
    """
    Dynamic Budget Split using
    Greedy Priority-Based Algorithm

    Allocation varies based on:
    - Budget tier (low/mid/premium/luxury)
    - Trip duration (short/medium/long)
    - Number of travelers
    - Purpose (Adventure/Honeymoon/Family etc)
    - Destination type
    """
    from shared_config import DESTINATION_DETAILS

    dest_info  = DESTINATION_DETAILS.get(destination, {})
    dest_type  = dest_info.get("type", "City")
    total_people = max(num_adults + num_children, 1)
    per_day    = budget_inr // max(no_of_days, 1)

    # ── STEP 1: Determine Budget Tier ─────────
    if budget_inr <= 25000:
        budget_tier = "budget"
    elif budget_inr <= 55000:
        budget_tier = "mid"
    elif budget_inr <= 90000:
        budget_tier = "premium"
    else:
        budget_tier = "luxury"

    # ── STEP 2: Determine Duration Category ───
    if no_of_days <= 2:
        duration_cat = "short"
    elif no_of_days <= 4:
        duration_cat = "medium"
    else:
        duration_cat = "long"

    # ── STEP 3: Base Allocation per Type ──────
    # These are STARTING points, not fixed values
    # They will be adjusted in steps 4 and 5

    base = {
        "Beach": {
            "accommodation": 33,
            "food":          22,
            "activities":    25,   # water sports expensive
            "transport":     13,
            "miscellaneous": 7,
        },
        "Adventure": {
            "accommodation": 28,
            "food":          18,
            "activities":    35,   # trek/gear most expensive
            "transport":     14,
            "miscellaneous": 5,
        },
        "Nature": {
            "accommodation": 36,
            "food":          23,
            "activities":    18,
            "transport":     16,   # remote locations = more transport
            "miscellaneous": 7,
        },
        "Historical": {
            "accommodation": 31,
            "food":          24,
            "activities":    28,   # entry fees add up
            "transport":     12,
            "miscellaneous": 5,
        },
        "City": {
            "accommodation": 30,
            "food":          27,   # city food more expensive
            "activities":    20,
            "transport":     18,   # city traffic = more transport
            "miscellaneous": 5,
        },
    }

    alloc = base.get(dest_type, base["City"]).copy()

    # ── STEP 4: Adjust for Budget Tier ────────
    # Low budget → spend less on hotel, more on food
    # High budget → spend more on hotel and activities

    budget_adjustments = {
        "budget": {
            "accommodation": -6,   # cheaper hotels
            "food":          +3,   # street food, local
            "activities":    -2,   # fewer paid activities
            "transport":     +4,   # public transport
            "miscellaneous": +1,
        },
        "mid": {
            "accommodation":  0,   # no change
            "food":           0,
            "activities":     0,
            "transport":      0,
            "miscellaneous":  0,
        },
        "premium": {
            "accommodation": +5,   # better hotels
            "food":          +2,   # restaurants
            "activities":    +4,   # more experiences
            "transport":     -8,   # private cab ok
            "miscellaneous": -3,
        },
        "luxury": {
            "accommodation": +10,  # resorts
            "food":          +4,   # fine dining
            "activities":    +5,   # premium experiences
            "transport":     -12,  # private transfer
            "miscellaneous": -7,
        },
    }

    for key, delta in budget_adjustments[budget_tier].items():
        alloc[key] = max(5, alloc[key] + delta)

    # ── STEP 5: Adjust for Duration ───────────
    duration_adjustments = {
        "short": {
            "accommodation": -5,   # fewer nights
            "food":          +2,
            "activities":    +5,   # pack more in fewer days
            "transport":     +3,   # arrival/departure bigger %
            "miscellaneous": -5,
        },
        "medium": {
            "accommodation":  0,
            "food":           0,
            "activities":     0,
            "transport":      0,
            "miscellaneous":  0,
        },
        "long": {
            "accommodation": +5,   # more nights = bigger hotel cost
            "food":          +2,
            "activities":    -3,
            "transport":     -3,   # settled in one place
            "miscellaneous": -1,
        },
    }

    for key, delta in duration_adjustments[duration_cat].items():
        alloc[key] = max(5, alloc[key] + delta)

    # ── STEP 6: Adjust for Travelers ──────────
    if total_people >= 3:
        # Group travel → food goes up significantly
        alloc["food"]          += 4
        alloc["transport"]     += 2
        alloc["accommodation"] -= 4
        alloc["miscellaneous"] -= 2
    elif total_people == 1:
        # Solo travel → accommodation % higher per person
        alloc["accommodation"] += 3
        alloc["food"]          -= 2
        alloc["transport"]     -= 1

    # ── STEP 7: Adjust for Purpose ────────────
    purpose_adjustments = {
        "Honeymoon": {
            "accommodation": +7,   # romantic resort
            "food":          +3,   # fine dining dates
            "activities":    -3,
            "transport":     -5,
            "miscellaneous": -2,
        },
        "Adventure": {
            "accommodation": -4,
            "food":          -2,
            "activities":    +8,   # max activities
            "transport":     +2,
            "miscellaneous": -4,
        },
        "Family Vacation": {
            "accommodation": +3,
            "food":          +5,   # kids eat a lot
            "activities":    +2,
            "transport":     -4,
            "miscellaneous": -6,
        },
        "Business": {
            "accommodation": +5,   # good hotel for meetings
            "food":          +3,
            "activities":    -6,
            "transport":     +2,
            "miscellaneous": -4,
        },
        "Leisure": {
            "accommodation":  0,
            "food":           0,
            "activities":     0,
            "transport":      0,
            "miscellaneous":  0,
        },
    }

    if purpose in purpose_adjustments:
        for key, delta in purpose_adjustments[purpose].items():
            alloc[key] = max(5, alloc[key] + delta)

    # ── STEP 8: Greedy Normalization ──────────
    # Ensure all values >= 5 (minimum floor)
    for key in alloc:
        alloc[key] = max(5, alloc[key])

    # Normalize to exactly 100%
    total = sum(alloc.values())
    if total != 100:
        diff = 100 - total
        # Add/subtract from accommodation (highest impact)
        alloc["accommodation"] += diff
        alloc["accommodation"] = max(5, alloc["accommodation"])

    # Final normalization pass
    total = sum(alloc.values())
    if total != 100:
        alloc["miscellaneous"] += (100 - total)

    # ── STEP 9: Calculate Actual Amounts ──────
    categories_result = {}
    category_meta = {
        "accommodation": {
            "label":    "🏨 Accommodation",
            "color":    "bg-blue-500",
            "priority": 1,
        },
        "food": {
            "label":    "🍛 Food",
            "color":    "bg-green-500",
            "priority": 2,
        },
        "activities": {
            "label":    "🎯 Activities",
            "color":    "bg-purple-500",
            "priority": 3,
        },
        "transport": {
            "label":    "🚗 Transport",
            "color":    "bg-orange-500",
            "priority": 4,
        },
        "miscellaneous": {
            "label":    "🛍️ Miscellaneous",
            "color":    "bg-gray-400",
            "priority": 5,
        },
    }

    for key, pct in alloc.items():
        total_amt   = round((pct / 100) * budget_inr)
        per_day_amt = round(total_amt / max(no_of_days, 1))

        if key == "accommodation":
            per_person = round(per_day_amt / max(num_adults, 1))
            note = f"₹{per_person:,}/person/night"
        elif key == "food":
            per_person = round(per_day_amt / total_people)
            note = f"₹{per_person:,}/person/day"
        elif key == "transport":
            note = f"₹{per_day_amt:,}/day local travel"
        elif key == "activities":
            note = f"₹{per_day_amt:,}/day experiences"
        else:
            note = f"₹{per_day_amt:,}/day buffer"

        categories_result[key] = {
            **category_meta[key],
            "percentage": pct,
            "per_day":    per_day_amt,
            "total":      total_amt,
            "note":       note,
        }

    # ── STEP 10: Algorithm Trace ───────────────
    algorithm_steps = [
        f"Step 1: Budget ₹{budget_inr:,} classified as "
        f"'{budget_tier}' tier | "
        f"Duration '{duration_cat}' ({no_of_days} days)",

        f"Step 2: Base allocation set for "
        f"'{dest_type}' destination type",

        f"Step 3: Greedy adjustment for budget tier "
        f"'{budget_tier}' applied to all categories",

        f"Step 4: Duration adjustment for "
        f"'{duration_cat}' trip applied",

        f"Step 5: Traveler adjustment for "
        f"{total_people} people applied",

        f"Step 6: Purpose adjustment for "
        f"'{purpose}' applied",

        f"Step 7: Final allocation → "
        f"Acc:{alloc['accommodation']}% | "
        f"Food:{alloc['food']}% | "
        f"Act:{alloc['activities']}% | "
        f"Trn:{alloc['transport']}% | "
        f"Misc:{alloc['miscellaneous']}%",
    ]

    return {
        "algorithm":          "Greedy Priority-Based Dynamic Budget Distribution",
        "total_budget":       budget_inr,
        "per_day":            per_day,
        "no_of_days":         no_of_days,
        "destination_type":   dest_type,
        "budget_tier":        budget_tier,
        "duration_category":  duration_cat,
        "purpose":            purpose,
        "total_travelers":    total_people,
        "categories":         categories_result,
        "algorithm_steps":    algorithm_steps,
        # flat keys for backward compat
        "accommodation":  categories_result.get("accommodation", {}),
        "food":           categories_result.get("food", {}),
        "activities":     categories_result.get("activities", {}),
        "transport":      categories_result.get("transport", {}),
        "miscellaneous":  categories_result.get("miscellaneous", {}),
    }

def generate_basic_plan(
    destination: str,
    no_of_days: int,
    interests: list,
    purpose: str,
) -> list:
    """
    Generate a basic day-wise plan preview
    based on destination type and interests.
    NOT full AI itinerary — just a preview.
    """
    from shared_config import DESTINATION_DETAILS

    dest_info = DESTINATION_DETAILS.get(destination, {})
    dest_type = dest_info.get("type", "City")

    # Activity themes per destination type
    type_activities = {
        "Beach": [
            "Beach walk + water sports",
            "Snorkeling + sunset cruise",
            "Local seafood trail + beach leisure",
            "Island hopping + photography",
            "Relaxation + departure",
        ],
        "Adventure": [
            "Acclimatization + local exploration",
            "Main trek / adventure activity",
            "Camping + nature photography",
            "River rafting / zip-lining",
            "Scenic viewpoint + return",
        ],
        "Nature": [
            "Nature walk + waterfall visit",
            "Wildlife sanctuary + bird watching",
            "Plantation tour + local cuisine",
            "Scenic viewpoint + relaxation",
            "Tea/coffee estate + departure",
        ],
        "Historical": [
            "Main monument exploration",
            "Museum + heritage walk",
            "Local bazaar + street food",
            "Nearby historical sites",
            "Cultural show + departure",
        ],
        "City": [
            "City highlights + famous landmarks",
            "Shopping district + local food",
            "Museums + art galleries",
            "Nightlife + cuisine trail",
            "Final sightseeing + departure",
        ],
    }

    # Interest-based activity modifiers
    interest_additions = {
        "Photography":         "📸 Photography spots",
        "Trekking":            "🥾 Trekking trail",
        "Water Sports":        "🤿 Water activities",
        "Cultural Exploration":"🏛️ Cultural sites",
        "Food & Local Cuisine":"🍛 Food trail",
        "Nightlife":           "🌙 Evening hotspots",
        "Shopping":            "🛍️ Local markets",
        "Nature & Relaxation": "🌿 Nature retreat",
        "Adventure Sports":    "🧗 Adventure activity",
        "Relaxation":          "🧘 Spa + leisure",
    }

    # Purpose-based day 1 activity
    purpose_day1 = {
        "Honeymoon":      "Romantic arrival + candlelight dinner",
        "Adventure":      "Gear up + first adventure activity",
        "Family Vacation":"Family-friendly sightseeing",
        "Business":       "City orientation + networking",
        "Leisure":        "Relaxed arrival + local exploration",
    }

    base_activities = type_activities.get(
        dest_type, type_activities["City"]
    )

    # Build interest additions string
    interest_str = ""
    matched = [
        interest_additions[i]
        for i in interests[:2]
        if i in interest_additions
    ]
    if matched:
        interest_str = " + ".join(matched)

    plan = []
    for day in range(1, no_of_days + 1):
        if day == 1:
            activity = purpose_day1.get(
                purpose,
                "Arrival + local exploration"
            )
        elif day == no_of_days and no_of_days > 1:
            activity = "Final sightseeing + departure preparation"
        else:
            idx = min(day - 1, len(base_activities) - 1)
            activity = base_activities[idx]

        if interest_str and day not in [1, no_of_days]:
            activity = f"{activity} + {interest_str}"

        plan.append({
            "day":      day,
            "title":    f"Day {day}",
            "activity": activity,
            "type":     dest_type,
        })

    return plan

@router.post("/recommend")
async def recommend(req: RecommendRequest):
    try:
        # Save user
        if req.firebase_uid:
            await ensure_user(req.firebase_uid, req.user_email, req.user_name)

        # Apply health filter
        allowed = apply_health_filter(DESTINATIONS, req.health_issue)

        # Get ML predictions
        ml_predictions  = await get_ml_predictions(req)
        ml_scores_dict  = {p["name"]: p["ml_score"] for p in ml_predictions}

        # Build candidate pool: ML dests + all allowed dests (for API scoring)
        ml_names        = [p["name"] for p in ml_predictions]
        all_candidates  = list(dict.fromkeys(ml_names + allowed))  # ML first, then rest

        # Score top candidates in parallel (limit to 15 for performance)
        candidates_to_score = all_candidates[:15]
        tasks = [
            score_single_destination(dest, req, ml_scores_dict)
            for dest in candidates_to_score
        ]
        scored = await asyncio.gather(*tasks, return_exceptions=True)

        valid = [r for r in scored if not isinstance(r, Exception)]
        valid.sort(key=lambda x: x["final_score"], reverse=True)

        # Return top 3-5
        quality = [r for r in valid if r["final_score"] >= 50]
        final   = quality[:5] if len(quality) >= 5 else quality[:3] if len(quality) >= 3 else valid[:3]

        for i, r in enumerate(final):
            r["final_rank"] = i + 1

        # Save top result to DB
        trip_id = None
        if req.firebase_uid and final:
            user = await get_user_by_uid(req.firebase_uid)
            if user:
                top = final[0]
                trip_id = await save_trip(user["id"], {
                    "destination":  top["name"],
                    "state":        top["state"],
                    "type":         top["type"],
                    "no_of_days":   req.no_of_days,
                    "num_adults":   req.num_adults,
                    "num_children": req.num_children,
                    "budget_inr":   req.budget_inr,
                    "purpose":      req.purpose,
                    "age_range":    req.age_range,
                    "health_issue": req.health_issue,
                    "interests":    req.interests,
                    "cuisine_type": req.cuisine_type or "",
                    "ml_score":     top["ml_score"],
                    "api_score":    top["api_score"],
                    "final_score":  top["final_score"],
                    "image_url":    top["image_url"],
                })

        for r in final:
            r["trip_id"] = trip_id

        health_note = None
        restricted  = HEALTH_RESTRICTIONS.get(req.health_issue, [])
        if restricted:
            health_note = f"⚠️ {', '.join(restricted)} excluded due to {req.health_issue}."

        if req.language not in {"", "en"}:
            if health_note:
                health_note = await translate_text(health_note, req.language)
            for r in final:
                r["reasons"] = await translate_list(r.get("reasons", []), req.language)

        return {
            "success":      True,
            "total_found":  len(final),
            "recommendations": final,
            "health_note":  health_note,
            "filters_used": {
                "age_range":    req.age_range,
                "budget":       f"₹{req.budget_inr:,}",
                "travelers":    f"{req.num_adults} adults, {req.num_children} children",
                "days":         req.no_of_days,
                "interests":    req.interests,
                "purpose":      req.purpose,
                "health_issue": req.health_issue,
                "cuisine":      req.cuisine_type or "No preference",
            },
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))