#!/bin/bash

# Kill any existing server on port 8000
echo "Killing any existing server on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Navigate to API directory
cd /Users/cruzr/projects/virion-labs-mono-repo/packages/api

# Start the API server
echo "Starting API server..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
