# itinerary-service/routes/budget.py

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.db import add_expense, get_expenses, delete_expense

router = APIRouter()


class AddExpenseRequest(BaseModel):
    trip_id:      int
    category:     str
    description:  str
    amount:       float
    firebase_uid: str = ""


class DeleteExpenseRequest(BaseModel):
    expense_id:   int
    firebase_uid: str = ""


@router.post("/budget/add")
async def add_expense_route(req: AddExpenseRequest):
    try:
        expense_id = await add_expense(req.trip_id, {
            "category":    req.category,
            "description": req.description,
            "amount":      req.amount,
        })
        expenses = await get_expenses(req.trip_id)
        total    = sum(e["amount"] for e in expenses)
        by_cat   = {}
        for e in expenses:
            by_cat[e["category"]] = by_cat.get(e["category"], 0) + e["amount"]
        return {"success": True, "expense_id": expense_id, "expenses": expenses, "total_spent": total, "by_category": by_cat}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/budget/{trip_id}")
async def get_budget(trip_id: int):
    try:
        expenses = await get_expenses(trip_id)
        total    = sum(e["amount"] for e in expenses)
        by_cat   = {}
        for e in expenses:
            by_cat[e["category"]] = by_cat.get(e["category"], 0) + e["amount"]
        return {"success": True, "expenses": expenses, "total_spent": total, "by_category": by_cat}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/budget/delete")
async def delete_expense_route(req: DeleteExpenseRequest):
    try:
        await delete_expense(req.expense_id)
        return {"success": True, "expense_id": req.expense_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))