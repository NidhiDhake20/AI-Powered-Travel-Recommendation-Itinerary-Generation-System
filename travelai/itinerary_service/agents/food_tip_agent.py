# itinerary-service/agents/food_tips_agent.py

import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from tools.google_places_tool import search_and_format
from shared_config import DESTINATION_DETAILS
from dotenv import load_dotenv
load_dotenv()


async def run_food_tips_agent(destination: str, filters: dict) -> str:

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.4,
    )

    cuisine_pref = filters.get("cuisine_type", "")
    budget_inr   = filters.get("budget_inr", 50000)
    no_of_days   = filters.get("no_of_days", 3)

    local_cuisine = DESTINATION_DETAILS.get(destination, {}).get("cuisine", "Indian Cuisine")

    # Search restaurants
    resto_query  = f"best restaurants {destination} {local_cuisine} India"
    restaurants  = await search_and_format(resto_query, limit=8)

    # Search street food
    street_query = f"street food local eateries {destination} India"
    street_food  = await search_and_format(street_query, limit=5)

    system_prompt = f"""You are a food and culture expert for {destination}, India.

Local cuisine: {local_cuisine}
User cuisine preference: {cuisine_pref or 'No specific preference'}
Budget: ₹{budget_inr:,} for {no_of_days} days

Restaurants found via Google:
{restaurants}

Street food places:
{street_food}

Your tasks:
1. Recommend restaurants for each day (lunch + dinner)
2. List must-try dishes with cultural context
3. Give dining etiquette tips
4. Suggest best street food spots
5. Note any dietary considerations

Output format:
RESTAURANT RECOMMENDATIONS:
Day 1 Lunch: [Restaurant] - [Cuisine] - [Price range] - [Must try: dish]
Day 1 Dinner: [Restaurant] - [Cuisine] - [Price range] - [Must try: dish]
(repeat for all {no_of_days} days)

MUST TRY DISHES:
1. [Dish name]: [Cultural significance and description]
2. [Dish name]: [Cultural significance and description]
3. [Dish name]: [Cultural significance and description]

STREET FOOD SPOTS:
- [Place]: [What to try]

DINING TIPS:
- [tip 1]
- [tip 2]
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Give complete food recommendations for {destination}."),
    ]

    try:
        resp = await llm.ainvoke(messages)
        return resp.content
    except Exception as e:
        return f"Food agent error: {str(e)}"