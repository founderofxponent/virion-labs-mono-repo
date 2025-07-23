from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.responses import RedirectResponse
from supabase import Client
from typing import Optional
from datetime import datetime, timedelta
import jwt
import os

from core.database import get_supabase_client
from core.config import settings

router = APIRouter(
    prefix="/api/oauth",
    tags=["OAuth"],
)


@router.post(
    "/register",
    tags=["OAuth"],
    operation_id="oauth.register_client",
    summary="[OAuth] Dynamically register a new OAuth client for API access."
)
async def dynamic_client_registration(request: Request):
    """
    Dynamic Client Registration endpoint per RFC 7591.
    """
    import uuid
    import secrets

    try:
        body = await request.json()
    except:
        body = {}

    # Generate client credentials
    client_id = f"mcp_client_{uuid.uuid4().hex[:16]}"
    client_secret = secrets.token_urlsafe(32)

    # Extract redirect URIs from request or use default
    redirect_uris = body.get("redirect_uris", ["http://localhost:3000/auth/callback"])

    # Store client info (in production, save to database)
    # For now, we'll accept any valid registration request

    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "client_id_issued_at": int(datetime.utcnow().timestamp()),
        "client_secret_expires_at": 0,  # Never expires
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "redirect_uris": redirect_uris,
        "token_endpoint_auth_method": "client_secret_basic",
        "scope": "mcp"
    }

@router.get(
    "/authorize",
    tags=["OAuth"],
    operation_id="oauth.authorize",
    summary="[OAuth] Start the authorization process by redirecting to the identity provider."
)
async def oauth_authorize(
    request: Request,
    client_id: str,
    response_type: str,
    redirect_uri: str,
    scope: str = "mcp",
    state: Optional[str] = None,
    code_challenge: Optional[str] = None,
    code_challenge_method: Optional[str] = None,
    resource: Optional[str] = None,  # MCP resource parameter
    supabase: Client = Depends(get_supabase_client)
):
    """
    OAuth 2.0 authorization endpoint for MCP Inspector.
    """
    if response_type != "code":
        raise HTTPException(status_code=400, detail="Unsupported response type")

    # Store PKCE parameters and redirect info for the callback
    # Use environment variable if set, otherwise derive from request
    oauth_redirect_uri = os.getenv("OAUTH_REDIRECT_URI")
    print(f"DEBUG: OAUTH_REDIRECT_URI env var = {oauth_redirect_uri}")
    if oauth_redirect_uri:
        google_redirect_uri = oauth_redirect_uri
        print(f"DEBUG: Using env var redirect URI = {google_redirect_uri}")
    else:
        base_url = str(request.base_url).rstrip("/")
        # Ensure HTTPS if X-Forwarded-Proto is https
        if request.headers.get("x-forwarded-proto") == "https":
            base_url = base_url.replace("http://", "https://")
        google_redirect_uri = f"{base_url}/api/oauth/callback"
        print(f"DEBUG: Using derived redirect URI = {google_redirect_uri}")

    # Store state and redirect info in JWT for stateless operation
    auth_state = {
        "original_redirect_uri": redirect_uri,
        "client_id": client_id,
        "scope": scope,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method,
        "resource": resource,  # Store MCP resource
        "exp": datetime.utcnow() + timedelta(minutes=30)
    }

    state_token = jwt.encode(auth_state, settings.JWT_SECRET, algorithm="HS256")

    # Redirect to Google OAuth with our state token
    full_redirect_uri = f"{google_redirect_uri}?state={state_token}"
    print(f"DEBUG: Testing redirectTo = {full_redirect_uri}")

    # Try different method signatures for Supabase OAuth
    try:
        # Method 1: Dictionary format
        oauth_request = {
            "provider": "google",
            "options": {"redirect_to": full_redirect_uri}
        }
        print(f"DEBUG: Trying method 1 - {oauth_request}")
        data = supabase.auth.sign_in_with_oauth(oauth_request)
        print(f"DEBUG: Method 1 result = {data.url}")
    except Exception as e:
        print(f"DEBUG: Method 1 failed: {e}")
        try:
            # Method 2: Direct parameters
            print(f"DEBUG: Trying method 2 with redirect_to = {full_redirect_uri}")
            data = supabase.auth.sign_in_with_oauth(
                provider="google",
                options={"redirect_to": full_redirect_uri}
            )
            print(f"DEBUG: Method 2 result = {data.url}")
        except Exception as e2:
            print(f"DEBUG: Method 2 failed: {e2}")
            # Method 3: Fallback
            data = supabase.auth.sign_in_with_oauth("google")
            print(f"DEBUG: Method 3 fallback result = {data.url}")

    print(f"DEBUG: Supabase response URL = {data.url}")
    return RedirectResponse(data.url)

