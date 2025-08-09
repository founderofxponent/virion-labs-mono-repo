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
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

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
    
    # Sanitize accidental double-prefix (e.g., "Bearer Bearer <jwt>") passed through upstream clients
    if token and token.lower().startswith("bearer "):
        token = token[7:].strip()

    strapi_users_me_url = f"{settings.STRAPI_URL}/api/users/me"
    headers = {"Authorization": f"Bearer {token}"}
    # Use Strapi v4 populate array-style params (works with /users/:id and /users/me)
    # Example: ?populate[0]=role&populate[1]=user_setting
    params = {"populate[0]": "role", "populate[1]": "user_setting"}
    logger.info(f"Validating token. URL: {strapi_users_me_url}, Params: {params}")
 
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(strapi_users_me_url, headers=headers, params=params)
            response.raise_for_status()
            user_data = response.json()
            # Log the keys present to make it easier to debug missing fields
            logger.info(f"Token validation successful. User data keys: {list(user_data.keys())}. Full data: {user_data}")
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
        # Ensure role is present to avoid frontend falling back to an incorrect dashboard
        if user.role is None:
            default_role = {
                "id": 0,
                "name": "Client",
                "description": "Default client role (fallback)",
                "type": "client",
            }
            logger.warning("User role missing in Strapi response; defaulting role to Client.")
            # pydantic v2: create updated copy with default role
            user = user.model_copy(update={"role": default_role})
        logger.info(f"Successfully created StrapiUser object: {user}")
        return user
    except Exception as e:
        logger.error(f"Error creating StrapiUser object: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user object: {e}"
        )

async def get_api_key(x_api_key: str = Depends(api_key_header)):
    """
    Dependency to validate a static API key for service-to-service communication.
    """
    if not x_api_key or x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API Key",
        )
    return x_api_key