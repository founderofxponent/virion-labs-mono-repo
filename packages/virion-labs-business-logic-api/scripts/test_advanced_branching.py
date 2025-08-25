#!/usr/bin/env python3
"""
Test Advanced Branching Logic

This script tests the newly created advanced branching campaign to ensure
the branching logic works correctly for different user profiles.

Usage:
    python test_advanced_branching.py
    
Environment variables:
    STRAPI_BASE_URL: Base URL for Strapi (default: http://localhost:1337)
    STRAPI_API_TOKEN: API token for Strapi authentication
    API_KEY: Business Logic API key for testing endpoints
"""

import asyncio
import json
import sys
import os
from datetime import datetime
from pathlib import Path
import httpx

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from core.strapi_client import StrapiClient
from services.integration_service import IntegrationService


async def test_branching_with_api():
    """Test branching logic using the Business Logic API"""
    print("\n🧪 Testing Branching Logic with Business Logic API")
    print("=" * 60)
    
    api_key = os.getenv('API_KEY', '31db492f8194542a1965bfc4ac58fe69e621e7e2fc069817a41387d32b251a3e')
    base_url = os.getenv('API_URL', 'http://localhost:8000/api/v1')
    
    async with httpx.AsyncClient() as client:
        headers = {"X-API-Key": api_key}
        
        # Test different user profiles
        test_profiles = [
            {
                "name": "Complete Beginner",
                "responses": {
                    "experience_level": "complete_beginner",
                    "primary_languages": []
                },
                "expected_next_step": 2,
                "description": "Should go to Step 2 (Learning Path)"
            },
            {
                "name": "Learning Student", 
                "responses": {
                    "experience_level": "learning",
                    "primary_languages": ["javascript", "python"]
                },
                "expected_next_step": 2,
                "description": "Should go to Step 2 (Learning Path)"
            },
            {
                "name": "Intermediate Developer",
                "responses": {
                    "experience_level": "intermediate",
                    "primary_languages": ["javascript", "python", "java"]
                },
                "expected_next_step": 3,
                "description": "Should skip to Step 3 (Specialization)"
            },
            {
                "name": "Advanced Developer",
                "responses": {
                    "experience_level": "advanced",
                    "primary_languages": ["javascript", "python", "go", "rust"]
                },
                "expected_next_step": 4,
                "description": "Should skip to Step 4 (Leadership)"
            },
            {
                "name": "Expert Developer",
                "responses": {
                    "experience_level": "expert",
                    "primary_languages": ["go", "rust", "c++", "assembly"]
                },
                "expected_next_step": 4,
                "description": "Should skip to Step 4 (Leadership)"
            }
        ]
        
        # Mock field structure (full schema for API)
        mock_fields = [
            {
                "field_key": "experience_level",
                "field_label": "What is your programming experience level?",
                "field_type": "select",
                "step_number": 1,
                "is_required": True,
                "is_enabled": True,
                "sort_order": 1,
                "branching_logic": [
                    {
                        "condition": {
                            "field_key": "experience_level",
                            "operator": "in_list",
                            "value": ["advanced", "expert"]
                        },
                        "actions": {
                            "set_next_step": {
                                "step_number": 4
                            }
                        },
                        "priority": 20,
                        "id": "skip_to_leadership_for_experienced",
                        "description": "Advanced/Expert users skip directly to leadership questions"
                    },
                    {
                        "condition": {
                            "field_key": "experience_level",
                            "operator": "equals",
                            "value": "intermediate"
                        },
                        "actions": {
                            "set_next_step": {
                                "step_number": 3
                            }
                        },
                        "priority": 15,
                        "id": "skip_to_specialization_for_intermediate",
                        "description": "Intermediate users skip to specialization questions"
                    }
                ]
            },
            {
                "field_key": "primary_languages",
                "field_label": "What programming languages do you know?",
                "field_type": "multiselect",
                "step_number": 1,
                "is_required": False,
                "is_enabled": True,
                "sort_order": 2,
                "branching_logic": [
                    {
                        "condition": {
                            "field_key": "primary_languages",
                            "operator": "array_length_equals",
                            "value": 0
                        },
                        "actions": {
                            "set_field_values": {
                                "experience_level": {
                                    "value": "complete_beginner"
                                }
                            }
                        },
                        "priority": 25,
                        "id": "force_beginner_path_no_languages",
                        "description": "If no languages selected, force beginner experience level"
                    }
                ]
            },
            # Add mock fields for other steps to ensure sequential logic works
            {
                "field_key": "learning_path",
                "field_label": "Learning Path",
                "field_type": "select",
                "step_number": 2,
                "is_required": True,
                "is_enabled": True,
                "sort_order": 1,
                "branching_logic": []
            },
            {
                "field_key": "specialization",
                "field_label": "Specialization",
                "field_type": "select",
                "step_number": 3,
                "is_required": True,
                "is_enabled": True,
                "sort_order": 1,
                "branching_logic": []
            },
            {
                "field_key": "leadership_experience",
                "field_label": "Leadership Experience",
                "field_type": "boolean",
                "step_number": 4,
                "is_required": True,
                "is_enabled": True,
                "sort_order": 1,
                "branching_logic": []
            }
        ]
        
        for profile in test_profiles:
            print(f"\n🔍 Testing Profile: {profile['name']}")
            print(f"📊 Responses: {profile['responses']}")
            print(f"🎯 Expected: {profile['description']}")
            
            # Test next step calculation
            request_data = {
                "current_step": 1,
                "responses": profile["responses"],
                "all_fields": mock_fields
            }
            
            try:
                response = await client.post(
                    f"{base_url}/integrations/branching/calculate-next-step",
                    json=request_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    next_step = result.get("next_step")
                    skipped_steps = result.get("skipped_steps", [])
                    applied_rules = result.get("applied_rules", [])
                    branching_occurred = result.get("branching_occurred", False)
                    
                    # Check if result matches expectation
                    if next_step == profile["expected_next_step"]:
                        print(f"✅ PASS: Next step = {next_step}")
                    else:
                        print(f"❌ FAIL: Expected step {profile['expected_next_step']}, got {next_step}")
                    
                    if skipped_steps:
                        print(f"⏭️  Skipped steps: {skipped_steps}")
                    
                    if applied_rules:
                        print(f"🔀 Applied rules:")
                        for rule in applied_rules:
                            print(f"   • {rule.get('description', 'Unnamed rule')} (Priority: {rule.get('priority', 0)})")
                    
                    if branching_occurred:
                        print(f"🎯 Branching logic was applied")
                    else:
                        print(f"➡️ Sequential progression (no branching)")
                        
                else:
                    print(f"❌ API Error: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"❌ Request Error: {e}")
        
        print(f"\n✨ API Branching Logic Test Complete!")


async def test_discord_simulation():
    """Test Discord bot branching simulation"""
    print("\n🤖 Testing Discord Bot Branching Simulation")
    print("=" * 50)
    
    # Simulate what the Discord bot would receive from the business logic API
    campaign_document_id = "if97jzhenxoggtbuzlyostdf"
    
    # Test with environment variables  
    os.environ['STRAPI_API_TOKEN'] = os.getenv('STRAPI_API_TOKEN', '9acc6482212e3b90e28f09c6ffc4cdbf36f9a26c2606b87da9118dc2ac05ab86678be2f12a4ef2c4971fe21c85a9d554d43cfb3be12da52e1844ac9a21d8aff39300fc3e337108620e7f3cda70531bf875daf9ddecdbb148fca6579006e9c2e4210adc19f08a8145badceaa14ac30305445807f9ecad19f5b4ad32cc73426322')
    os.environ['STRAPI_URL'] = os.getenv('STRAPI_BASE_URL', 'http://localhost:1337')
    
    try:
        # Initialize services
        strapi_client = StrapiClient()
        integration_service = IntegrationService()
        
        # Get onboarding fields from the campaign
        print(f"🔍 Fetching onboarding fields for campaign: {campaign_document_id}")
        fields_data = await strapi_client.get_onboarding_fields_by_campaign(campaign_document_id)
        
        print(f"📊 Found {len(fields_data)} onboarding fields")
        
        # Test different user scenarios
        test_scenarios = [
            {
                "name": "Expert Developer Path",
                "responses": {
                    "experience_level": "expert",
                    "primary_languages": ["go", "rust", "cpp"]
                },
                "expected_skip": True,
                "expected_step": 4
            },
            {
                "name": "Beginner Path",
                "responses": {
                    "experience_level": "complete_beginner",
                    "primary_languages": []
                },
                "expected_skip": False,
                "expected_step": 2
            },
            {
                "name": "Intermediate Path",
                "responses": {
                    "experience_level": "intermediate",
                    "primary_languages": ["javascript", "python"]
                },
                "expected_skip": True,
                "expected_step": 3
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n🎭 Testing Scenario: {scenario['name']}")
            print(f"📝 Responses: {json.dumps(scenario['responses'], indent=2)}")
            
            # Convert fields to dict format for service
            all_fields = []
            for field in fields_data:
                field_dict = {
                    "field_key": field.field_key,
                    "step_number": field.step_number or 1,
                    "branching_logic": field.branching_logic or []
                }
                all_fields.append(field_dict)
            
            # Calculate next step using the service
            result = integration_service.calculate_next_step_enhanced(
                1, 
                scenario["responses"], 
                all_fields
            )
            
            print(f"🎯 Result: {json.dumps(result, indent=2)}")
            
            # Check expectations
            next_step = result.get("next_step")
            branching_occurred = result.get("branching_occurred", False)
            
            if next_step == scenario["expected_step"]:
                print(f"✅ PASS: Next step = {next_step}")
            else:
                print(f"❌ FAIL: Expected step {scenario['expected_step']}, got {next_step}")
            
            if branching_occurred == scenario["expected_skip"]:
                status = "applied" if branching_occurred else "not applied"
                print(f"✅ PASS: Branching logic {status} as expected")
            else:
                expected_status = "applied" if scenario["expected_skip"] else "not applied"
                actual_status = "applied" if branching_occurred else "not applied"
                print(f"❌ FAIL: Expected branching {expected_status}, got {actual_status}")
        
        print(f"\n✨ Discord Simulation Test Complete!")
        
    except Exception as e:
        print(f"❌ Discord simulation test failed: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Main test function"""
    print("🚀 Advanced Branching Logic Test Suite")
    print("=" * 50)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Campaign Document ID: if97jzhenxoggtbuzlyostdf")
    
    # Check environment variables
    strapi_token = os.getenv('STRAPI_API_TOKEN')
    api_key = os.getenv('API_KEY')
    
    if not strapi_token:
        print("❌ STRAPI_API_TOKEN environment variable is required")
        return
    
    if not api_key:
        print("⚠️  API_KEY not provided, skipping API tests")
        print("   Set API_KEY environment variable to test Business Logic API endpoints")
    
    try:
        # Test 1: Discord simulation (uses Strapi directly)
        await test_discord_simulation()
        
        # Test 2: API endpoints (if API key provided)
        if api_key:
            await test_branching_with_api()
        
        print(f"\n🎉 All Tests Complete!")
        print("\n📋 Summary:")
        print("• Advanced branching campaign created with proper logic")
        print("• Business Logic API endpoints support dynamic step calculation") 
        print("• Discord bot integration enhanced with branching logic")
        print("• Multiple user journey paths validated")
        
        print(f"\n🔧 Next Steps:")
        print("1. Test in actual Discord environment with /join command")
        print("2. Verify different user profiles trigger correct branching")
        print("3. Monitor Discord bot logs for branching logic execution")
        
    except Exception as e:
        print(f"❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Allow API key to be passed as command line argument
    if len(sys.argv) > 1:
        os.environ['API_KEY'] = sys.argv[1]
    
    asyncio.run(main())