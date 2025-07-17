#!/usr/bin/env python3
"""
Simple test script to verify the critical analytics endpoints are working.
"""
import requests
import json
from uuid import uuid4

# Test configuration
BASE_URL = "http://localhost:8000"
API_KEY = "test-api-key"  # Replace with actual API key

def test_analytics_track():
    """Test the POST /api/analytics/track endpoint"""
    url = f"{BASE_URL}/api/analytics/track"
    
    payload = {
        "event_type": "interaction",
        "guild_id": "123456789",
        "user_id": "user123",
        "campaign_id": str(uuid4()),
        "interaction_type": "slash_command",
        "command_name": "join",
        "response_time_ms": 250,
        "sentiment_score": 0.8,
        "metadata": {
            "test": True,
            "source": "api_test"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"POST /api/analytics/track")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing analytics track: {e}")
        return False

def test_guild_analytics():
    """Test the GET /api/analytics/guild/{guild_id} endpoint"""
    guild_id = "123456789"
    url = f"{BASE_URL}/api/analytics/guild/{guild_id}"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"GET /api/analytics/guild/{guild_id}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing guild analytics: {e}")
        return False

def test_campaign_overview():
    """Test the GET /api/analytics/campaign-overview endpoint"""
    url = f"{BASE_URL}/api/analytics/campaign-overview"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"GET /api/analytics/campaign-overview")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing campaign overview: {e}")
        return False

if __name__ == "__main__":
    print("Testing Critical Analytics Endpoints")
    print("=" * 40)
    
    # Note: These tests require the API server to be running
    # and proper authentication setup
    print("NOTE: Make sure the API server is running on localhost:8000")
    print("NOTE: Update the API_KEY variable with a valid API key")
    print()
    
    results = []
    results.append(test_analytics_track())
    results.append(test_guild_analytics())
    results.append(test_campaign_overview())
    
    print("=" * 40)
    print(f"Tests passed: {sum(results)}/{len(results)}")