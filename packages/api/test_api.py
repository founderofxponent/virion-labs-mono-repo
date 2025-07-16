#!/usr/bin/env python3
"""
Simple test script to verify the API endpoints are working.
"""

import asyncio
import httpx
import json
from datetime import datetime

# API configuration
API_BASE_URL = "http://localhost:8000"
API_KEY = "test-api-key"  # This should match what's configured in the API

async def test_health_check():
    """Test the health check endpoint."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/status/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")

async def test_create_client():
    """Test creating a client."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
        client_data = {
            "name": "Test Client",
            "email": "test@example.com",
            "phone": "+1234567890",
            "company": "Test Company",
            "notes": "Test client for API verification"
        }
        
        response = await client.post(f"{API_BASE_URL}/api/clients/", json=client_data, headers=headers)
        print(f"Create client: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Created client: {result}")
            return result.get("id")
        else:
            print(f"Error: {response.text}")
            return None

async def test_list_clients():
    """Test listing clients."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {API_KEY}"}
        response = await client.get(f"{API_BASE_URL}/api/clients/", headers=headers)
        print(f"List clients: {response.status_code}")
        if response.status_code == 200:
            clients = response.json()
            print(f"Found {len(clients)} clients")
            return clients
        else:
            print(f"Error: {response.text}")
            return []

async def test_create_campaign():
    """Test creating a campaign."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
        campaign_data = {
            "name": "Test Campaign",
            "description": "Test campaign for API verification",
            "discord_guild_id": "123456789",
            "discord_channel_id": "987654321",
            "is_active": True,
            "onboarding_config": {
                "bot_name": "TestBot",
                "welcome_message": "Welcome to the test campaign!"
            },
            "landing_page_config": {
                "campaign_type": "influencer_marketing"
            }
        }
        
        response = await client.post(f"{API_BASE_URL}/api/bot-campaigns/", json=campaign_data, headers=headers)
        print(f"Create campaign: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Created campaign: {result}")
            return result.get("id")
        else:
            print(f"Error: {response.text}")
            return None

async def test_list_campaigns():
    """Test listing campaigns."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {API_KEY}"}
        response = await client.get(f"{API_BASE_URL}/api/bot-campaigns/", headers=headers)
        print(f"List campaigns: {response.status_code}")
        if response.status_code == 200:
            campaigns = response.json()
            print(f"Found {len(campaigns)} campaigns")
            return campaigns
        else:
            print(f"Error: {response.text}")
            return []

async def main():
    """Run all tests."""
    print("Testing Virion Labs Unified API")
    print("=" * 40)
    
    # Test health check
    await test_health_check()
    print()
    
    # Test client operations
    print("Testing Client Operations:")
    print("-" * 20)
    client_id = await test_create_client()
    await test_list_clients()
    print()
    
    # Test campaign operations
    print("Testing Campaign Operations:")
    print("-" * 20)
    campaign_id = await test_create_campaign()
    await test_list_campaigns()
    print()
    
    print("API test completed!")

if __name__ == "__main__":
    asyncio.run(main())