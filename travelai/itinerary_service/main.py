# itinerary-service/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.itinerary import router as itinerary_router
from routes.trips     import router as trips_router
from routes.budget    import router as budget_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TravelAI Itinerary Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(itinerary_router, tags=["Itinerary"])
app.include_router(trips_router,     tags=["Trips"])
app.include_router(budget_router,    tags=["Budget"])

@app.get("/")
async def root():
    return {"service": "Itinerary Service", "status": "running", "port": 8003}

@app.get("/health")
async def health():
    return {"status": "healthy"}
