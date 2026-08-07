# itinerary-service/utils/db.py

import asyncpg, os, json
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
            "SELECT * FROM users WHERE firebase_uid = $1",
            firebase_uid
        )
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
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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


async def save_itinerary_day(trip_id: int, day_number: int, activities: dict, weather: dict):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO itineraries (trip_id, day_number, activities, weather)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (trip_id, day_number)
            DO UPDATE SET activities = $3, weather = $4
        """, trip_id, day_number, json.dumps(activities), json.dumps(weather))
    finally:
        await conn.close()


async def get_itinerary(trip_id: int):
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT * FROM itineraries
            WHERE trip_id = $1
            ORDER BY day_number ASC
        """, trip_id)
        return [dict(r) for r in rows]
    finally:
        await conn.close()


async def mark_trip_saved(trip_id: int):
    conn = await get_conn()
    try:
        await conn.execute(
            "UPDATE trips SET is_saved = TRUE WHERE id = $1", trip_id
        )
    finally:
        await conn.close()


async def get_saved_trips(user_id: int):
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT * FROM trips
            WHERE user_id = $1 AND is_saved = TRUE
            ORDER BY created_at DESC
        """, user_id)
        return [dict(r) for r in rows]
    finally:
        await conn.close()


async def get_trip_by_id(trip_id: int):
    conn = await get_conn()
    try:
        row = await conn.fetchrow("SELECT * FROM trips WHERE id = $1", trip_id)
        return dict(row) if row else None
    finally:
        await conn.close()


async def add_expense(trip_id: int, expense: dict) -> int:
    conn = await get_conn()
    try:
        expense_id = await conn.fetchval("""
            INSERT INTO expenses (trip_id, category, description, amount)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        """,
            trip_id,
            expense.get("category", "Other"),
            expense.get("description", ""),
            float(expense.get("amount", 0)),
        )
        return expense_id
    finally:
        await conn.close()


async def get_expenses(trip_id: int):
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT * FROM expenses
            WHERE trip_id = $1
            ORDER BY created_at DESC
        """, trip_id)
        return [dict(r) for r in rows]
    finally:
        await conn.close()


async def delete_expense(expense_id: int):
    conn = await get_conn()
    try:
        await conn.execute("DELETE FROM expenses WHERE id = $1", expense_id)
    finally:
        await conn.close()