@router.get(
    "/callback",
    tags=["OAuth"],
    operation_id="oauth.callback",
    summary="[OAuth] Handle the callback from the identity provider and exchange the auth code for a session."
)
async def oauth_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client)
):
    """
    OAuth callback that handles Google OAuth response and redirects to MCP Inspector.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    if not state:
        raise HTTPException(status_code=400, detail="Missing state parameter")

    try:
        # Decode the state to get original OAuth parameters
        auth_state = jwt.decode(state, settings.JWT_SECRET, algorithms=["HS256"])

        # Exchange Google OAuth code for session
        try:
            session_data = supabase.auth.exchange_code_for_session({"auth_code": code})
        except Exception as e:
            print(f"DEBUG: exchange_code_for_session failed: {e}")
            # Try alternative method
            try:
                session_data = supabase.auth.exchange_code_for_session(code)
            except Exception as e2:
                print(f"DEBUG: alternative method failed: {e2}")
                # Try with different parameter name
                session_data = supabase.auth.exchange_code_for_session({"code": code})

        print(f"DEBUG: session_data type: {type(session_data)}")
        print(f"DEBUG: session_data: {session_data}")

        # Handle different response formats
        if isinstance(session_data, str):
            # If it's a string, it might be an error message
            raise Exception(f"Supabase returned string: {session_data}")

        # Extract tokens based on response structure
        if hasattr(session_data, 'session') and hasattr(session_data, 'user'):
            access_token = session_data.session.access_token
            refresh_token = session_data.session.refresh_token
            user_id = session_data.user.id
        elif isinstance(session_data, dict):
            access_token = session_data.get('access_token')
            refresh_token = session_data.get('refresh_token')
            user_id = session_data.get('user', {}).get('id') if session_data.get('user') else None
        else:
            raise Exception(f"Unexpected session_data format: {type(session_data)}")

        # Generate authorization code for MCP Inspector
        auth_code = jwt.encode({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_id": user_id,
            "resource": auth_state.get("resource"),  # Include MCP resource
            "scope": auth_state.get("scope", "mcp"),
            "exp": datetime.utcnow() + timedelta(minutes=10)
        }, settings.JWT_SECRET, algorithm="HS256")

        # Redirect back to MCP Inspector with authorization code
        redirect_uri = auth_state["original_redirect_uri"]
        original_state = auth_state.get("state", "")

        return RedirectResponse(f"{redirect_uri}?code={auth_code}&state={original_state}")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="State token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid state token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/token",
    tags=["OAuth"],
    operation_id="oauth.token",
    summary="[OAuth] Exchange a valid authorization code or refresh token for a new access token."
)
async def oauth_token(request: Request, supabase: Client = Depends(get_supabase_client)):
    """
    OAuth 2.0 token endpoint for exchanging authorization code for access token
    or refreshing an access token.
    """
    try:
        # Handle both form data and JSON
        content_type = request.headers.get("content-type", "")
        if "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            params = dict(form)
        else:
            try:
                params = await request.json()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid request format")

        grant_type = params.get("grant_type")

        if grant_type == "authorization_code":
            return await handle_authorization_code(params)
        elif grant_type == "refresh_token":
            return await handle_refresh_token(params, supabase)
        else:
            raise HTTPException(status_code=400, detail="Unsupported grant type")

    except HTTPException as e:
        # Re-raise HTTPException to ensure FastAPI handles it
        raise e
    except Exception as e:
        # Catch any other unexpected errors
        print(f"DEBUG: Unexpected error in /token endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


async def handle_authorization_code(params: dict):
    """Handles the authorization_code grant type."""
    code = params.get("code")
    resource = params.get("resource")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        payload = jwt.decode(code, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Authorization code expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid authorization code")

    # Validate resource if provided
    token_resource = payload.get("resource")
    if resource and resource != "undefined" and token_resource and resource != token_resource:
        raise HTTPException(status_code=400, detail="Resource mismatch")

    return {
        "access_token": payload["access_token"],
        "token_type": "Bearer",
        "expires_in": 3600,
        "refresh_token": payload.get("refresh_token"),
        "scope": payload.get("scope", "mcp"),
        "resource": token_resource,
    }


async def handle_refresh_token(params: dict, supabase: Client):
    """Handles the refresh_token grant type."""
    refresh_token = params.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Missing refresh token")

    try:
        # Use Supabase to refresh the session
        response = supabase.auth.refresh_session(refresh_token)

        # Log the full response for debugging
        print(f"DEBUG: Supabase refresh_session response: {response}")

        # Check for errors in the response
        if not response.session:
            error_detail = "Invalid refresh token"
            if hasattr(response, 'message'):
                error_detail = response.message
            elif hasattr(response, 'error'):
                error_detail = response.error.message
            raise HTTPException(status_code=400, detail=error_detail)

        # Extract new tokens from the session
        new_access_token = response.session.access_token
        new_refresh_token = response.session.refresh_token

        return {
            "access_token": new_access_token,
            "token_type": "Bearer",
            "expires_in": 3600,  # Typically, the new token has the same expiry
            "refresh_token": new_refresh_token,
            "scope": params.get("scope", "mcp"), # Preserve original scope
        }
    except Exception as e:
        # Log the exception for debugging
        print(f"DEBUG: Error during token refresh: {e}")
        # Check if the error message is about an invalid refresh token
        if "invalid refresh token" in str(e).lower():
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}")