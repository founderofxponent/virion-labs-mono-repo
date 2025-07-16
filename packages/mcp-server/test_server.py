import os
from fastmcp import Client

# The URL of the deployed MCP server
# This will be proxied to localhost:8080 when testing remotely
SERVER_URL = os.environ.get("MCP_SERVER_URL", "http://127.0.0.1:8080/mcp")

def main():
    """
    A simple script to test the connection to the MCP server.
    """
    print(f"Connecting to MCP server at: {SERVER_URL}")

    try:
        # Initialize the MCP client
        client = Client(SERVER_URL)

        print("Successfully connected to the MCP server.")

        # --- Tool-specific tests will go here ---

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
