# recommendation-service/utils/db.py

import asyncpg
import os
import json
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ CORRECT — connection only inside functions
# ❌ WRONG — no conn = asyncpg.connect() at top level

async def get_conn():
    return await asyncpg.connect(DATABASE_URL)

async def ensure_user(
    firebase_uid: str,
    email: str,
    name: str
):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO users
                (firebase_uid, email, name, last_login)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (firebase_uid)
            DO UPDATE SET last_login = NOW()
        """, firebase_uid, email, name)
    finally:
        await conn.close()

async def save_trip(user_id: int, data: dict) -> int:
    conn = await get_conn()
    try:
        trip_id = await conn.fetchval("""
            INSERT INTO trips (
                user_id, destination, state, type,
                no_of_days, num_adults, num_children,
                budget_inr, purpose, age_range,
                health_issue, interests, cuisine_type,
                ml_score, api_score, final_score, image_url
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,
                $8,$9,$10,$11,$12,$13,
                $14,$15,$16,$17
            )
            RETURNING id
        """,
            user_id,
            data.get("destination", ""),
            data.get("state", ""),
            data.get("type", ""),
            data.get("no_of_days", 0),
            data.get("num_adults", 1),
            data.get("num_children", 0),
            data.get("budget_inr", 0),
            data.get("purpose", ""),
            data.get("age_range", ""),
            data.get("health_issue", ""),
            data.get("interests", []),
            data.get("cuisine_type", ""),
            float(data.get("ml_score", 0)),
            float(data.get("api_score", 0)),
            float(data.get("final_score", 0)),
            data.get("image_url", ""),
        )
        return trip_id
    finally:
        await conn.close()

async def get_user_by_uid(firebase_uid: str):
    conn = await get_conn()
    try:
        return await conn.fetchrow(
            "SELECT * FROM users WHERE firebase_uid = $1",
            firebase_uid
        )
    finally:
        await conn.close()