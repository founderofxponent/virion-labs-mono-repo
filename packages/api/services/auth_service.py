from supabase import Client
from typing import Optional
from uuid import UUID
import bcrypt
import jwt
from datetime import datetime, timedelta
import secrets

from core.config import settings
from schemas.auth import UserSignup, UserLogin, UserProfile, AuthResponse

# In a production environment, these should be in environment variables
JWT_SECRET = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_user(db: Client, user_data: UserSignup) -> AuthResponse:
    """
    Create a new user account.
    """
    # Check if user already exists
    existing_user = db.table("users").select("*").eq("email", user_data.email).execute()
    if existing_user.data:
        raise ValueError("User with this email already exists")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_record = {
        "email": user_data.email,
        "password_hash": hashed_password.decode('utf-8'),
        "full_name": user_data.full_name,
        "discord_user_id": user_data.discord_user_id,
        "discord_username": user_data.discord_username,
        "email_confirmed": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("users").insert(user_record).execute()
    if not response.data:
        raise Exception("Failed to create user")
    
    user = UserProfile.model_validate(response.data[0])
    
    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return AuthResponse(access_token=access_token, user=user)

def authenticate_user(db: Client, credentials: UserLogin) -> AuthResponse:
    """
    Authenticate a user with email and password.
    """
    # Find user by email
    response = db.table("users").select("*").eq("email", credentials.email).execute()
    if not response.data:
        raise ValueError("Invalid email or password")
    
    user_record = response.data[0]
    
    # Verify password
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user_record['password_hash'].encode('utf-8')):
        raise ValueError("Invalid email or password")
    
    user = UserProfile.model_validate(user_record)
    
    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return AuthResponse(access_token=access_token, user=user)

def create_access_token(data: dict) -> str:
    """
    Create a JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_user_id_from_token(token: str) -> UUID:
    """
    Extract user ID from JWT token.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("Invalid token")
        return UUID(user_id)
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTError:
        raise ValueError("Invalid token")

def logout_user(token: str) -> None:
    """
    Logout user by invalidating token (in a real implementation, you might want to blacklist the token).
    """
    # For now, we'll just validate the token to ensure it's valid
    # In production, you might want to add the token to a blacklist
    get_user_id_from_token(token)

def send_confirmation_email(db: Client, email: str) -> None:
    """
    Send confirmation email to user.
    """
    # Find user by email
    response = db.table("users").select("*").eq("email", email).execute()
    if not response.data:
        raise ValueError("User not found")
    
    user = response.data[0]
    
    # Generate confirmation token
    confirmation_token = secrets.token_urlsafe(32)
    
    # Store confirmation token
    db.table("email_confirmations").insert({
        "user_id": user["id"],
        "token": confirmation_token,
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    
    # In a real implementation, you would send an email here
    # For now, we'll just print the token (in development)
    print(f"Confirmation token for {email}: {confirmation_token}")

def confirm_email(db: Client, token: str) -> None:
    """
    Confirm user email with token.
    """
    # Find confirmation record
    response = db.table("email_confirmations").select("*").eq("token", token).execute()
    if not response.data:
        raise ValueError("Invalid confirmation token")
    
    confirmation = response.data[0]
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(confirmation["expires_at"])
    if datetime.utcnow() > expires_at:
        raise ValueError("Confirmation token has expired")
    
    # Update user email_confirmed status
    db.table("users").update({
        "email_confirmed": True,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", confirmation["user_id"]).execute()
    
    # Delete confirmation record
    db.table("email_confirmations").delete().eq("token", token).execute()