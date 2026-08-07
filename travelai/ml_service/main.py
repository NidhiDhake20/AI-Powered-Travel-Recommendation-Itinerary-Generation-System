# ml-service/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.predict import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TravelAI ML Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/ml", tags=["ML"])

@app.get("/")
async def root():
    return {
        "service": "ML Service",
        "status":  "running",
        "port":    8004,
    }
