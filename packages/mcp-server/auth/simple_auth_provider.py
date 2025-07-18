"""Simple OAuth provider for demonstration purposes."""

import secrets
import time
import hashlib
import base64
from typing import Dict, Optional, Any
from dataclasses import dataclass
from starlette.responses import HTMLResponse, RedirectResponse, JSONResponse
from starlette.requests import Request
import urllib.parse


@dataclass
class AccessToken:
    """Represents an OAuth access token."""
    token: str
    expires_at: float
    user_id: str
    scope: str
    client_id: str


class SimpleOAuthProvider:
    """Simple OAuth provider for MCP authentication."""
    
    def __init__(self, server_url: str):
        self.server_url = server_url.rstrip('/')
        
        # In-memory storage (not for production!)
        self.clients: Dict[str, Dict[str, Any]] = {}
        self.auth_codes: Dict[str, Dict[str, Any]] = {}
        self.tokens: Dict[str, AccessToken] = {}
        self.pkce_challenges: Dict[str, str] = {}  # Store PKCE challenges
        self.user_data: Dict[str, Dict[str, Any]] = {
            "demo_user": {
                "password": "demo_password",
                "user_id": "demo_user",
                "name": "Demo User"
            }
        }
        
        # Pre-register the persistent Claude Desktop client ID
        self.clients["client_mZdjSW0PRVzVfCD9h1yOAg"] = {
            "client_secret": "claude_desktop_secret",
            "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
            "redirect_uri": "https://claude.ai/api/mcp/auth_callback",
            "created_at": time.time()
        }
    
    def _verify_pkce(self, code_verifier: str, code_challenge: str, method: str = "S256") -> bool:
        """Verify PKCE code challenge."""
        if method == "S256":
            # Create SHA256 hash of verifier and base64url encode
            digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
            challenge = base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
            return challenge == code_challenge
        elif method == "plain":
            return code_verifier == code_challenge
        return False
    
    async def register_client(self, redirect_uris: list) -> Dict[str, str]:
        """Register a new OAuth client (Dynamic Client Registration)."""
        client_id = f"client_{secrets.token_urlsafe(16)}"
        client_secret = secrets.token_urlsafe(32)
        
        self.clients[client_id] = {
            "client_secret": client_secret,
            "redirect_uris": redirect_uris,
            "redirect_uri": redirect_uris[0],  # Keep backward compatibility
            "created_at": time.time()
        }
        
        # Debug logging
        print(f"Client registered - ID: {client_id}, redirect_uris: {redirect_uris}")
        print(f"Total registered clients: {len(self.clients)}")
        
        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": redirect_uris
        }
    
    async def authorize(self, request: Request) -> HTMLResponse:
        """Show authorization page."""
        client_id = request.query_params.get("client_id")
        redirect_uri = request.query_params.get("redirect_uri")
        state = request.query_params.get("state", "")
        scope = request.query_params.get("scope", "")
        code_challenge = request.query_params.get("code_challenge")
        code_challenge_method = request.query_params.get("code_challenge_method", "S256")
        
        # Debug logging
        print(f"Authorization request - client_id: {client_id}")
        print(f"Registered clients: {list(self.clients.keys())}")
        print(f"Client exists: {client_id in self.clients if client_id else False}")
        
        # Auto-register Claude clients with the correct redirect URI
        if not client_id:
            return HTMLResponse("Missing client_id", status_code=400)
            
        if client_id not in self.clients:
            # Check if this is a Claude client by redirect URI
            if redirect_uri == "https://claude.ai/api/mcp/auth_callback" and client_id.startswith("client_"):
                print(f"Auto-registering Claude client: {client_id}")
                self.clients[client_id] = {
                    "client_secret": "claude_desktop_secret",
                    "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
                    "redirect_uri": "https://claude.ai/api/mcp/auth_callback",
                    "created_at": time.time()
                }
            else:
                error_msg = f"Invalid client_id: {client_id}. Registered clients: {list(self.clients.keys())}"
                print(error_msg)
                return HTMLResponse(error_msg, status_code=400)
        
        # Validate redirect_uri against registered URIs
        client_data = self.clients[client_id]
        registered_uris = client_data.get("redirect_uris", [client_data.get("redirect_uri")])
        if redirect_uri not in registered_uris:
            return HTMLResponse("Invalid redirect_uri", status_code=400)
        
        # Store PKCE challenge if provided
        if code_challenge:
            self.pkce_challenges[client_id] = {
                "challenge": code_challenge,
                "method": code_challenge_method
            }
        
        # Simple login form
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Virion Labs MCP - Login</title>
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }}
                .form-group {{ margin-bottom: 15px; }}
                label {{ display: block; margin-bottom: 5px; }}
                input {{ width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }}
                button {{ background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }}
                button:hover {{ background: #005a87; }}
            </style>
        </head>
        <body>
            <h2>Virion Labs MCP Server</h2>
            <p>Please login to authorize access</p>
            <form method="post" action="{self.server_url}/login/callback">
                <input type="hidden" name="client_id" value="{client_id}">
                <input type="hidden" name="redirect_uri" value="{redirect_uri}">
                <input type="hidden" name="state" value="{state}">
                <input type="hidden" name="scope" value="{scope}">
                
                <div class="form-group">
                    <label>Username:</label>
                    <input type="text" name="username" value="demo_user" required>
                </div>
                
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" name="password" value="demo_password" required>
                </div>
                
                <button type="submit">Login & Authorize</button>
            </form>
        </body>
        </html>
        """
        return HTMLResponse(html)
    
    async def login_callback(self, request: Request) -> RedirectResponse:
        """Handle login form submission."""
        # Handle POST from login form
        form = await request.form()
        client_id = form.get("client_id")
        redirect_uri = form.get("redirect_uri")
        state = form.get("state", "")
        username = form.get("username")
        password = form.get("password")
        
        # Validate credentials
        if (username not in self.user_data or 
            self.user_data[username]["password"] != password):
            return HTMLResponse("Invalid credentials", status_code=401)
        
        # Generate authorization code
        auth_code = secrets.token_urlsafe(32)
        
        # Include PKCE challenge if it exists
        pkce_data = self.pkce_challenges.get(client_id, {})
        
        self.auth_codes[auth_code] = {
            "client_id": client_id,
            "user_id": username,
            "expires_at": time.time() + 600,  # 10 minutes
            "code_challenge": pkce_data.get("challenge"),
            "code_challenge_method": pkce_data.get("method"),
            "redirect_uri": redirect_uri
        }
        
        # Redirect back to client
        params = {"code": auth_code}
        if state:
            params["state"] = state
            
        redirect_url = f"{redirect_uri}?{urllib.parse.urlencode(params)}"
        return RedirectResponse(redirect_url, status_code=303)
    
    async def callback(self, request: Request):
        """Handle OAuth authorization callback (for debugging)."""
        code = request.query_params.get("code")
        state = request.query_params.get("state", "")
        if not code:
            return HTMLResponse("Missing authorization code", status_code=400)
        return HTMLResponse(f"Authorization successful! Code: {code}, State: {state}", status_code=200)
    
    async def exchange_token(self, request: Request) -> JSONResponse:
        """Exchange authorization code for access token."""
        form = await request.form()
        grant_type = form.get("grant_type")
        code = form.get("code")
        client_id = form.get("client_id")
        client_secret = form.get("client_secret")
        redirect_uri = form.get("redirect_uri")
        code_verifier = form.get("code_verifier")  # PKCE
        
        if grant_type != "authorization_code":
            return JSONResponse({"error": "unsupported_grant_type"}, status_code=400)
        
        # Validate authorization code
        if code not in self.auth_codes:
            return JSONResponse({"error": "invalid_grant"}, status_code=400)
        
        auth_data = self.auth_codes[code]
        
        # Check if expired
        if time.time() > auth_data["expires_at"]:
            del self.auth_codes[code]
            return JSONResponse({"error": "invalid_grant"}, status_code=400)
        
        # Validate client
        if (auth_data["client_id"] != client_id or 
            client_id not in self.clients or
            self.clients[client_id]["client_secret"] != client_secret):
            return JSONResponse({"error": "invalid_client"}, status_code=401)
        
        # Validate redirect_uri matches the one used in authorization
        if auth_data["redirect_uri"] != redirect_uri:
            return JSONResponse({"error": "invalid_grant"}, status_code=400)
        
        # Verify PKCE if challenge was provided
        if auth_data.get("code_challenge"):
            if not code_verifier:
                return JSONResponse({"error": "invalid_request", "error_description": "code_verifier required"}, status_code=400)
            
            if not self._verify_pkce(
                code_verifier, 
                auth_data["code_challenge"], 
                auth_data.get("code_challenge_method", "S256")
            ):
                return JSONResponse({"error": "invalid_grant", "error_description": "PKCE verification failed"}, status_code=400)
        
        # Generate access token with shorter lifetime for better security
        access_token = secrets.token_urlsafe(32)
        expires_at = time.time() + 1800  # 30 minutes (reduced from 1 hour)
        
        token_obj = AccessToken(
            token=access_token,
            expires_at=expires_at,
            user_id=auth_data["user_id"],
            scope="mcp:tools mcp:resources",
            client_id=client_id
        )
        
        self.tokens[access_token] = token_obj
        
        # Clean up authorization code
        del self.auth_codes[code]
        
        return JSONResponse({
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 1800,  # 30 minutes
            "scope": "mcp:tools mcp:resources"
        })
    
    async def introspect_token(self, request: Request) -> JSONResponse:
        """Introspect an access token (RFC 7662)."""
        form = await request.form()
        token = form.get("token")
        
        if not token or token not in self.tokens:
            return JSONResponse({"active": False})
        
        token_obj = self.tokens[token]
        
        # Check if expired
        if time.time() > token_obj.expires_at:
            del self.tokens[token]
            return JSONResponse({"active": False})
        
        return JSONResponse({
            "active": True,
            "scope": token_obj.scope,
            "client_id": token_obj.client_id,
            "username": token_obj.user_id,
            "exp": int(token_obj.expires_at),
            "aud": f"{self.server_url}/mcp/"
        })
    
    async def get_wellknown_config(self) -> JSONResponse:
        """Return OAuth well-known configuration."""
        return JSONResponse({
            "issuer": self.server_url,
            "authorization_endpoint": f"{self.server_url}/oauth/authorize",
            "token_endpoint": f"{self.server_url}/oauth/token",
            "introspection_endpoint": f"{self.server_url}/oauth/introspect",
            "registration_endpoint": f"{self.server_url}/oauth/register",
            "scopes_supported": ["mcp:tools", "mcp:resources"],
            "response_types_supported": ["code"],
            "grant_types_supported": ["authorization_code"],
            "token_endpoint_auth_methods_supported": ["client_secret_post"],
            "code_challenge_methods_supported": ["S256", "plain"]  # PKCE support
        })
    
    def cleanup_expired_tokens(self):
        """Clean up expired tokens and authorization codes."""
        current_time = time.time()
        
        # Clean up expired tokens
        expired_tokens = [
            token for token, token_obj in self.tokens.items()
            if current_time > token_obj.expires_at
        ]
        for token in expired_tokens:
            del self.tokens[token]
        
        # Clean up expired authorization codes
        expired_codes = [
            code for code, auth_data in self.auth_codes.items()
            if current_time > auth_data["expires_at"]
        ]
        for code in expired_codes:
            del self.auth_codes[code]
        
        return len(expired_tokens) + len(expired_codes)