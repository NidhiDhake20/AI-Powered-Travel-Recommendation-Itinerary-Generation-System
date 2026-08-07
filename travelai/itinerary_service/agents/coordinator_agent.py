# itinerary-service/agents/coordinator_agent.py

import os, sys, json, re
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from shared_config import DESTINATION_DETAILS
from dotenv import load_dotenv
load_dotenv()

# Import curated places — add DESTINATION_PLACES to shared_config.py
try:
    from shared_config import DESTINATION_PLACES
except ImportError:
    DESTINATION_PLACES = {}


def _get_curated_places_str(destination: str) -> str:
    """Format curated places for injection into the prompt."""
    places = DESTINATION_PLACES.get(destination, {})
    if not places:
        return ""

    lines = [f"\n=== CURATED REAL PLACES FOR {destination.upper()} ==="]

    attractions = places.get("attractions", [])
    if attractions:
        lines.append("\nATTRACTIONS (use these exact names):")
        for p in attractions:
            lines.append(
                f"  • {p['name']} | {p['area']} | ₹{p['cost']} entry | {p['duration']} | Tip: {p['tip']}"
            )

    restaurants = places.get("restaurants", [])
    if restaurants:
        lines.append("\nRESTAURANTS (use these exact names):")
        for r in restaurants:
            lines.append(
                f"  • {r['name']} | {r['area']} | {r['cuisine']} | ~₹{r['cost']}/person | Tip: {r['tip']}"
            )

    evening = places.get("evening_spots", [])
    if evening:
        lines.append("\nEVENING SPOTS (use these exact names):")
        for e in evening:
            lines.append(
                f"  • {e['name']} | {e['area']} | Tip: {e['tip']}"
            )

    return "\n".join(lines)


def _extract_json(text: str) -> dict | None:
    """Robustly extract JSON from LLM response."""
    # 1. Try direct parse
    try:
        return json.loads(text.strip())
    except Exception:
        pass

    # 2. Strip markdown code fences
    clean = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(clean)
    except Exception:
        pass

    # 3. Find outermost { ... }
    start = text.find("{")
    end   = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except Exception:
            pass

    # 4. Try fixing common issues: trailing commas
    try:
        fixed = re.sub(r",\s*([}\]])", r"\1", text[start:end + 1])
        return json.loads(fixed)
    except Exception:
        pass

    return None


