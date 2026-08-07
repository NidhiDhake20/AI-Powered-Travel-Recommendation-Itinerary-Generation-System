# itinerary-service/agents/itinerary_runner.py

import asyncio
from agents.day_planner_agent  import run_day_planner_agent
from agents.weather_agent      import run_weather_agent
from agents.budget_agent       import run_budget_agent
from agents.food_tip_agent    import run_food_tips_agent
from agents.transport_agent    import run_transport_agent
from agents.coordinator_agent  import run_coordinator_agent
from services.weather_service  import get_weather_forecast


async def run_itinerary_pipeline(
    destination: str,
    state:       str,
    filters:     dict,
) -> dict:

    no_of_days = filters.get("no_of_days", 3)

    print(f"🚀 Starting itinerary pipeline for {destination}")

    # Step 1: Get weather data first (needed by multiple agents)
    print("⛅ Fetching weather...")
    weather_data = await get_weather_forecast(destination, no_of_days)

    # Step 2: Run all 5 specialist agents in parallel
    print("⚡ Running 5 agents in parallel...")
    (
        day_planner_output,
        weather_output,
        budget_output,
        food_output,
        transport_output,
    ) = await asyncio.gather(
        run_day_planner_agent(destination, filters, weather_data),
        run_weather_agent(destination, weather_data, filters),
        run_budget_agent(destination, filters),
        run_food_tips_agent(destination, filters),
        run_transport_agent(destination, filters),
        return_exceptions=True,
    )

    # Handle exceptions gracefully
    if isinstance(day_planner_output, Exception):
        day_planner_output = f"Day planner unavailable: {day_planner_output}"
    if isinstance(weather_output, Exception):
        weather_output = "Weather analysis unavailable"
    if isinstance(budget_output, Exception):
        budget_output = "Budget analysis unavailable"
    if isinstance(food_output, Exception):
        food_output = "Food recommendations unavailable"
    if isinstance(transport_output, Exception):
        transport_output = "Transport guide unavailable"

    # Step 3: Coordinator merges everything
    print("🎯 Coordinator synthesizing...")
    itinerary = await run_coordinator_agent(
        destination=destination,
        filters=filters,
        day_planner_output=str(day_planner_output),
        weather_output=str(weather_output),
        budget_output=str(budget_output),
        food_output=str(food_output),
        transport_output=str(transport_output),
        weather_data=weather_data,
    )

    # Attach weather to each day
    days = itinerary.get("days", [])
    for i, day in enumerate(days):
        if i < len(weather_data) and not day.get("weather", {}).get("max_temp"):
            day["weather"] = {
                "condition":   weather_data[i].get("condition", "Clear"),
                "max_temp":    weather_data[i].get("max_temp", 28),
                "min_temp":    weather_data[i].get("min_temp", 20),
                "rain_chance": weather_data[i].get("rain_chance", 10),
                "packing_tip": "Carry water",
            }

    print(f"✅ Itinerary complete: {len(days)} days")

    return {
        "itinerary":         itinerary,
        "weather":           weather_data,
        "agent_outputs": {
            "day_planner": str(day_planner_output)[:300],
            "weather":     str(weather_output)[:300],
            "budget":      str(budget_output)[:300],
            "food":        str(food_output)[:300],
            "transport":   str(transport_output)[:300],
        }
    }