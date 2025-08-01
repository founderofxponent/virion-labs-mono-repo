from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from core.config import settings
import httpx
import logging
import time
import jwt
from datetime import datetime, timedelta
from core.auth import get_current_user
from schemas.user_schemas import User
from services.user_service import user_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/login/{provider}")
async def provider_login(provider: str, request: Request):
    """
    Stores the client's redirect_uri and state in short-lived cookies,
    then redirects the user to Strapi for authentication.
    """
    if provider not in ['google', 'discord']:
        raise HTTPException(status_code=404, detail="Provider not found")

    redirect_uri = request.query_params.get('redirect_uri')
    state = request.query_params.get('state') # Get the state parameter

    if not redirect_uri:
        raise HTTPException(status_code=400, detail="Missing required parameter: redirect_uri")

    strapi_connect_url = f"{settings.STRAPI_URL}/api/connect/{provider}"
    response = RedirectResponse(url=strapi_connect_url)
    
    # Store the redirect_uri in a cookie
    response.set_cookie(
        key="oauth_redirect_uri", value=redirect_uri,
        max_age=300, httponly=True, secure=False, samesite="lax"
    )
    
    # Store the state in a cookie if it exists
    if state:
        response.set_cookie(
            key="oauth_state", value=state,
            max_age=300, httponly=True, secure=False, samesite="lax"
        )
    
    logger.info(f"Storing redirect_uri and state in cookies, redirecting to Strapi.")
    return response


@router.get("/connect/{provider}/callback")
async def provider_callback(provider: str, request: Request):
    """
    Exchanges the provider token for a Strapi JWT, then redirects back to the
    client with the necessary code and state parameters.
    """
    provider_access_token = request.query_params.get('access_token')
    redirect_uri = request.cookies.get("oauth_redirect_uri")
    state = request.cookies.get("oauth_state") # Get state from cookie

    # ... (token exchange logic remains the same) ...
    
    # Exchange the provider's access_token for a real Strapi JWT
    strapi_auth_callback_url = f"{settings.STRAPI_URL}/api/auth/{provider}/callback"
    params = {"access_token": provider_access_token}

    strapi_jwt = None
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(strapi_auth_callback_url, params=params)
            response.raise_for_status()
            strapi_response = response.json()
            strapi_jwt = strapi_response.get("jwt")
            user_id = strapi_response.get("user", {}).get("id")

            if user_id:
                await user_service.check_and_create_user_settings(user_id)
                # Refetch the JWT to ensure it contains the updated user data (role, settings)
                response = await client.get(strapi_auth_callback_url, params=params)
                response.raise_for_status()
                strapi_jwt = response.json().get("jwt")
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to exchange token with Strapi. Status: {e.response.status_code}, Body: {e.response.text}")
            raise HTTPException(status_code=502, detail="Could not verify authentication with Strapi.")
        except Exception as e:
            logger.error(f"An unexpected error occurred during token exchange: {e}")
            raise HTTPException(status_code=500, detail="An internal error occurred.")

    if not strapi_jwt:
        raise HTTPException(status_code=502, detail="Strapi did not return a JWT.")

    # Create our own short-lived 'code' containing the real Strapi JWT
    code_payload = {
        "access_token": strapi_jwt,
        "exp": datetime.utcnow() + timedelta(minutes=1)
    }
    auth_code = jwt.encode(code_payload, settings.JWT_SECRET, algorithm="HS256")

    # Build the final URL, including the state if it was originally provided
    final_url = f"{redirect_uri}?code={auth_code}"
    if state:
        final_url += f"&state={state}"

    response = RedirectResponse(url=final_url)
    
    # Clean up cookies
    response.delete_cookie("oauth_redirect_uri")
    if state:
        response.delete_cookie("oauth_state")
    
    logger.info(f"Successfully created auth code, redirecting to: {redirect_uri}")
    return response

@router.post("/token")
async def exchange_code_for_token(request: Request):
    """
    The client exchanges the 'code' it received for the real access_token.
    """
    form_data = await request.form()
    code = form_data.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing required parameter: code")

    try:
        # Decode our 'code' to extract the real access_token
        code_payload = jwt.decode(code, settings.JWT_SECRET, algorithms=["HS256"])
        access_token = code_payload.get("access_token")
        
        logger.info("Successfully exchanged code for access token.")
        
        # Return the token in the standard OAuth2 format
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 3600 # Typically one hour
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="The authorization code has expired. Please try again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid authorization code.")


@router.get("/me")
async def get_current_user(current_user: User = Depends(get_current_user)):
    """
    Token introspection endpoint.
    Clients will call this with a Bearer token to validate it and get user info.
    """
    return current_user

@router.post("/register")
async def register_client(request: Request):
    """
    Dummy endpoint for Dynamic Client Registration.
    This endpoint echoes back the client's requested metadata
    to satisfy clients that require this step in the OAuth flow.
    """
    try:
        client_info = await request.json()
        client_name = client_info.get('client_name', 'unknown')
        redirect_uris = client_info.get('redirect_uris', [])
    except Exception:
        client_name = 'unknown'
        redirect_uris = []

    logger.info(f"Received a dynamic client registration request for '{client_name}' with redirect URIs: {redirect_uris}")
    
    # Echo back the provided metadata along with a dummy client_id
    response_data = {
        "client_id": f"dummy-client-id-for-{client_name.lower().replace(' ', '-')}",
        "client_secret": "dummy-secret-that-is-not-used",
        "client_id_issued_at": int(time.time()),
        "client_secret_expires_at": 0,
        "redirect_uris": redirect_uris,
        "grant_types": client_info.get("grant_types", ["authorization_code"]),
        "response_types": client_info.get("response_types", ["code"]),
        "client_name": client_name,
        "token_endpoint_auth_method": "none"
    }
    
    return response_data
