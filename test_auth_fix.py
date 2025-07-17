#!/usr/bin/env python3
"""
Test script to verify API key authentication fix.
"""

import asyncio
import httpx
import json

# API configuration
API_BASE_URL = "http://localhost:8000"
API_KEY = "virion_internal_key_2024"

async def test_api_key_auth():
    """Test API key authentication."""
    print("Testing API Key Authentication")
    print("=" * 35)
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {API_KEY}"}
        
        print(f"API Key: {API_KEY}")
        print(f"Authorization Header: Bearer {API_KEY}")
        print()
        
        # Test health endpoint first
        print("1. Testing health endpoint...")
        try:
            response = await client.get(f"{API_BASE_URL}/status/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {response.json()}")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   Exception: {e}")
        
        print()
        
        # Test clients endpoint with authentication
        print("2. Testing clients endpoint with API key...")
        try:
            response = await client.get(f"{API_BASE_URL}/api/clients/", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Success! Got {len(data)} clients")
                return True
            else:
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"   Exception: {e}")
            return False

async def test_without_auth():
    """Test endpoint without authentication."""
    print("3. Testing clients endpoint without authentication...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{API_BASE_URL}/api/clients/")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
        except Exception as e:
            print(f"   Exception: {e}")

async def main():
    """Run authentication tests."""
    auth_success = await test_api_key_auth()
    print()
    await test_without_auth()
    
    print()
    if auth_success:
        print("✅ API Key authentication is working!")
        print("✅ The clients router fix should now work correctly.")
    else:
        print("❌ API Key authentication failed.")
        print("   Check that the API server is running and environment variables are loaded correctly.")

if __name__ == "__main__":
    asyncio.run(main())
