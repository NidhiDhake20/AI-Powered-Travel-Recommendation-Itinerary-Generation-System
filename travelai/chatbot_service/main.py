# chatbot-service/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TravelAI Chatbot Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router, tags=["Chatbot"])

@app.get("/")
async def root():
    return {"service": "Chatbot Service", "status": "running", "port": 8005}

@app.get("/health")
async def health():
    return {"status": "healthy"}