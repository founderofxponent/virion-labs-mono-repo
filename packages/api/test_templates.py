#!/usr/bin/env python3
"""
Simple test script to verify the campaign template endpoints are working.
"""
import requests
import json
from uuid import uuid4

# Test configuration
BASE_URL = "http://localhost:8000"
API_KEY = "test-api-key"  # Replace with actual API key

def test_get_campaign_templates():
    """Test the GET /api/campaign-templates endpoint"""
    url = f"{BASE_URL}/api/campaign-templates"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"GET /api/campaign-templates")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing campaign templates: {e}")
        return False

def test_get_campaign_templates_with_landing_page():
    """Test the GET /api/campaign-templates with landing page data"""
    url = f"{BASE_URL}/api/campaign-templates?include_landing_page=true"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"GET /api/campaign-templates?include_landing_page=true")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing campaign templates with landing page: {e}")
        return False

def test_create_campaign_template():
    """Test the POST /api/campaign-templates endpoint"""
    url = f"{BASE_URL}/api/campaign-templates"
    
    payload = {
        "campaign_type": "test_template",
        "name": "Test Template",
        "description": "A test template for API testing",
        "category": "custom",
        "template_config": {
            "bot_config": {
                "bot_name": "Test Bot",
                "bot_personality": "friendly",
                "welcome_message": "Welcome to our test campaign!"
            },
            "onboarding_fields": [
                {
                    "id": "full_name",
                    "type": "text",
                    "question": "What's your full name?",
                    "required": True,
                    "validation": {
                        "max_length": 100
                    }
                },
                {
                    "id": "email",
                    "type": "email",
                    "question": "What's your email address?",
                    "required": True
                }
            ],
            "analytics_config": {
                "tracking_enabled": True,
                "primary_metrics": ["onboarding_completions", "referral_conversions"]
            }
        },
        "is_default": False
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"POST /api/campaign-templates")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing create campaign template: {e}")
        return False

def test_get_landing_page_templates():
    """Test the GET /api/landing-page-templates endpoint"""
    url = f"{BASE_URL}/api/landing-page-templates"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"GET /api/landing-page-templates")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing landing page templates: {e}")
        return False

def test_apply_template_to_campaign():
    """Test the POST /api/campaign-onboarding-fields/apply-template endpoint"""
    url = f"{BASE_URL}/api/campaign-onboarding-fields/apply-template"
    
    payload = {
        "campaign_id": str(uuid4()),  # Use a random UUID for testing
        "template_id": str(uuid4()),  # Use a random UUID for testing
        "custom_config": {
            "welcome_message": "Custom welcome message for this campaign"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"POST /api/campaign-onboarding-fields/apply-template")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        # This might return 404 if template doesn't exist, which is expected
        return response.status_code in [200, 404]
    except Exception as e:
        print(f"Error testing apply template: {e}")
        return False

def test_get_default_templates():
    """Test the GET /api/templates/default endpoint"""
    url = f"{BASE_URL}/api/templates/default"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"GET /api/templates/default")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("---")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing default templates: {e}")
        return False

if __name__ == "__main__":
    print("Testing Campaign Template Endpoints")
    print("=" * 40)
    
    # Note: These tests require the API server to be running
    # and proper authentication setup
    print("NOTE: Make sure the API server is running on localhost:8000")
    print("NOTE: Update the API_KEY variable with a valid API key")
    print("NOTE: Some tests may fail if database is empty, which is expected")
    print()
    
    results = []
    results.append(test_get_campaign_templates())
    results.append(test_get_campaign_templates_with_landing_page())
    results.append(test_create_campaign_template())
    results.append(test_get_landing_page_templates())
    results.append(test_apply_template_to_campaign())
    results.append(test_get_default_templates())
    
    print("=" * 40)
    print(f"Tests passed: {sum(results)}/{len(results)}")
    
    print("\nEndpoints Available:")
    print("GET /api/campaign-templates - List all campaign templates")
    print("GET /api/campaign-templates?include_landing_page=true - List with landing page data")
    print("POST /api/campaign-templates - Create new campaign template")
    print("GET /api/campaign-templates/{id} - Get specific template")
    print("PATCH /api/campaign-templates/{id} - Update template")
    print("DELETE /api/campaign-templates/{id} - Delete template")
    print("GET /api/landing-page-templates - List landing page templates")
    print("POST /api/campaign-onboarding-fields/apply-template - Apply template to campaign")
    print("GET /api/campaign-templates/by-category/{category} - Filter by category")
    print("GET /api/campaign-templates/by-type/{campaign_type} - Get by campaign type")
    print("GET /api/templates/default - Get all default templates")