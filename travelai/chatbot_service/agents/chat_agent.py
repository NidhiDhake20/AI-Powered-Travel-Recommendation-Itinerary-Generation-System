import os
import traceback
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv

load_dotenv()

# Fail fast on startup if key is missing
if not os.getenv("GEMINI_API_KEY"):
    raise RuntimeError("GEMINI_API_KEY is not set in .env!")


async def get_chat_response(
    message:      str,
    trip_context: dict,
    history:      list,
) -> str:

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",        # ✅ was "gemini-2.5-flash" — invalid name
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.7,
        max_output_tokens=500,
    )

    destination  = trip_context.get("destination", "India")
    state        = trip_context.get("state", "")
    days         = trip_context.get("no_of_days", 0)
    budget       = trip_context.get("budget_inr", 0)
    purpose      = trip_context.get("purpose", "")
    interests    = trip_context.get("interests", [])
    age_range    = trip_context.get("age_range", "")
    num_adults   = trip_context.get("num_adults", 1)
    num_children = trip_context.get("num_children", 0)
    health       = trip_context.get("health_issue", "None")
    cuisine      = trip_context.get("cuisine_type", "")

    system_content = f"""You are TravelBot, an AI travel assistant specializing in Indian travel.

CURRENT TRIP:
- Destination: {destination}, {state}
- Duration: {days} days
- Budget: ₹{budget:,}
- Purpose: {purpose}
- Travelers: {num_adults} adults, {num_children} children
- Age: {age_range}
- Interests: {', '.join(interests) if interests else 'Not specified'}
- Health: {health}
- Cuisine preference: {cuisine or 'No preference'}

Guidelines:
- Answer questions about this specific trip and everything related to travel in India
- Respond in plain text only. Do not use Markdown formatting, asterisks, or bullet symbols.
- Give practical, actionable advice
- Be friendly and use emojis occasionally
- Keep responses concise (under 200 words)
- Focus on Indian travel knowledge
- Suggest specific places, food, tips relevant to {destination}
"""

    messages = [SystemMessage(content=system_content)]

    for h in history[-10:]:
        role = h.get("role", "user")
        msg  = h.get("message", "")
        if role == "user":
            messages.append(HumanMessage(content=msg))
        else:
            messages.append(AIMessage(content=msg))

    messages.append(HumanMessage(content=message))

    # ✅ Let the exception bubble up to the route's HTTPException handler
    resp = await llm.ainvoke(messages)
    return resp.content