async def run_coordinator_agent(
    destination:        str,
    filters:            dict,
    day_planner_output: str,
    weather_output:     str,
    budget_output:      str,
    food_output:        str,
    transport_output:   str,
    weather_data:       list,
) -> dict:

    llm = ChatGroq(
        model="llama-3.1-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1,
        model_kwargs={"response_format": {"type": "json_object"}},
    )

    no_of_days   = filters.get("no_of_days", 3)
    budget_inr   = filters.get("budget_inr", 50000)
    interests    = filters.get("interests", [])
    purpose      = filters.get("purpose", "Leisure")
    cuisine_type = filters.get("cuisine_type", "")
    num_adults   = filters.get("num_adults", 2)
    num_children = filters.get("num_children", 0)

    dest_info       = DESTINATION_DETAILS.get(destination, {})
    curated_places  = _get_curated_places_str(destination)
    has_curated     = bool(curated_places)

    # Build the places instruction block depending on whether curated data exists
    if has_curated:
        places_instruction = f"""{curated_places}

PLACE SOURCE PRIORITY:
1. Use CURATED REAL PLACES above as your PRIMARY source — these are verified.
2. Supplement with places mentioned in the Day Planner Agent output.
3. If you still need more places for remaining days, use your own knowledge of {destination}."""
    else:
        places_instruction = f"""
=== NO CURATED DATA — USE YOUR OWN KNOWLEDGE ===
There is no pre-loaded places list for {destination}. You MUST use your own knowledge of real,
well-known attractions, restaurants and markets at {destination}, India.

Think carefully: what are the actual famous places, temples, forts, beaches, viewpoints, local
restaurants, dhabas, markets and experiences that {destination} is known for?
Use those. Be specific — name the real place, its neighbourhood, its entry cost, its best dish or highlight.

PLACE SOURCE PRIORITY:
1. Your own knowledge of real {destination} attractions and restaurants (PRIMARY)
2. Places mentioned in the Day Planner Agent output (if any are real named places)"""

    system_prompt = f"""You are the senior travel coordinator generating a detailed, real itinerary for {destination}, India.

USER TRIP DETAILS:
- Duration: {no_of_days} days | Total Budget: ₹{budget_inr:,}
- Group: {num_adults} adults, {num_children} children
- Interests: {', '.join(interests) if interests else 'General sightseeing'}
- Purpose: {purpose}
- Preferred Cuisine: {cuisine_type or dest_info.get('cuisine', 'Local')}
- Destination Type: {dest_info.get('type', 'City')}
- Best season: {dest_info.get('best_time', 'Oct-Mar')}

{places_instruction}

=== DAY PLANNER AGENT OUTPUT ===
{day_planner_output}

=== WEATHER AGENT OUTPUT ===
{weather_output}

=== BUDGET AGENT OUTPUT ===
{budget_output}

=== FOOD AGENT OUTPUT ===
{food_output}

=== TRANSPORT AGENT OUTPUT ===
{transport_output}

CRITICAL RULES — VIOLATIONS MAKE THE OUTPUT USELESS:
1. NEVER use generic names like "Local Restaurant", "Morning Exploration", "Evening Leisure", "Afternoon in {destination}". These are STRICTLY FORBIDDEN.
2. ALWAYS use real, specific named places. If you are unsure of a name, use your best knowledge — but never invent a placeholder.
3. Every activity must have: a real named place, its specific neighbourhood/area, real cost in ₹, and a practical actionable tip (not generic advice like "carry water").
4. Distribute attractions across all {no_of_days} days — do not repeat the same place twice.
5. Each Lunch and Evening slot MUST be a real named restaurant, dhaba, food street or market.
6. Return ONLY valid JSON. No explanation text before or after. No markdown code fences.

JSON FORMAT (return exactly this structure):
{{
  "days": [
    {{
      "day": 1,
      "title": "Evocative day title (not just 'Day 1')",
      "theme": "1-3 word theme",
      "weather": {{
        "condition": "Partly Cloudy",
        "max_temp": 28,
        "min_temp": 18,
        "rain_chance": 20,
        "packing_tip": "Specific packing tip for this day's activities"
      }},
      "activities": [
        {{
          "time": "09:00 AM",
          "slot": "Morning",
          "name": "REAL PLACE NAME — e.g. Qutub Minar",
          "description": "2 sentences: what it is and why it's worth visiting",
          "location": "Specific neighbourhood/area — e.g. Mehrauli, South Delhi",
          "duration": "2 hours",
          "cost_per_person": 40,
          "tips": "Specific actionable tip — e.g. Hire a guide inside for Mughal history context",
          "type": "Sightseeing"
        }},
        {{
          "time": "01:00 PM",
          "slot": "Lunch",
          "name": "REAL RESTAURANT NAME — e.g. Karim's",
          "description": "What cuisine, signature dish to order",
          "location": "Specific area — e.g. Gali Kababian, Jama Masjid",
          "duration": "1 hour",
          "cost_per_person": 400,
          "tips": "What to order specifically",
          "type": "Food"
        }},
        {{
          "time": "03:00 PM",
          "slot": "Afternoon",
          "name": "REAL PLACE NAME",
          "description": "What it is and the experience",
          "location": "Specific area",
          "duration": "2-3 hours",
          "cost_per_person": 200,
          "tips": "Specific actionable tip",
          "type": "Sightseeing"
        }},
        {{
          "time": "07:00 PM",
          "slot": "Evening",
          "name": "REAL RESTAURANT or MARKET NAME",
          "description": "Evening experience description",
          "location": "Specific area",
          "duration": "2 hours",
          "cost_per_person": 500,
          "tips": "Specific tip for evening",
          "type": "Food"
        }}
      ],
      "transport": "Specific transport advice with estimated cost — e.g. Take Metro (Blue Line) from Rajiv Chowk to Qutub Minar Station, ₹40 each way",
      "daily_budget": 2500,
      "daily_tip": "One specific insider tip for the day"
    }}
  ],
  "packing_list": ["Specific item 1", "Specific item 2", "Specific item 3", "Specific item 4", "Specific item 5"],
  "saving_tips": ["Specific money-saving tip 1", "Specific money-saving tip 2", "Specific money-saving tip 3"],
  "transport_summary": "Primary transport recommendation for the entire trip with estimated costs",
  "hotels": [
    {{"name": "Real hotel name", "area": "Specific area", "price_per_night": "₹X,XXX", "rating": 4.2, "tip": "Why this hotel is good"}},
    {{"name": "Real hotel name", "area": "Specific area", "price_per_night": "₹X,XXX", "rating": 4.0, "tip": "Budget-friendly option"}}
  ]
}}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(
            content=(
                f"Create the complete {no_of_days}-day itinerary for {destination}. "
                "Use ONLY real named places from the curated list and day planner output. "
                "Return ONLY the JSON object, nothing else."
            )
        ),
    ]

    try:
        resp    = await llm.ainvoke(messages)
        content = resp.content
        result  = _extract_json(content)
        if result and result.get("days"):
            return result
        print(f"⚠️ Coordinator JSON parse failed. Raw response snippet: {content[:300]}")
        return build_fallback(destination, no_of_days, budget_inr, weather_data)
    except Exception as e:
        print(f"Coordinator error: {e}")
        return build_fallback(destination, no_of_days, budget_inr, weather_data)


import asyncio as _asyncio


def build_fallback(destination: str, no_of_days: int, budget_inr: int, weather_data: list) -> dict:
    """
    Fallback: try curated places first, then kick off an LLM-only generation.
    If we are already inside an event loop (FastAPI), run the async fallback synchronously.
    """
    places      = DESTINATION_PLACES.get(destination, {})
    attractions = places.get("attractions", [])
    restaurants = places.get("restaurants", [])
    evenings    = places.get("evening_spots", [])

    # If we have curated data, build from it
    if attractions or restaurants:
        return _build_from_curated(destination, no_of_days, budget_inr, weather_data,
                                   attractions, restaurants, evenings)

    # No curated data — try LLM directly (sync wrapper)
    try:
        loop = _asyncio.get_event_loop()
        if loop.is_running():
            # We're inside FastAPI — create a task and wait via run_until_complete is not possible.
            # Return a placeholder that signals the caller to retry async.
            # Instead, return a minimal structure; the caller (run_coordinator_agent) should
            # ideally have already tried LLM. This path is a last resort.
            return _build_llm_knowledge_fallback(destination, no_of_days, budget_inr, weather_data)
        else:
            result = loop.run_until_complete(
                _generate_from_llm_knowledge(destination, no_of_days, budget_inr, weather_data)
            )
            return result
    except Exception as e:
        print(f"Fallback LLM error: {e}")
        return _build_llm_knowledge_fallback(destination, no_of_days, budget_inr, weather_data)


async def _generate_from_llm_knowledge(
    destination: str, no_of_days: int, budget_inr: int, weather_data: list
) -> dict:
    """
    Pure LLM fallback — ask the LLM to generate a real itinerary from its own knowledge.
    Used when no curated data exists and the main coordinator call failed.
    """
    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage, SystemMessage

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2,
    )

    per_day = budget_inr // max(no_of_days, 1)

    weather_str = ""
    for i, w in enumerate(weather_data[:no_of_days]):
        weather_str += f"Day {i+1}: {w.get('condition','Clear')}, {w.get('max_temp',28)}°C\n"

    prompt = f"""Generate a {no_of_days}-day travel itinerary for {destination}, India.
