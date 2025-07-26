from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import BaseModel, EmailStr, ValidationError
from typing import Optional, Dict, Any

from core.config import settings
from core.strapi_client import strapi_client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class StrapiUser(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: Optional[Dict[str, Any]] = None
    documentId: Optional[str] = None
    avatar_url: Optional[str] = None

def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes the JWT token and returns the payload.
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(payload: dict = Depends(get_current_user_from_token)) -> StrapiUser:
    """
    Dependency to get the current active user from the token payload.
    Queries Strapi to get the full user object.
    """
    user_id = payload.get("id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        strapi_user_data = await strapi_client.get_user(user_id)
        
        if not strapi_user_data:
            raise HTTPException(status_code=404, detail="User not found in Strapi")

        user = StrapiUser(**strapi_user_data)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user from Strapi: {e}"
        )