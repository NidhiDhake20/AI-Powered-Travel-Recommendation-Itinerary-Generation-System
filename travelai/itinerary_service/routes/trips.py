# itinerary-service/routes/trips.py

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.db import get_user_by_uid, get_saved_trips, mark_trip_saved, get_trip_by_id

router = APIRouter()


class SaveTripRequest(BaseModel):
    trip_id:      int
    firebase_uid: str = ""
    user_email:   str = ""
    user_name:    str = ""


@router.post("/trips/save")
async def save_trip_route(req: SaveTripRequest):
    try:
        await mark_trip_saved(req.trip_id)
        return {"success": True, "trip_id": req.trip_id, "message": "Trip saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trips/saved")
async def get_saved(firebase_uid: str):
    try:
        user = await get_user_by_uid(firebase_uid)
        if not user:
            return {"success": True, "trips": []}
        trips = await get_saved_trips(user["id"])
        return {"success": True, "trips": trips}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trips/{trip_id}")
async def get_trip(trip_id: int):
    try:
        trip = await get_trip_by_id(trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        return {"success": True, "trip": trip}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))