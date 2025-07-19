#!/bin/bash

# Kill any existing server on port 8080
echo "Killing any existing server on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Navigate to MCP server directory
cd "$(dirname "$0")"

# Use development environment
export $(grep -v '^#' .env.development | grep '=' | xargs)
echo "Using development environment (.env.development)"

# Start the MCP server
echo "Starting MCP server in development mode..."
python3 server.py