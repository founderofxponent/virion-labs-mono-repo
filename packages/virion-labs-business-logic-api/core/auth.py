from fastapi import Depends, HTTPException, Request
from core.config import settings
import httpx
import logging
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger(__name__)

class StrapiUser(BaseModel):
    id: int
    username: str
    email: str
    provider: str
    confirmed: bool
    blocked: bool
    createdAt: str
    updatedAt: str
    role: Optional[dict] = None

async def get_current_user(request: Request) -> StrapiUser:
    """
    A reusable dependency to validate a bearer token against Strapi and return the user.
    This function is the gatekeeper for protected endpoints.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    # Call Strapi's /api/users/me endpoint to validate the token and get user info
    # We must populate the role to use it for authorization checks.
    strapi_users_me_url = f"{settings.STRAPI_URL}/api/users/me?populate=role"
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(strapi_users_me_url, headers=headers)
            response.raise_for_status()
            
            user_data = response.json()
            logger.info(f"Token validated successfully for user: {user_data.get('email')}")
            return StrapiUser(**user_data)
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                logger.warning(f"Invalid token presented.")
                raise HTTPException(status_code=401, detail="Invalid token")
            logger.warning(f"Token validation failed. Strapi returned status {e.response.status_code}")
            raise HTTPException(status_code=e.response.status_code, detail="Could not validate token with authentication service.")
        except httpx.RequestError as e:
            logger.error(f"Could not connect to Strapi for token validation: {e}")
            raise HTTPException(status_code=503, detail="Authentication service is unavailable")
