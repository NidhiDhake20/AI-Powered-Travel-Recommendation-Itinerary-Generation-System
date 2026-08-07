# chatbot-service/utils/db.py

import asyncpg, os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


async def get_conn():
    return await asyncpg.connect(DATABASE_URL)


async def ensure_user(firebase_uid: str, email: str, name: str):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO users (firebase_uid, email, name, last_login)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (firebase_uid) DO UPDATE SET last_login = NOW()
        """, firebase_uid, email, name)
    finally:
        await conn.close()


async def get_user_by_uid(firebase_uid: str):
    conn = await get_conn()
    try:
        return await conn.fetchrow(
            "SELECT * FROM users WHERE firebase_uid = $1", firebase_uid
        )
    finally:
        await conn.close()


async def save_message(trip_id: int, user_id: int, role: str, message: str):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO chat_history (trip_id, user_id, role, message)
            VALUES ($1, $2, $3, $4)
        """, trip_id, user_id, role, message)
    finally:
        await conn.close()


async def get_chat_history(trip_id: int, limit: int = 20):
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT role, message, created_at
            FROM chat_history
            WHERE trip_id = $1
            ORDER BY created_at DESC LIMIT $2
        """, trip_id, limit)
        return list(reversed([dict(r) for r in rows]))
    finally:
        await conn.close()