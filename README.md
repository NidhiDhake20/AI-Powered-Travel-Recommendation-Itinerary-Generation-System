# AI-Powered-Travel-Recommendation-Itinerary-Generation-System
AI-powered Indian travel recommendation &amp; itinerary planning platform. Hybrid ML (XGBoost/LightGBM/CatBoost) + multi-agent LLM system (LangChain + Groq) generate personalized destinations and day-wise itineraries across 40 Indian destinations. React/Vite frontend, Python microservices backend, PostgreSQL, Firebase Auth.



**AI-Powered Travel Recommendation & Itinerary Generation System**

TravelAI is a full-stack, microservices-based platform that generates personalized Indian travel destination recommendations and automated day-wise itineraries. It combines a hybrid ML recommendation engine with a multi-agent LLM architecture to move beyond static, search-based travel planning toward intelligent, context-aware trip generation.

Published in *IJARCCE*, Vol. 15, Issue 4, April 2026 — DOI: [10.17148/IJARCCE.2026.154174](https://doi.org/10.17148/IJARCCE.2026.154174)

## Features

- **Hybrid destination recommendations** — merges ML model predictions with real-time Google Places API data (weighted score merge) across 40 Indian destinations
- **Multi-agent itinerary generation** — six specialized AI agents (Day Planner, Weather, Budget, Food & Tips, Transport, Coordinator) collaborate to build day-by-day plans, with the Coordinator agent handling conflict resolution and budget validation
- **Budget split preview & expense tracking** — live budget alerts, category-wise expense breakdown, and cost estimation before and after destination selection
- **Weather-aware planning** — itinerary activities adjust based on live forecasts
- **AI travel chatbot** — LangChain-powered conversational assistant scoped to the selected destination
- **PDF itinerary export** for offline use
- **Firebase Authentication** and persistent trip history via PostgreSQL

## Tech Stack

**Frontend**
- React (Vite) — served on `:5173`
- Tailwind CSS

**Backend (microservices, behind an API Gateway on `:8000`)**
- Recommendation / Hybrid Scorer service — `:8002`
- ML Prediction service — `:8004`
- Itinerary Generation service (multi-agent) — `:8003`
- Chatbot service (LangChain) — `:8005`
- Python (Flask / FastAPI)

**Data & Auth**
- PostgreSQL — users, trips, itineraries, chat history
- Firebase Auth — JWT-based verification at the gateway

**AI / ML**
- ML ensemble: XGBoost, LightGBM, CatBoost (content-based + collaborative filtering) trained on a 2,000-record dataset spanning 40 Indian destinations
- LangChain + Groq (`llama-3.3-70b-versatile`) for multi-agent itinerary generation and chat
- Google Places API — live ratings, reviews, nearby attractions
- Weather API — forecast-aware activity planning

## Architecture

```
User → React Frontend (:5173) → API Gateway (:8000) [Firebase JWT verification]
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
Recommendation/Hybrid          ML Prediction Svc              Itinerary Service
Scorer Svc (:8002)                 (:8004)                       (:8003)
        │                              │                    [Day Planner | Weather |
   fetch user details          fetch destination data        Budget | Food & Tips |
        │                              │                   Transport | Coordinator]
        ▼                              ▼                              │
   PostgreSQL ◄──────────── Google Places / Weather API ──────────────┘
   (Users, Trips,                                                     │
   Itineraries, Chat)                                                 ▼
        ▲                                                     Chatbot Svc (LangChain,
        └─────────────────── save chat history ────────────── Groq API) (:8005)
```

**Request flow:** user preferences → API Gateway → parallel ML prediction + Google Places call → 50/50 weighted score merge → top destination recommendations → on selection, itinerary request is fanned out to the five planning agents in parallel → Coordinator agent synthesizes results, resolves conflicts, and validates against budget → final itinerary JSON is saved to PostgreSQL and returned to the frontend.

## Methodology

Built using a hybrid Incremental Development Model (Agile + Prototyping), delivered across six increments: basic setup → recommendation engine (content-based) → hybrid recommendation integration (collaborative filtering) → real-time API integration → itinerary generation module → budget optimization & advanced features (expense tracking, PDF export, UI polish).


## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL
- Firebase project credentials
- Google Places API key, Weather API key, Groq API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/<your-username>/travelai.git
   cd traveai
   ```

2. Frontend
   ```bash
   cd frontend
   npm install
   npm run dev   # runs on :5173
   ```

3. Backend (repeat per microservice: gateway, recommendation, ml, itinerary, chatbot)
   ```bash
   cd backend/<service-name>
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python main.py
   ```

4. Environment variables — create `.env` per service:
   ```
   DATABASE_URL=your_postgres_connection_string
   FIREBASE_API_KEY=your_firebase_key
   GOOGLE_PLACES_API_KEY=your_google_places_key
   WEATHER_API_KEY=your_weather_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

## Usage

1. Sign up / log in via Firebase Auth
2. Enter preferences — age range, budget, trip duration, group size, interests, health considerations, cuisine preference
3. Review AI + ML-ranked destination recommendations with budget split previews
4. Select a destination to trigger multi-agent itinerary generation
5. Browse the day-by-day plan, track budget, chat with the destination-aware AI assistant, and export as PDF

## Team

Developed as a Major Project (B.E. Computer Engineering) at Terna Engineering College, Nerul, Navi Mumbai (University of Mumbai), under the guidance of Dr. Siddharth Hariharan.

- Nidhi Dhake
- Shravani Mestry
- Akshay Diwate
- Nishant Gudade

## Publication

"Optimized Travel Recommendation & Itinerary Generation" — *International Journal of Advanced Research in Computer and Communication Engineering (IJARCCE)*, Vol. 15, Issue 4, April 2026. ISSN (Online): 2278-1021, ISSN (Print): 2319-5940.

## Future Scope

- NLP-based conversational trip planning
- Sentiment analysis for mood detection
- Dynamic itinerary updates based on live weather/crowd data
- Mobile application deployment
- Real-time flight and dynamic pricing integration

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
