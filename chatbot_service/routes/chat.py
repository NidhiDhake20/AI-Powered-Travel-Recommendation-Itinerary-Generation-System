# chatbot-service/routes/chat.py

import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from agents.chat_agent import get_chat_response
from utils.db import ensure_user, get_user_by_uid, save_message, get_chat_history
from sarvam_translation import translate_text

router = APIRouter()


class ChatRequest(BaseModel):
    message:      str
    trip_context: dict = {}
    trip_id:      Optional[int] = None
    language:     str = "en"
    firebase_uid: str = ""
    user_email:   str = ""
    user_name:    str = ""


@router.post("/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        user_id = None
        if req.firebase_uid:
            await ensure_user(req.firebase_uid, req.user_email, req.user_name)
            user = await get_user_by_uid(req.firebase_uid)
            if user:
                user_id = user["id"]

        history = []
        if req.trip_id and user_id:
            history = await get_chat_history(req.trip_id)

        response = await get_chat_response(req.message, req.trip_context, history)
        response = await translate_text(response, req.language)

        if req.trip_id and user_id:
            await save_message(req.trip_id, user_id, "user",      req.message)
            await save_message(req.trip_id, user_id, "assistant", response)

        return {"success": True, "response": response, "trip_id": req.trip_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history/{trip_id}")
async def get_history(trip_id: int):
    try:
        history = await get_chat_history(trip_id)
        return {"success": True, "history": history, "trip_id": trip_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))