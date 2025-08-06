#!/usr/bin/env python3
"""Test OAuth flow for MCP server."""

import httpx
import asyncio
from urllib.parse import urlparse, parse_qs


async def test_oauth_flow():
    """Test the complete OAuth flow."""
    base_url = "https://virion-labs-mcp-server-1089869749234.us-central1.run.app"
    redirect_uri = "http://localhost:3000/callback"
    
    async with httpx.AsyncClient() as client:
        # Step 1: Register a client
        print("1. Registering OAuth client...")
        response = await client.post(
            f"{base_url}/oauth/register",
            data={"redirect_uris": redirect_uri}
        )
        
        if response.status_code != 200:
            print(f"Client registration failed: {response.text}")
            return
        
        client_data = response.json()
        client_id = client_data["client_id"]
        client_secret = client_data["client_secret"]
        print(f"Client registered: {client_id}")
        
        # Step 2: Get authorization URL
        auth_url = f"{base_url}/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=mcp:tools&response_type=code"
        print(f"2. Authorization URL: {auth_url}")
        
        # Step 3: Simulate user login (this would normally be done in a browser)
        print("3. Simulating user authorization...")
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
        print(f"Authorization response headers: {dict(response.headers)}")
        print(f"Authorization response text: {response.text}")
        
        if response.status_code not in [302, 307]:
            print(f"Authorization failed: {response.text}")
            return
        
        # Extract authorization code from redirect
        location = response.headers.get("location")
        parsed = urlparse(location)
        code = parse_qs(parsed.query)["code"][0]
        print(f"Authorization code received: {code[:10]}...")
        
        # Step 4: Exchange code for access token
        print("4. Exchanging code for access token...")
        response = await client.post(
            f"{base_url}/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri
            }
        )
        
        if response.status_code != 200:
            print(f"Token exchange failed: {response.text}")
            return
        
        token_data = response.json()
        access_token = token_data["access_token"]
        print(f"Access token received: {access_token[:10]}...")
        
        # Step 4.5: Verify MCP endpoint is protected (should return 401)
        print("4.5. Testing MCP endpoint without token...")
        unauth_response = await client.get(f"{base_url}/mcp/")
        print(f"Unauthenticated request: {unauth_response.status_code} - {unauth_response.text}")
        
        # Step 5: Test MCP endpoint with token (with timeout for SSE)
        print("5. Testing MCP endpoint with access token...")
        try:
            response = await client.get(
                f"{base_url}/mcp/",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "text/event-stream"
                },
                timeout=5.0  # 5 second timeout for SSE connection
            )
        except httpx.ReadTimeout:
            print("✅ OAuth authentication successful! (SSE connection established)")
            return
        
        print(f"MCP endpoint response: {response.status_code}")
        if response.status_code == 200:
            print("✅ OAuth authentication successful!")
        else:
            print(f"❌ MCP endpoint failed: {response.text}")


if __name__ == "__main__":
    asyncio.run(test_oauth_flow())