from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
import jwt
from pydantic import BaseModel, EmailStr, ValidationError, Field
from typing import Optional, Dict, Any
import logging
 
from core.config import settings
from core.strapi_client import strapi_client
from schemas.strapi import UserSetting
 
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
api_key_header = APIKeyHeader(name="Authorization")

class StrapiUser(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: Optional[Dict[str, Any]] = None
    settings: Optional[UserSetting] = Field(None, alias='user_setting')
    document_id: Optional[str] = None
    avatar_url: Optional[str] = None

async def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Validates the OAuth2 token against Strapi (for dashboard authentication).
    """
    import httpx
    
    strapi_users_me_url = f"{settings.STRAPI_URL}/api/users/me"
    headers = {"Authorization": f"Bearer {token}"}
    params = [("populate", "role"), ("populate", "user_setting")]
    logger.info(f"Validating token. URL: {strapi_users_me_url}, Params: {params}")
 
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(strapi_users_me_url, headers=headers, params=params)
            response.raise_for_status()
            user_data = response.json()
            logger.info(f"Token validation successful. User data received: {user_data}")
            return user_data
        except httpx.HTTPStatusError as e:
            logger.error(f"Token validation failed. Status: {e.response.status_code}, Response: {e.response.text}")
            if e.response.status_code == 403:
                # Add a warning for permission issues
                logger.warning(f"Token validation failed. Strapi returned status 403")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
                headers={"WWW-Authenticate": "Bearer"},
            )

async def get_current_user(user_data: dict = Depends(get_current_user_from_token)) -> StrapiUser:
    """
    Dependency to get the current active user from validated Strapi user data.
    """
    try:
        if not user_data:
            logger.warning("get_current_user received empty user_data.")
            return None
        logger.info(f"Creating StrapiUser object from user_data: {user_data}")
        user = StrapiUser(**user_data)
        logger.info(f"Successfully created StrapiUser object: {user}")
        return user
    except Exception as e:
        logger.error(f"Error creating StrapiUser object: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user object: {e}"
        )

async def get_api_key(key: str = Depends(api_key_header)):
    """
    Dependency to validate a static API key for service-to-service communication.
    """
    parts = key.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header. Expected 'Bearer <key>'",
        )
    
    token = parts[1]
    if token == settings.API_KEY:
        return token
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key",
    )