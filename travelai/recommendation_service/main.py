# recommendation-service/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.recommend import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TravelAI Recommendation Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router, tags=["Recommendations"])

@app.get("/")
async def root():
    return {"service": "Recommendation Service", "status": "running", "port": 8002}

@app.get("/health")
async def health():
    return {"status": "healthy"}