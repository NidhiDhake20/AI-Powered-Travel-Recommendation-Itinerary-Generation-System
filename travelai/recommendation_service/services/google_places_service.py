# recommendation-service/services/google_places_service.py

import httpx, os
from dotenv import load_dotenv
from shared_config import INTEREST_TO_SEARCH_QUERY, TYPE_TO_SEARCH_QUERY

load_dotenv()
GOOGLE_KEY = os.getenv("GOOGLE_PLACES_KEY")


async def search_places(query: str, limit: int = 10) -> list:
    """Search Google Places by text query — India only"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params={"query": query, "key": GOOGLE_KEY, "region": "in"},
                timeout=10.0,
            )
            if resp.status_code != 200:
                return []
            results = resp.json().get("results", [])
            india_results = [
                r for r in results
                if "India" in r.get("formatted_address", "")
            ]
            return india_results[:limit]
    except Exception as e:
        print(f"Google Places error: {e}")
        return []


async def score_destination_by_interests(
    destination: str,
    dest_type:   str,
    interests:   list,
    no_of_days:  int,
) -> dict:
    """
    Score destination by searching each interest
    Returns interest_score 0-100
    """
    total_venues   = 0
    matching_count = 0

    for interest in interests:
        query   = f"{INTEREST_TO_SEARCH_QUERY.get(interest, interest)} {destination} India"
        results = await search_places(query, limit=10)
        total_venues   += len(results)
        matching_count += len(results)

    # Also search destination type
    type_query    = f"{TYPE_TO_SEARCH_QUERY.get(dest_type, 'tourist attractions')} {destination} India"
    type_results  = await search_places(type_query, limit=10)
    total_venues += len(type_results)

    venues_needed    = no_of_days * 4
    sufficiency      = min(100, (total_venues / max(venues_needed, 1)) * 100)
    interest_score   = min(100, (matching_count / max(len(interests) * 5, 1)) * 100)
    final_score      = interest_score * 0.60 + sufficiency * 0.40

    return {
        "api_score":     round(final_score, 2),
        "total_venues":  total_venues,
        "interest_score": round(interest_score, 2),
    }


async def get_destination_photo(destination: str) -> str:
    """Get real photo URL for destination"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params={"query": f"{destination} India tourism", "key": GOOGLE_KEY},
                timeout=10.0,
            )
            results = resp.json().get("results", [])
            if results and results[0].get("photos"):
                ref = results[0]["photos"][0]["photo_reference"]
                return (
                    f"https://maps.googleapis.com/maps/api/place/photo"
                    f"?maxwidth=800&photo_reference={ref}&key={GOOGLE_KEY}"
                )
    except Exception:
        pass
    return None