from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from supabase import Client
from datetime import datetime, timedelta
import jwt
import bcrypt

from core.database import get_db
from core.config import settings
from services import auth_service, user_service
from schemas.auth import (
    UserSignup, 
    UserLogin, 
    UserProfile, 
    EmailConfirmation,
    AuthResponse
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

security = HTTPBearer()

@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup, db: Client = Depends(get_db)):
    """
    Register a new user account.
    """
    try:
        return auth_service.create_user(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create user")

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: Client = Depends(get_db)):
    """
    Authenticate a user and return access token.
    """
    try:
        return auth_service.authenticate_user(db, credentials)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Authentication failed")

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout a user (invalidate token).
    """
    try:
        auth_service.logout_user(credentials.credentials)
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Logout failed")

@router.post("/send-confirmation")
async def send_confirmation_email(
    email: str, 
    db: Client = Depends(get_db)
):
    """
    Resend confirmation email to user.
    """
    try:
        auth_service.send_confirmation_email(db, email)
        return {"message": "Confirmation email sent"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send confirmation email")

@router.post("/confirm")
async def confirm_email(
    confirmation: EmailConfirmation, 
    db: Client = Depends(get_db)
):
    """
    Confirm user email with token.
    """
    try:
        auth_service.confirm_email(db, confirmation.token)
        return {"message": "Email confirmed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Email confirmation failed")

@router.get("/user", response_model=UserProfile)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Get the current user's profile.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return user_service.get_user_profile(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user profile")

@router.delete("/user/delete")
async def delete_user_account(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Delete the current user's account.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        user_service.delete_user(db, user_id)
        return {"message": "Account deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete account")