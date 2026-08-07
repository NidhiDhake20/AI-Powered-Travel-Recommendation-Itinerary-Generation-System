# itinerary-service/agents/day_planner_agent.py

import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from tools.google_places_tool import search_places_raw, format_places
from dotenv import load_dotenv
load_dotenv()

# Import curated places from shared_config
try:
    from shared_config import DESTINATION_PLACES
except ImportError:
    DESTINATION_PLACES = {}


async def run_day_planner_agent(
    destination: str,
    filters: dict,
    weather: list,
) -> str:

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3,
    )

    no_of_days   = filters.get("no_of_days", 3)
    interests    = filters.get("interests", [])
    purpose      = filters.get("purpose", "Leisure")
    age_range    = filters.get("age_range", "26-35")
    num_adults   = filters.get("num_adults", 2)
    num_children = filters.get("num_children", 0)
    health_issue = filters.get("health_issue", "None")
    cuisine_type = filters.get("cuisine_type", "")

    # ── 1. Pull curated places (most reliable source) ──────────────────────
    curated      = DESTINATION_PLACES.get(destination, {})
    curated_str  = ""
    if curated:
        lines = [f"CURATED VERIFIED PLACES FOR {destination}:"]
        for att in curated.get("attractions", []):
            lines.append(f"  ATTRACTION: {att['name']} | {att['area']} | ₹{att['cost']} entry | {att['duration']} | {att['tip']}")
        for rest in curated.get("restaurants", []):
            lines.append(f"  RESTAURANT: {rest['name']} | {rest['area']} | {rest['cuisine']} | ~₹{rest['cost']}/person | {rest['tip']}")
        for eve in curated.get("evening_spots", []):
            lines.append(f"  EVENING: {eve['name']} | {eve['area']} | {eve['tip']}")
        curated_str = "\n".join(lines)

    # ── 2. Google Places for interests not in curated list ─────────────────
    google_places_str = ""
    if interests:
        all_places = []
        # Targeted searches: attractions + restaurants + interest-specific
        queries = [
            f"top tourist attractions {destination} India",
            f"best restaurants {destination} India",
        ]
        for interest in interests[:2]:
            queries.append(f"{interest.lower()} {destination} India")

        for query in queries:
            try:
                results = await search_places_raw(query, limit=5)
                all_places.extend(results)
            except Exception:
                pass

        # Deduplicate by name
        seen  = set()
        unique = []
        for p in all_places:
            if p["name"] not in seen:
                seen.add(p["name"])
                unique.append(p)

        if unique:
            google_places_str = f"\nGOOGLE PLACES DATA (supplement curated list):\n{format_places(unique)}"

    # ── 3. Weather string ──────────────────────────────────────────────────
    weather_str = ""
    for i, w in enumerate(weather[:no_of_days]):
        weather_str += f"Day {i+1}: {w.get('condition','Clear')}, {w.get('max_temp',28)}°C max, {w.get('rain_chance',10)}% rain\n"

    # ── 4. Health restriction note ─────────────────────────────────────────
    health_note = ""
    if health_issue and health_issue != "None":
        restrictions = {
            "Knee Pain":            "Avoid long uphill climbs and many stairs. Prefer flat, accessible attractions.",
            "Asthma":               "Avoid dusty or crowded areas during peak hours. Carry inhaler.",
            "High Blood Pressure":  "Avoid strenuous activity and high altitude. Prefer gentle sightseeing.",
        }
        health_note = f"\nHEALTH NOTE: {restrictions.get(health_issue, f'Be mindful of {health_issue}.')}"

    # Decide place source instruction based on whether curated data is available
    if curated_str:
        place_source_instruction = f"""{curated_str}
{google_places_str}

STRICT RULES:
1. ONLY use real, named places. NEVER write "Local Restaurant", "Morning Exploration", "Afternoon activity", or any generic placeholder.
2. Prioritize the CURATED VERIFIED list above — these are confirmed real places with accurate details.
3. Supplement with Google Places data if you need more variety.
4. Every restaurant slot must have a real restaurant name and the specific dish to order.
5. Spread attractions evenly — don't cluster all famous spots on Day 1.
6. Group nearby places per day to minimize travel time."""
    else:
        place_source_instruction = f"""
{google_places_str if google_places_str else ''}

NO PRE-LOADED PLACE DATA FOR {destination.upper()}.
Use your own knowledge of {destination}, India to name real places:
- Famous monuments, temples, forts, viewpoints, beaches, lakes or parks
- Well-known local restaurants, dhabas, food streets and markets
- Popular evening hangout spots

STRICT RULES:
1. ONLY use real, named places from your knowledge. NEVER write "Local Restaurant", "Morning Exploration", or any generic placeholder.
2. Every restaurant slot must name a real known eatery and the signature dish.
3. Spread attractions across all {no_of_days} days — no repeats.
4. Group geographically nearby spots on the same day.
5. If you recall a famous place but are slightly unsure of the exact name, use your best knowledge — anything is better than a placeholder."""

    system_prompt = f"""You are an expert Indian travel planner for {destination}.
Plan a detailed {no_of_days}-day activity schedule using REAL, SPECIFIC place names.

TRAVELER PROFILE:
- Age group: {age_range} | Purpose: {purpose}
- Group: {num_adults} adults, {num_children} children
- Interests: {', '.join(interests) if interests else 'General tourism'}
- Preferred cuisine: {cuisine_type or 'Local specialties'}
{health_note}

WEATHER FORECAST:
{weather_str}

{place_source_instruction}

OUTPUT FORMAT for each day:
DAY [N]: [Evocative title — not just "Day N"]
MORNING (09:00 AM): [Exact place name] | [Specific area, city] | [Duration] | [₹Entry cost] | Tip: [Specific actionable tip]
LUNCH (01:00 PM): [Exact restaurant name] | [Specific area] | [Cuisine type] | [~₹cost/person] | Order: [Specific dish to order]
AFTERNOON (03:00 PM): [Exact place name] | [Specific area] | [Duration] | [₹cost] | Tip: [Specific tip]
EVENING (07:00 PM): [Exact restaurant/market name] | [Specific area] | [₹cost] | Tip: [Evening specific tip]
TRANSPORT: [Specific mode with estimated cost]
THEME: [1-3 word theme]
"""

    source_note = (
        "Use the CURATED VERIFIED PLACES list as your primary source."
        if curated_str else
        f"Use your own knowledge of real places in {destination} — no generic names allowed."
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(
            content=(
                f"Create the complete {no_of_days}-day plan for {destination}. "
                f"Every single slot must have a real named place. {source_note}"
            )
        ),
    ]

    try:
        resp = await llm.ainvoke(messages)
        return resp.content
    except Exception as e:
        # Return curated places as fallback text for coordinator to use
        if curated_str:
            return f"Day planner LLM error. Use these verified places:\n{curated_str}"
        return f"Day planner error: {str(e)}"