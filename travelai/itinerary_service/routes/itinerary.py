# itinerary-service/routes/itinerary.py

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agents.itinerary_runner import run_itinerary_pipeline
from utils.db import (
    ensure_user, get_user_by_uid,
    save_trip, save_itinerary_day, get_itinerary,
)
from sarvam_translation import translate_payload

router = APIRouter()


class ItineraryRequest(BaseModel):
    destination:  str
    state:        str  = ""
    type:         str  = ""
    trip_id:      Optional[int] = None
    language:     str  = "en"
    age_range:    str  = "26-35"
    budget_inr:   int  = 50000
    num_adults:   int  = 2
    num_children: int  = 0
    no_of_days:   int  = 3
    interests:    List[str] = []
    purpose:      str  = "Leisure"
    health_issue: str  = "None"
    cuisine_type: str  = ""
    ml_score:     float = 0
    api_score:    float = 0
    final_score:  float = 0
    image_url:    str  = ""
    firebase_uid: str  = ""
    user_email:   str  = ""
    user_name:    str  = ""


@router.post("/itinerary")
async def create_itinerary(req: ItineraryRequest):
    try:
        print(f"\n🗺️ Itinerary request: {req.destination}")

        if req.firebase_uid:
            await ensure_user(req.firebase_uid, req.user_email, req.user_name)

        filters = {
            "age_range":    req.age_range,
            "budget_inr":   req.budget_inr,
            "num_adults":   req.num_adults,
            "num_children": req.num_children,
            "no_of_days":   req.no_of_days,
            "interests":    req.interests,
            "purpose":      req.purpose,
            "health_issue": req.health_issue,
            "cuisine_type": req.cuisine_type,
        }

        result   = await run_itinerary_pipeline(req.destination, req.state, filters)
        itinerary = result.get("itinerary", {})
        weather   = result.get("weather", [])
        days      = itinerary.get("days", [])

        # Save to DB
        trip_id = req.trip_id
        if req.firebase_uid and not trip_id:
            user = await get_user_by_uid(req.firebase_uid)
            if user:
                trip_id = await save_trip(user["id"], {
                    "destination":  req.destination,
                    "state":        req.state,
                    "type":         req.type,
                    "no_of_days":   req.no_of_days,
                    "num_adults":   req.num_adults,
                    "num_children": req.num_children,
                    "budget_inr":   req.budget_inr,
                    "purpose":      req.purpose,
                    "age_range":    req.age_range,
                    "health_issue": req.health_issue,
                    "interests":    req.interests,
                    "cuisine_type": req.cuisine_type,
                    "ml_score":     req.ml_score,
                    "api_score":    req.api_score,
                    "final_score":  req.final_score,
                    "image_url":    req.image_url,
                })

        if trip_id:
            for day in days:
                day_weather = weather[day["day"] - 1] if day["day"] - 1 < len(weather) else {}
                await save_itinerary_day(
                    trip_id=trip_id,
                    day_number=day["day"],
                    activities=day,
                    weather=day_weather,
                )

        translated_itinerary = await translate_payload(itinerary, req.language)
        translated_weather = await translate_payload(weather, req.language)

        return {
            "success":     True,
            "destination": req.destination,
            "state":       req.state,
            "trip_id":     trip_id,
            "no_of_days":  req.no_of_days,
            "budget_inr":  req.budget_inr,
            "itinerary":   translated_itinerary,
            "weather":     translated_weather,
            "filters":     filters,
        }

    except Exception as e:
        print(f"Itinerary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/itinerary/{trip_id}")
async def get_saved_itinerary(trip_id: int):
    try:
        rows = await get_itinerary(trip_id)
        return {"success": True, "trip_id": trip_id, "itinerary": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))