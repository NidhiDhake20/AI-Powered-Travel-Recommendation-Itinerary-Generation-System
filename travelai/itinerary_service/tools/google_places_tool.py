# itinerary-service/tools/google_places_tool.py

import httpx, os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from dotenv import load_dotenv
load_dotenv()

GOOGLE_KEY = os.getenv("GOOGLE_PLACES_KEY")


async def search_places_raw(query: str, limit: int = 8) -> list:
    """Raw Google Places search — returns list of place dicts"""
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
            return [
                {
                    "name":     r.get("name", ""),
                    "address":  r.get("formatted_address", ""),
                    "rating":   r.get("rating", 0),
                    "types":    r.get("types", []),
                    "place_id": r.get("place_id", ""),
                }
                for r in results[:limit]
                if "India" in r.get("formatted_address", "")
            ]
    except Exception as e:
        print(f"Places tool error: {e}")
        return []


def format_places(places: list) -> str:
    """Format places list for LLM consumption"""
    if not places:
        return "No results found"
    lines = []
    for p in places:
        lines.append(
            f"- {p['name']} | Rating: {p['rating']}/5 | {p['address']}"
        )
    return "\n".join(lines)


async def search_and_format(query: str, limit: int = 8) -> str:
    places = await search_places_raw(query, limit)
    return format_places(places)