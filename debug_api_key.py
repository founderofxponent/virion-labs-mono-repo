#!/usr/bin/env python3
"""
Debug script to check API key authentication.
"""

import os
import sys

# Add the current directory to the path so we can import from the API
sys.path.append('/Users/cruzr/projects/virion-labs-mono-repo/packages/api')

from dotenv import load_dotenv
load_dotenv('/Users/cruzr/projects/virion-labs-mono-repo/packages/api/.env')

def debug_api_key():
    """Debug API key configuration."""
    print("API Key Debug Information")
    print("=" * 30)
    
    # Check environment variable loading
    internal_api_key = os.getenv("INTERNAL_API_KEY", "")
    print(f"INTERNAL_API_KEY from env: '{internal_api_key}'")
    print(f"Length: {len(internal_api_key)}")
    
    # Test API key we're sending
    test_api_key = "virion_internal_key_2024"
    print(f"Test API key: '{test_api_key}'")
    print(f"Length: {len(test_api_key)}")
    print(f"Match: {internal_api_key == test_api_key}")
    
    # Test API key service functions
    try:
        from services.api_key_service import validate_api_key, is_valid_api_key_request
        
        print(f"\nAPI Key validation: {validate_api_key(test_api_key)}")
        
        # Test with Bearer header
        auth_header = f"Bearer {test_api_key}"
        print(f"Auth header: '{auth_header}'")
        print(f"Is valid API key request: {is_valid_api_key_request(auth_header)}")
        
    except Exception as e:
        print(f"Error importing or testing API key service: {e}")

if __name__ == "__main__":
    debug_api_key()
