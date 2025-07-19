import requests
import webbrowser
import time

API_BASE_URL = "http://localhost:8000"
MCP_SERVER_URL = "http://localhost:8080"

def run_auth_test():
    """
    A manual test script to verify the end-to-end Google OAuth flow.
    """
    # 1. Start the authentication flow
    login_url = f"{API_BASE_URL}/api/auth/google/login"
    print("="*80)
    print("Step 1: Authenticate with Google")
    print("="*80)
    print(f"I will now open your web browser to the following URL to start the login process:")
    print(f"\n    {login_url}\n")
    print("If your browser does not open, please copy and paste the URL manually.")
    print("After you log in and approve the permissions, you will be redirected to a page")
    print("showing a JSON response. Please copy the value of the 'access_token'.")
    print("="*80)
    
    # Give the user a moment to read before opening the browser
    time.sleep(3)
    webbrowser.open(login_url)
    
    # 2. Get the access token from the user
    access_token = input("\nPlease paste the access_token here and press Enter:\n> ").strip()
    
    if not access_token:
        print("\nNo access token provided. Aborting test.")
        return
        
    print("\nToken received. Thank you.")
    print("="*80)
    print("Step 2: Testing the MCP Server")
    print("="*80)
    print("I will now use this token to make an authenticated request to the MCP server's")
    print("'list_functions' tool. This will verify that the token is valid and the")
    print("server is correctly protected by the unified API's authentication.")
    print("="*80)

    # 3. Make an authenticated request to the mcp-server
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    mcp_endpoint = f"{MCP_SERVER_URL}/mcp"
    
    payload = {
        "jsonrpc": "2.0",
        "method": "call_tool",
        "params": {
            "name": "list_functions",
            "arguments": {}
        },
        "id": "1"
    }

    try:
        print(f"Sending POST request to {mcp_endpoint}...")
        response = requests.post(mcp_endpoint, headers=headers, json=payload)
        
        print("\n--- MCP Server Response ---")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Response JSON:")
            print(response.json())
            print("\nSUCCESS: The MCP server responded correctly. The token is valid!")
            print("The authentication flow is working end-to-end.")
        else:
            print("Response Body:")
            print(response.text)
            print("\nERROR: The request failed. This could be due to several reasons:")
            print("- The API or MCP server is not running.")
            print("- The access token is invalid or expired.")
            print("- A CORS issue is preventing the request.")
    
    except requests.exceptions.ConnectionError as e:
        print(f"\nCONNECTION ERROR: Could not connect to the MCP server at {mcp_endpoint}.")
        print("Please ensure the MCP server is running on port 8080.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    run_auth_test() 