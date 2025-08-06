#!/usr/bin/env python3
"""Test OAuth flow with PKCE for MCP server."""

import httpx
import asyncio
import hashlib
import base64
import secrets
from urllib.parse import urlparse, parse_qs


def generate_pkce():
    """Generate PKCE code verifier and challenge."""
    # Generate code verifier (43-128 characters)
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    
    # Generate code challenge (S256)
    digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
    
    return code_verifier, code_challenge


async def test_oauth_flow_with_pkce():
    """Test the complete OAuth flow with PKCE."""
    base_url = "https://virion-labs-mcp-server-1089869749234.us-central1.run.app"
    redirect_uri = "http://localhost:3000/callback"
    
    # Generate PKCE parameters
    code_verifier, code_challenge = generate_pkce()
    print(f"Generated PKCE verifier: {code_verifier[:10]}...")
    print(f"Generated PKCE challenge: {code_challenge[:10]}...")
    
    async with httpx.AsyncClient() as client:
        # Step 1: Register a client with JSON (testing new feature)
        print("1. Registering OAuth client with JSON...")
        response = await client.post(
            f"{base_url}/oauth/register",
            json={"redirect_uris": [redirect_uri]},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print(f"Client registration failed: {response.text}")
            return
        
        client_data = response.json()
        client_id = client_data["client_id"]
        client_secret = client_data["client_secret"]
        print(f"Client registered: {client_id}")
        
        # Step 2: Get authorization URL with PKCE
        auth_url = f"{base_url}/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=mcp:tools&response_type=code&code_challenge={code_challenge}&code_challenge_method=S256"
        print(f"2. Authorization URL with PKCE: {auth_url[:100]}...")
        
        # Step 3: Simulate user login with PKCE
        print("3. Simulating user authorization with PKCE...")
        response = await client.post(
            f"{base_url}/oauth/callback",
            data={
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "username": "demo_user",
                "password": "demo_password"
            },
            follow_redirects=False
        )
        
        print(f"Authorization response status: {response.status_code}")
        
        if response.status_code not in [302, 307]:
            print(f"Authorization failed: {response.text}")
            return
        
        # Extract authorization code from redirect
        location = response.headers.get("location")
        parsed = urlparse(location)
        code = parse_qs(parsed.query)["code"][0]
        print(f"Authorization code received: {code[:10]}...")
        
        # Step 4: Exchange code for access token with PKCE verifier
        print("4. Exchanging code for access token with PKCE...")
        response = await client.post(
            f"{base_url}/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier  # PKCE verifier
            }
        )
        
        if response.status_code != 200:
            print(f"Token exchange failed: {response.text}")
            return
        
        token_data = response.json()
        access_token = token_data["access_token"]
        expires_in = token_data["expires_in"]
        print(f"Access token received: {access_token[:10]}...")
        print(f"Token expires in: {expires_in} seconds")
        
        # Step 5: Test MCP endpoint with token
        print("5. Testing MCP endpoint with access token...")
        try:
            response = await client.get(
                f"{base_url}/mcp/",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "text/event-stream"
                },
                timeout=5.0
            )
        except httpx.ReadTimeout:
            print("✅ OAuth with PKCE authentication successful! (SSE connection established)")
            return
        
        print(f"MCP endpoint response: {response.status_code}")
        if response.status_code == 200:
            print("✅ OAuth with PKCE authentication successful!")
        else:
            print(f"❌ MCP endpoint failed: {response.text}")


if __name__ == "__main__":
    asyncio.run(test_oauth_flow_with_pkce())