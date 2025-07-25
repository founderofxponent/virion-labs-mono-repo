#!/usr/bin/env python3
"""
Simple test script to verify Strapi connection and API functionality
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the current directory to Python path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent))

from core.strapi_client import strapi_client
from services.strapi_campaign_service import get_campaigns, get_available_campaigns

async def test_strapi_connection():
    """Test basic Strapi connectivity"""
    print("🧪 Testing Strapi Connection...")
    
    try:
        # Test 1: Get all campaigns
        print("\n1. Fetching all campaigns...")
        campaigns = await get_campaigns()
        print(f"   ✅ Found {len(campaigns)} campaigns")
        
        # Test 2: Get available campaigns  
        print("\n2. Fetching available campaigns...")
        available_campaigns = await get_available_campaigns()
        print(f"   ✅ Found {len(available_campaigns)} available campaigns")
        
        # Test 3: Test client connection
        print("\n3. Testing direct Strapi client...")
        clients = await strapi_client.get_clients()
        print(f"   ✅ Found {len(clients)} clients")
        
        print("\n🎉 All tests passed! Strapi integration is working.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print("=" * 50)
    print("🚀 STRAPI INTEGRATION TEST")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check required environment variables
    required_vars = ["STRAPI_URL", "STRAPI_API_TOKEN"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        print("   Please check your .env file")
        return False
    
    print(f"📍 Strapi URL: {os.getenv('STRAPI_URL')}")
    print(f"🔑 API Token: {'*' * 20}...{os.getenv('STRAPI_API_TOKEN', '')[-10:]}")
    
    # Run the test
    success = await test_strapi_connection()
    
    if success:
        print("\n✅ Integration test completed successfully!")
    else:  
        print("\n❌ Integration test failed. Please check your configuration.")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())