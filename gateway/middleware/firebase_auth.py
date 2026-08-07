
import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException
from dotenv import load_dotenv

load_dotenv()

cred = credentials.Certificate(
    os.getenv("FIREBASE_ADMIN_KEY_PATH", "./firebase-admin.json")
)
firebase_admin.initialize_app(cred)


async def verify_firebase_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No token provided")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = auth_header.split("Bearer ")[1]
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")