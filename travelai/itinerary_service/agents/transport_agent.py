# itinerary-service/agents/transport_agent.py

import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from tools.google_places_tool import search_and_format
from dotenv import load_dotenv
load_dotenv()


async def run_transport_agent(destination: str, filters: dict) -> str:

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3,
    )

    no_of_days   = filters.get("no_of_days", 3)
    budget_inr   = filters.get("budget_inr", 50000)
    num_adults   = filters.get("num_adults", 2)

    # Search transport hubs
    transport_data = await search_and_format(f"taxi stand bus stop {destination} India", limit=5)
    atm_data       = await search_and_format(f"ATM bank {destination} India", limit=4)
    essentials     = await search_and_format(f"pharmacy medical store {destination} India", limit=3)

    system_prompt = f"""You are a transport logistics expert for travel in {destination}, India.

Trip: {no_of_days} days | {num_adults} adults | Budget: ₹{budget_inr:,}

Transport options found via Google:
{transport_data}

ATMs and banks:
{atm_data}

Essential services (pharmacy etc):
{essentials}

Your tasks:
1. Recommend best transport modes for this destination
2. Give fare estimates for common routes
3. List app-based transport options available
4. Provide essential services locations
5. Give local transport tips

Output format:
TRANSPORT MODES:
- Primary: [mode] - [reason] - [cost estimate]
- Alternative: [mode] - [when to use]

FARE ESTIMATES:
- Airport/Station to hotel: ₹X
- Between tourist spots: ₹X per trip
- Full day hire: ₹X

APP-BASED OPTIONS:
- [App name]: [availability in this city]

ESSENTIAL SERVICES:
- Nearest ATM: [location]
- Medical: [location]

LOCAL TRANSPORT TIPS:
- [tip 1]
- [tip 2]
- [tip 3]
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Give complete transport guide for {destination}."),
    ]

    try:
        resp = await llm.ainvoke(messages)
        return resp.content
    except Exception as e:
        return f"Transport agent error: {str(e)}"