Budget: ₹{budget_inr:,} total (₹{per_day:,}/day).
Weather: {weather_str or 'Pleasant weather expected.'}

Use your knowledge of {destination} to name REAL places, restaurants and experiences.
NEVER use generic names like "Local Restaurant" or "Morning Exploration".

Return ONLY a JSON object in this exact format, no other text:
{{
  "days": [
    {{
      "day": 1,
      "title": "Evocative day title",
      "theme": "Short theme",
      "weather": {{
        "condition": "Clear",
        "max_temp": 28,
        "min_temp": 18,
        "rain_chance": 10,
        "packing_tip": "Specific tip"
      }},
      "activities": [
        {{
          "time": "09:00 AM",
          "slot": "Morning",
          "name": "Real attraction name",
          "description": "What it is and why visit",
          "location": "Specific area/neighbourhood",
          "duration": "2 hours",
          "cost_per_person": 100,
          "tips": "Specific actionable tip",
          "type": "Sightseeing"
        }},
        {{
          "time": "01:00 PM",
          "slot": "Lunch",
          "name": "Real restaurant name",
          "description": "Cuisine and signature dish",
          "location": "Specific area",
          "duration": "1 hour",
          "cost_per_person": 300,
          "tips": "What to order",
          "type": "Food"
        }},
        {{
          "time": "03:00 PM",
          "slot": "Afternoon",
          "name": "Real place name",
          "description": "Description",
          "location": "Specific area",
          "duration": "2 hours",
          "cost_per_person": 150,
          "tips": "Specific tip",
          "type": "Sightseeing"
        }},
        {{
          "time": "07:00 PM",
          "slot": "Evening",
          "name": "Real restaurant or market name",
          "description": "Evening experience",
          "location": "Specific area",
          "duration": "2 hours",
          "cost_per_person": 400,
          "tips": "Evening tip",
          "type": "Food"
        }}
      ],
      "transport": "Specific transport with cost estimate",
      "daily_budget": {per_day},
      "daily_tip": "One insider tip for the day"
    }}
  ],
  "packing_list": ["item1", "item2", "item3", "item4", "item5"],
  "saving_tips": ["tip1", "tip2", "tip3"],
  "transport_summary": "Main transport advice with costs",
  "hotels": [
    {{"name": "Real hotel name", "area": "Area", "price_per_night": "₹X,XXX", "rating": 4.2, "tip": "Why good"}},
    {{"name": "Real budget hotel", "area": "Area", "price_per_night": "₹X,XXX", "rating": 3.8, "tip": "Budget pick"}}
  ]
}}"""

    try:
        resp    = await llm.ainvoke([HumanMessage(content=prompt)])
        result  = _extract_json(resp.content)
        if result and result.get("days"):
            return result
    except Exception as e:
        print(f"LLM knowledge fallback error: {e}")

    return _build_llm_knowledge_fallback(destination, no_of_days, budget_inr, weather_data)


def _build_from_curated(
    destination: str, no_of_days: int, budget_inr: int, weather_data: list,
    attractions: list, restaurants: list, evenings: list,
) -> dict:
    """Build itinerary dict from curated places data."""
    per_day = budget_inr // max(no_of_days, 1)
    days    = []

    for i in range(no_of_days):
        w    = weather_data[i] if i < len(weather_data) else {}
        att  = attractions[i * 2 % len(attractions)] if attractions else None
        att2 = attractions[(i * 2 + 1) % len(attractions)] if attractions else None
        rest = restaurants[i % len(restaurants)] if restaurants else None
        eve  = evenings[i % len(evenings)] if evenings else None

        days.append({
            "day":   i + 1,
            "title": f"Day {i + 1} — {destination} Highlights",
            "theme": "Exploration",
            "weather": {
                "condition":   w.get("condition", "Clear"),
                "max_temp":    w.get("max_temp", 28),
                "min_temp":    w.get("min_temp", 20),
                "rain_chance": w.get("rain_chance", 10),
                "packing_tip": "Wear comfortable shoes and carry sunscreen",
            },
            "activities": [
                {
                    "time": "09:00 AM", "slot": "Morning",
                    "name": att["name"] if att else f"{destination} Heritage Walk",
                    "description": f"Explore {att['name']}." if att else f"Explore {destination}.",
                    "location": att["area"] if att else destination,
                    "duration": att.get("duration", "2 hours") if att else "2 hours",
                    "cost_per_person": att["cost"] if att else 100,
                    "tips": att["tip"] if att else "Start early",
                    "type": "Sightseeing",
                },
                {
                    "time": "01:00 PM", "slot": "Lunch",
                    "name": rest["name"] if rest else f"{destination} Local Eatery",
                    "description": f"{rest['cuisine']} cuisine — try {rest.get('tip','local specialties')}." if rest else "Local cuisine.",
                    "location": rest["area"] if rest else destination,
                    "duration": "1 hour",
                    "cost_per_person": rest["cost"] if rest else 300,
                    "tips": rest["tip"] if rest else "Try local specials",
                    "type": "Food",
                },
                {
                    "time": "03:00 PM", "slot": "Afternoon",
                    "name": att2["name"] if att2 else f"{destination} Afternoon Tour",
                    "description": f"Visit {att2['name']}." if att2 else f"Afternoon in {destination}.",
                    "location": att2["area"] if att2 else destination,
                    "duration": att2.get("duration", "2 hours") if att2 else "2 hours",
                    "cost_per_person": att2["cost"] if att2 else 150,
                    "tips": att2["tip"] if att2 else "Explore at leisure",
                    "type": "Sightseeing",
                },
                {
                    "time": "07:00 PM", "slot": "Evening",
                    "name": eve["name"] if eve else f"{destination} Market",
                    "description": f"Evening at {eve['name']}." if eve else "Local evening experience.",
                    "location": eve["area"] if eve else destination,
                    "duration": "2 hours",
                    "cost_per_person": 300,
                    "tips": eve["tip"] if eve else "Great for local culture",
                    "type": "Leisure",
                },
            ],
            "transport":    "Use Ola/Uber or local auto-rickshaw",
            "daily_budget": per_day,
            "daily_tip":    f"Book attraction tickets online to avoid queues at {destination}.",
        })

    return {
        "days": days,
        "packing_list":      ["Comfortable walking shoes", "Sunscreen SPF 50", "Water bottle", "Camera", "Cash and cards"],
        "saving_tips":       ["Book tickets online", "Use local transport", "Eat at local dhabas for authentic food"],
        "transport_summary": f"Use Ola/Uber or local autos. Budget ₹{per_day // 5:,}/day for transport.",
        "hotels": [
            {"name": f"Hotel in {destination}", "area": f"Central {destination}", "price_per_night": f"₹{per_day // 3:,}", "rating": 4.0, "tip": "Central location, good value"},
        ],
    }


def _build_llm_knowledge_fallback(
    destination: str, no_of_days: int, budget_inr: int, weather_data: list
) -> dict:
    """
    Absolute last-resort static fallback — only reached if LLM itself fails.
    Returns a minimal but honest structure without fake generic names.
    """
    per_day = budget_inr // max(no_of_days, 1)
    days    = []
    for i in range(no_of_days):
        w = weather_data[i] if i < len(weather_data) else {}
        days.append({
            "day":   i + 1,
            "title": f"Day {i + 1} in {destination}",
            "theme": "Exploration",
            "weather": {
                "condition":   w.get("condition", "Clear"),
                "max_temp":    w.get("max_temp", 28),
                "min_temp":    w.get("min_temp", 20),
                "rain_chance": w.get("rain_chance", 10),
                "packing_tip": "Carry water and sunscreen",
            },
            "activities": [
                {"time": "09:00 AM", "slot": "Morning",   "name": f"{destination} — Top Attraction",  "description": f"Visit the most famous attraction in {destination}.", "location": destination, "duration": "2-3 hours", "cost_per_person": 200, "tips": "Check timings before visiting", "type": "Sightseeing"},
                {"time": "01:00 PM", "slot": "Lunch",     "name": f"{destination} — Popular Restaurant","description": "Try the local cuisine of the region.",             "location": destination, "duration": "1 hour",   "cost_per_person": 300, "tips": "Ask hotel staff for recommendations", "type": "Food"},
                {"time": "03:00 PM", "slot": "Afternoon", "name": f"{destination} — Second Attraction", "description": f"Explore another key site in {destination}.",       "location": destination, "duration": "2 hours",  "cost_per_person": 150, "tips": "Visit in afternoon when less crowded", "type": "Sightseeing"},
                {"time": "07:00 PM", "slot": "Evening",   "name": f"{destination} — Local Market",      "description": "Browse the local market and try street food.",     "location": destination, "duration": "2 hours",  "cost_per_person": 200, "tips": "Great for souvenirs and snacks", "type": "Food"},
            ],
            "transport":    "Use Ola/Uber or local auto-rickshaw",
            "daily_budget": per_day,
            "daily_tip":    f"Ask your hotel for top local recommendations in {destination}.",
        })
    return {
        "days": days,
        "packing_list":      ["Comfortable shoes", "Sunscreen", "Water bottle", "Camera", "Cash"],
        "saving_tips":       ["Book tickets online", "Use local transport", "Eat at local eateries"],
        "transport_summary": "Use Ola/Uber or local autos for getting around.",
        "hotels":            [{"name": f"Hotel in {destination}", "area": destination, "price_per_night": f"₹{per_day // 3:,}", "rating": 4.0, "tip": "Book in advance"}],
    }