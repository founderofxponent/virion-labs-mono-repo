from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.responses import RedirectResponse
from supabase import Client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime, timedelta
import jwt
import bcrypt
from uuid import UUID

from core.database import get_supabase_client
from core.config import settings
from services import auth_service, user_service
from schemas.api.auth import (
    UserSignup, 
    UserLogin, 
    UserProfile, 
    EmailConfirmation,
    AuthResponse
)
from core.auth import AuthContext

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

security = HTTPBearer()

@router.post("/signup", response_model=AuthResponse, operation_id="auth.signup")
async def signup(user_data: UserSignup, db: Client = Depends(get_supabase_client)):
    """
    Register a new user account.
    """
    try:
        return auth_service.create_user(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create user")

@router.post("/login", response_model=AuthResponse, operation_id="auth.login")
async def login(user_data: UserLogin, db: Client = Depends(get_supabase_client)):
    """
    Authenticate a user and return access token.
    """
    try:
        return auth_service.authenticate_user(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to authenticate user")

@router.post("/logout", operation_id="auth.logout")
async def logout(request: Request):
    """
    Logout the current user. This is a placeholder and may not be needed
    depending on the client-side token management.
    """
    try:
        # The token is already validated by the middleware.
        # We can add token blacklisting logic here if needed.
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_user_auth:
            raise HTTPException(status_code=403, detail="User authentication required")
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Logout failed")

@router.post("/send-confirmation", operation_id="auth.resend_confirmation")
async def resend_confirmation_email(
    request_data: EmailConfirmation, 
    db: Client = Depends(get_supabase_client)
):
    """
    Resend confirmation email to user.
    """
    try:
        auth_service.send_confirmation_email(db, request_data.email)
        return {"message": "Confirmation email sent"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send confirmation email")

@router.post("/confirm", operation_id="auth.confirm_email")
async def confirm_email(
    confirmation: EmailConfirmation, 
    db: Client = Depends(get_supabase_client)
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

@router.get("/user", response_model=UserProfile, operation_id="auth.get_current_user")
async def get_current_user(
    request: Request,
    db: Client = Depends(get_supabase_client)
):
    """
    Get the current user's profile.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_user_auth:
            raise HTTPException(status_code=403, detail="User authentication required")
        
        user_id = auth_context.user_id
        return user_service.get_user_profile(db, UUID(user_id))
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user profile")

@router.delete("/user/delete", operation_id="auth.delete_user")
async def delete_user_account(
    request: Request,
    db: Client = Depends(get_supabase_client)
):
    """
    Delete the current user's account.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_user_auth:
            raise HTTPException(status_code=403, detail="User authentication required")
            
        user_id = auth_context.user_id
        result = auth_service.delete_user_account(db, UUID(user_id))
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete user account")

@router.get("/google/login", tags=["Authentication"], operation_id="auth.google_login")
async def google_login(supabase: Client = Depends(get_supabase_client)):
    """
    Redirects the user to Google for authentication.
    """
    data = await supabase.auth.sign_in_with_oauth(
        provider="google",
        options={"redirect_to": "http://localhost:8000/api/auth/google/callback"}
    )
    return RedirectResponse(data.url)

# This will be called by Google
@router.get("/google/callback", tags=["Authentication"], operation_id="auth.google_callback")
async def google_callback(request: Request, db: Client = Depends(get_supabase_client)):
    """
    Handles the callback from Google after authentication.
    Exchanges the authorization code for a session.
    """
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        session = await db.auth.exchange_code_for_session(code)
        
        # In a real application, you would set a secure, HttpOnly cookie
        # and redirect the user to the dashboard or original URL.
        # For now, returning the token directly for the MCP server to use.
        return {"access_token": session.session.access_token, "refresh_token": session.session.refresh_token}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))