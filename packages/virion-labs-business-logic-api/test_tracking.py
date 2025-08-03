#!/usr/bin/env python3
"""
Test script for referral link tracking functionality.

This script validates that the tracking endpoints work correctly.
"""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

async def test_tracking_endpoints():
    """Test the tracking endpoints to ensure they work correctly."""
    
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Referral Link Tracking Implementation")
        print("=" * 50)
        
        # Test 1: Check if tracking endpoints are available
        print("\n1️⃣ Testing endpoint availability...")
        
        try:
            # Check the API root
            response = await client.get(f"{BASE_URL}/")
            if response.status_code == 200:
                print("✅ API is running")
            else:
                print(f"❌ API not responding: {response.status_code}")
                return
        except Exception as e:
            print(f"❌ Cannot connect to API: {e}")
            print("Make sure the API is running with: uvicorn main:app --reload")
            return
        
        # Test 2: Check OpenAPI docs include tracking endpoints
        print("\n2️⃣ Checking if tracking endpoints are registered...")
        try:
            response = await client.get(f"{BASE_URL}/openapi.json")
            if response.status_code == 200:
                openapi_spec = response.json()
                paths = openapi_spec.get("paths", {})
                
                tracking_endpoints = [
                    "/api/v1/tracking/click/{referral_code}",
                    "/api/v1/tracking/r/{referral_code}",
                    "/api/v1/tracking/conversion/{referral_code}",
                    "/api/v1/tracking/conversion",
                    "/api/v1/tracking/stats/{referral_code}"
                ]
                
                for endpoint in tracking_endpoints:
                    if endpoint in paths:
                        print(f"✅ {endpoint} is registered")
                    else:
                        print(f"❌ {endpoint} is missing")
                        
            else:
                print(f"❌ Cannot get OpenAPI spec: {response.status_code}")
        except Exception as e:
            print(f"❌ Error checking OpenAPI spec: {e}")
        
        # Test 3: Test tracking a non-existent referral code (should return 404)
        print("\n3️⃣ Testing tracking with non-existent referral code...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/tracking/click/nonexistent123",
                json={}
            )
            if response.status_code == 404:
                print("✅ Correctly returns 404 for non-existent referral code")
            else:
                print(f"❌ Expected 404, got {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Error testing non-existent referral code: {e}")
        
        print("\n🏁 Test completed!")
        print("\n📋 Next Steps:")
        print("1. Start the API server: uvicorn main:app --reload")
        print("2. Create some test referral links in your dashboard")
        print("3. Test the tracking endpoints with real referral codes")
        print("4. Check that the metrics show up in the influencer dashboard")


if __name__ == "__main__":
    asyncio.run(test_tracking_endpoints())