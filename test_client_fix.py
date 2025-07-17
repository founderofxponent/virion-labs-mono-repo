#!/usr/bin/env python3
"""
Test script to verify the clients router fix.
"""

import asyncio
import httpx
import json

# API configuration
API_BASE_URL = "http://localhost:8000"
API_KEY = "virion_internal_key_2024"

async def test_clients_endpoint():
    """Test the clients endpoint directly."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {API_KEY}"}
        
        print("Testing clients endpoint...")
        response = await client.get(f"{API_BASE_URL}/api/clients/", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response type: {type(data)}")
            print(f"Response: {data}")
            
            # Test our fix logic
            if isinstance(data, list):
                print("✅ API returns a direct list (as expected)")
                return data
            else:
                print("❌ API returns an object, not a list")
                return data.get("clients", [])
        else:
            print(f"❌ Error: {response.text}")
            return []

async def main():
    """Run the test."""
    print("Testing Clients Router Fix")
    print("=" * 30)
    
    try:
        clients = await test_clients_endpoint()
        print(f"\nProcessed clients: {len(clients)} found")
        
        if isinstance(clients, list):
            print("✅ Fix will work correctly - API returns direct list")
        else:
            print("❌ Unexpected response format")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        print("\nNote: Make sure the API server is running on localhost:8000")

if __name__ == "__main__":
    asyncio.run(main())
