# itinerary-service/agents/weather_agent.py

import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
load_dotenv()


async def run_weather_agent(
    destination: str,
    weather: list,
    filters: dict,
) -> str:

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2,
    )

    no_of_days = filters.get("no_of_days", 3)
    interests  = filters.get("interests", [])

    weather_str = ""
    for i, w in enumerate(weather[:no_of_days]):
        weather_str += (
            f"Day {i+1}: {w.get('condition','Clear')} | "
            f"Max: {w.get('max_temp',28)}°C | Min: {w.get('min_temp',20)}°C | "
            f"Rain: {w.get('rain_chance',0)}% | Humidity: {w.get('humidity',65)}%\n"
        )

    system_prompt = f"""You are a weather-aware travel advisor for {destination}, India.

Weather forecast:
{weather_str}

Traveler interests: {', '.join(interests)}

Your tasks:
1. For each day assess if outdoor activities are suitable
2. Flag rainy days (rain > 60%) and suggest indoor alternatives
3. Generate a packing list based on the weather
4. Give best time of day for outdoor activities

Output format:
WEATHER ANALYSIS:
Day 1: [Suitable/Caution/Indoor recommended] - [reason]
Day 2: [Suitable/Caution/Indoor recommended] - [reason]
...

PACKING LIST:
- [item 1]
- [item 2]
...

ACTIVITY TIMING TIPS:
- [tip 1]
- [tip 2]
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content="Analyze the weather and provide travel advice."),
    ]

    try:
        resp = await llm.ainvoke(messages)
        return resp.content
    except Exception as e:
        return f"Weather agent error: {str(e)}"