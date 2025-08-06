#!/usr/bin/env python3
"""
Simple test to verify MCP server protocols are configured correctly.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from core.config import AppConfig
from server import VirionLabsMCPServer

async def test_configuration():
    """Test that both protocols can be configured properly."""
    print("MCP Server Configuration Test")
    print("=" * 40)
    
    # Test stdio configuration
    print("\n=== Testing stdio configuration ===")
    os.environ["TRANSPORT"] = "stdio"
    try:
        config = AppConfig.from_env()
        server = VirionLabsMCPServer(config)
        print(f"✓ stdio protocol configured")
        print(f"✓ FastMCP server initialized")
        print(f"✓ Low-level server initialized")
        await server.cleanup()
    except Exception as e:
        print(f"✗ stdio configuration failed: {e}")
        return False
    
    # Test streamable HTTP configuration
    print("\n=== Testing streamable HTTP configuration ===")
    os.environ["TRANSPORT"] = "streamable-http"
    os.environ["PORT"] = "8081"
    try:
        config = AppConfig.from_env()
        server = VirionLabsMCPServer(config)
        print(f"✓ streamable HTTP protocol configured")
        print(f"✓ FastMCP server initialized")
        print(f"✓ Low-level server initialized")
        await server.cleanup()
    except Exception as e:
        print(f"✗ streamable HTTP configuration failed: {e}")
        return False
    
    # Test backward compatibility HTTP configuration
    print("\n=== Testing backward compatibility HTTP configuration ===")
    os.environ["TRANSPORT"] = "http"
    try:
        config = AppConfig.from_env()
        server = VirionLabsMCPServer(config)
        print(f"✓ HTTP protocol configured")
        print(f"✓ FastMCP server initialized")
        await server.cleanup()
    except Exception as e:
        print(f"✗ HTTP configuration failed: {e}")
        return False
    
    print("\n" + "=" * 40)
    print("🎉 All protocol configurations working correctly!")
    print("\nNext steps:")
    print("1. For Claude Desktop, use: TRANSPORT=stdio")
    print("2. For web clients, use: TRANSPORT=streamable-http")
    print("3. For simple HTTP API, use: TRANSPORT=http")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_configuration())
    sys.exit(0 if success else 1)