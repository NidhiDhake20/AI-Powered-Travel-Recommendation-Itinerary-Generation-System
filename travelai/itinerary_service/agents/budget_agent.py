# itinerary-service/agents/budget_agent.py

import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from tools.google_places_tool import search_and_format
from dotenv import load_dotenv
load_dotenv()


async def run_budget_agent(destination: str, filters: dict) -> str:

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2,
    )

    budget_inr   = filters.get("budget_inr", 50000)
    no_of_days   = filters.get("no_of_days", 3)
    num_adults   = filters.get("num_adults", 2)
    num_children = filters.get("num_children", 0)
    total_people = num_adults + num_children
    per_day      = budget_inr // no_of_days

    # Search hotels via Google Places
    hotel_query  = f"hotels resorts {destination} India"
    hotels_data  = await search_and_format(hotel_query, limit=5)

    system_prompt = f"""You are a travel budget analyst for Indian tourism.

Trip details:
- Destination: {destination}
- Total budget: ₹{budget_inr:,}
- Duration: {no_of_days} days
- Travelers: {num_adults} adults, {num_children} children ({total_people} total)
- Per day budget: ₹{per_day:,}

Hotels found via Google:
{hotels_data}

Your tasks:
1. Estimate daily cost breakdown (accommodation, food, activities, transport)
2. Recommend budget allocation percentages
3. List top 3 hotel options with estimated prices
4. Give 5 money-saving tips specific to {destination}
5. Calculate total estimated trip cost

Output format:
DAILY BUDGET BREAKDOWN:
- Accommodation: ₹X/night
- Food: ₹X/day/person
- Activities: ₹X/day
- Transport: ₹X/day
- Total per day: ₹X

HOTEL OPTIONS:
1. [Hotel name] - ₹X/night - [rating]
2. [Hotel name] - ₹X/night - [rating]
3. [Hotel name] - ₹X/night - [rating]

TOTAL TRIP ESTIMATE: ₹X

SAVING TIPS:
- [tip 1]
- [tip 2]
- [tip 3]
- [tip 4]
- [tip 5]
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content="Provide complete budget analysis for this trip."),
    ]

    try:
        resp = await llm.ainvoke(messages)
        return resp.content
    except Exception as e:
        return f"Budget agent error: {str(e)}"