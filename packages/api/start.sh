#!/bin/bash

# Kill any existing server on port 8000
echo "Killing any existing server on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Navigate to API directory
cd "$(dirname "$0")"

# Use production environment
export $(grep -v '^#' .env | grep '=' | xargs)
echo "Using production environment (.env)"

# Start the API server
echo "Starting API server in production mode..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
