# gateway/routes/proxy.py

import os
import httpx
from fastapi import APIRouter, Request, Depends, HTTPException
from middleware.firebase_auth import verify_firebase_token
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SERVICES = {
    "recommend":  os.getenv("RECOMMENDATION_SERVICE_URL", "http://localhost:8002"),
    "itinerary":  os.getenv("ITINERARY_SERVICE_URL",      "http://localhost:8003"),
    "ml":         os.getenv("ML_SERVICE_URL",             "http://localhost:8004"),
    "chatbot":    os.getenv("CHATBOT_SERVICE_URL",        "http://localhost:8005"),
}


async def forward(service_url, path, request, user, method="POST", params=None):
    try:
        body = await request.json()
    except Exception:
        body = {}
    body["firebase_uid"] = user["uid"]
    body["user_email"]   = user.get("email", "")
    body["user_name"]    = user.get("name", "")
    url = f"{service_url}{path}"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            if method == "GET":
                resp = await client.get(url, params=params or {"firebase_uid": user["uid"]})
            else:
                resp = await client.post(url, json=body)
            return resp.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Service unavailable")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend")
async def recommend(request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["recommend"], "/recommend", request, user)

@router.post("/itinerary")
async def itinerary(request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["itinerary"], "/itinerary", request, user)

@router.post("/trips/save")
async def save_trip(request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["itinerary"], "/trips/save", request, user)

@router.get("/trips/saved")
async def saved_trips(request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["itinerary"], "/trips/saved", request, user, method="GET")

@router.post("/budget/add")
async def add_expense(request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["itinerary"], "/budget/add", request, user)

@router.get("/budget/{trip_id}")
async def get_budget(trip_id: int, request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["itinerary"], f"/budget/{trip_id}", request, user, method="GET", params={"trip_id": trip_id, "firebase_uid": user["uid"]})

@router.post("/budget/delete")
async def delete_expense(request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["itinerary"], "/budget/delete", request, user)

@router.post("/chat")
async def chat(request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["chatbot"], "/chat", request, user)

@router.get("/chat/history/{trip_id}")
async def chat_history(trip_id: int, request: Request, user=Depends(verify_firebase_token)):
    return await forward(SERVICES["chatbot"], f"/chat/history/{trip_id}", request, user, method="GET", params={"trip_id": trip_id, "firebase_uid": user["uid"]})