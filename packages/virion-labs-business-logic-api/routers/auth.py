from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from core.config import settings
import httpx
import logging
import time
import jwt
from datetime import datetime, timedelta
from core.auth import get_current_user
from schemas.user_schemas import User, ForgotPasswordRequest, ResetPasswordRequest
import uuid
import hashlib
import base64
from services.user_service import user_service
from services.password_reset_service import password_reset_service

logger = logging.getLogger(__name__)
router = APIRouter()

AUTH_CODE_TTL_SECONDS = 600  # 10 minutes

# In-memory auth code store: code_id -> { access_token, code_challenge, expires_at }
# Note: This is suitable for development/single-instance. For production, replace with shared store.
AUTH_CODES = {}

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _verify_pkce_s256(code_verifier: str, expected_challenge: str) -> bool:
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    computed = _base64url_encode(digest)
    return computed == expected_challenge

@router.post("/password/forgot", status_code=status.HTTP_204_NO_CONTENT)
async def forgot_password(request: ForgotPasswordRequest):
    """
    Initiates the password reset process.
    """
    await password_reset_service.send_password_reset_email(request.email)
    return

@router.post("/password/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(request: ResetPasswordRequest):
    """
    Resets the user's password using a valid token.
    """
    success = await password_reset_service.reset_password(request.token, request.password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset failed. The token may be invalid or expired.")
    return

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


@router.get("/authorize")
async def oauth_authorize(request: Request):
    """
    Standards-compliant OAuth 2.1 Authorization Endpoint (Authorization Code with PKCE).

    Expected query params from clients:
      - response_type=code
      - client_id (optional)
      - redirect_uri (required)
      - scope (optional)
      - state (required)
      - code_challenge (required)
      - code_challenge_method=S256 (required)
    """
    params = request.query_params
    response_type = params.get("response_type")
    client_id = params.get("client_id")
    redirect_uri = params.get("redirect_uri")
    scope = params.get("scope")
    state = params.get("state")
    code_challenge = params.get("code_challenge")
    code_challenge_method = params.get("code_challenge_method")
    provider = params.get("provider", "google")

    if response_type != "code":
        raise HTTPException(status_code=400, detail="Unsupported response_type")
    if not redirect_uri:
        raise HTTPException(status_code=400, detail="Missing redirect_uri")
    if not code_challenge or code_challenge_method != "S256":
        raise HTTPException(status_code=400, detail="Missing or invalid PKCE parameters")

    # Store values in short-lived cookies for use in provider callback
    login_url = f"/api/auth/login/{provider}?redirect_uri={redirect_uri}"
    if state:
        login_url += f"&state={state}"
    response = RedirectResponse(url=login_url)
    response.set_cookie(
        key="oauth_code_challenge",
        value=code_challenge,
        max_age=600,
        httponly=True,
        secure=False,
        samesite="lax",
    )
    response.set_cookie(
        key="oauth_ccm",
        value=code_challenge_method,
        max_age=600,
        httponly=True,
        secure=False,
        samesite="lax",
    )
    if client_id:
        response.set_cookie(
            key="oauth_client_id",
            value=client_id,
            max_age=600,
            httponly=True,
            secure=False,
            samesite="lax",
        )
    if scope:
        response.set_cookie(
            key="oauth_scope",
            value=scope,
            max_age=600,
            httponly=True,
            secure=False,
            samesite="lax",
        )
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
    code_challenge = request.cookies.get("oauth_code_challenge")

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

    # Create our own short-lived authorization code bound to the PKCE challenge
    if not code_challenge:
        logger.error("Missing PKCE code_challenge in cookies during provider callback")
        raise HTTPException(status_code=400, detail="Missing PKCE parameters")

    code_id = str(uuid.uuid4())
    AUTH_CODES[code_id] = {
        "access_token": strapi_jwt,
        "code_challenge": code_challenge,
        "expires_at": time.time() + AUTH_CODE_TTL_SECONDS,
    }

    # Build the final URL, including the state if it was originally provided
    final_url = f"{redirect_uri}?code={code_id}"
    if state:
        final_url += f"&state={state}"

    response = RedirectResponse(url=final_url)
    
    # Clean up cookies
    response.delete_cookie("oauth_redirect_uri")
    if state:
        response.delete_cookie("oauth_state")
    response.delete_cookie("oauth_code_challenge")
    response.delete_cookie("oauth_ccm")
    response.delete_cookie("oauth_client_id")
    response.delete_cookie("oauth_scope")
    
    logger.info(f"Successfully created auth code, redirecting to: {redirect_uri}")
    return response

@router.post("/token")
async def exchange_code_for_token(request: Request):
    """
    The client exchanges the 'code' it received for the real access_token.
    """
    form_data = await request.form()
    code = form_data.get("code")
    code_verifier = form_data.get("code_verifier")

    if not code or not code_verifier:
        raise HTTPException(status_code=400, detail="Missing required parameters: code and code_verifier")

    code_record = AUTH_CODES.get(code)
    if not code_record:
        raise HTTPException(status_code=400, detail="Invalid authorization code")

    if time.time() > code_record.get("expires_at", 0):
        # Cleanup expired code
        AUTH_CODES.pop(code, None)
        raise HTTPException(status_code=400, detail="The authorization code has expired. Please try again.")

    expected_challenge = code_record.get("code_challenge")
    if not _verify_pkce_s256(code_verifier, expected_challenge):
        raise HTTPException(status_code=400, detail="Invalid code_verifier for this authorization code")

    access_token = code_record.get("access_token")
    # One-time use: remove code after successful exchange
    AUTH_CODES.pop(code, None)

    logger.info("Successfully exchanged code for access token via PKCE.")

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 3600
    }


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
