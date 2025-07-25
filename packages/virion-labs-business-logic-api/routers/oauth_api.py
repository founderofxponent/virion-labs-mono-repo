from fastapi import APIRouter, Request, Depends, HTTPException
from starlette.responses import RedirectResponse
from supabase import Client
from typing import Optional
from datetime import datetime, timedelta
import jwt

from core.database import get_supabase_client
from core.config import settings

router = APIRouter()

@router.get("/authorize")
async def oauth_authorize(
    request: Request,
    client_id: str,
    response_type: str,
    redirect_uri: str,
    scope: str = "mcp",
    state: Optional[str] = None,
    code_challenge: Optional[str] = None,
    code_challenge_method: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client)
):
    """
    OAuth 2.0 authorization endpoint.
    This creates a state token and redirects the user to the identity provider.
    """
    if response_type != "code":
        raise HTTPException(status_code=400, detail="Unsupported response type")

    # The callback URL for Google to redirect back to.
    # This must match the authorized redirect URI in your Google Cloud console.
    base_url = str(request.base_url).rstrip("/")
    google_redirect_uri = f"{base_url}/api/oauth/callback"

    # Store original request parameters in a temporary JWT state token
    auth_state = {
        "original_redirect_uri": redirect_uri,
        "client_id": client_id,
        "scope": scope,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method,
        "exp": datetime.utcnow() + timedelta(minutes=30)
    }
    state_token = jwt.encode(auth_state, settings.JWT_SECRET, algorithm="HS256")

    # Generate the Google sign-in URL via the Supabase client
    data, error = supabase.auth.sign_in_with_oauth({
        "provider": "google",
        "options": {
            "redirect_to": f"{google_redirect_uri}?state={state_token}"
        }
    })

    # WORKAROUND for a quirk in the supabase-py library where the success URL
    # is sometimes returned in the 'error' tuple.
    if error and isinstance(error, tuple) and len(error) == 2 and error[0] == 'url':
        redirect_url = error[1]
        return RedirectResponse(redirect_url)

    # Handle a genuine error
    if error:
        raise HTTPException(status_code=500, detail=f"Supabase OAuth error: {str(error)}")

    # Handle the expected success case
    if data and "url" in data:
        return RedirectResponse(data["url"])

    # Fallback if the response is unexpected
    raise HTTPException(status_code=500, detail="Could not determine OAuth redirect URL from Supabase.")
