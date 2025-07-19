#!/bin/bash

# Kill any existing server on port 8080
echo "Killing any existing server on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Navigate to MCP server directory
cd "$(dirname "$0")"

# Use production environment
export $(grep -v '^#' .env | grep '=' | xargs)
echo "Using production environment (.env)"

# Start the MCP server
echo "Starting MCP server in production mode..."
python3 server.py