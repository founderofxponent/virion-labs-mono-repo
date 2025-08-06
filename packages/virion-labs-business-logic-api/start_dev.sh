#!/bin/bash

# Kill any existing server on the API port (default 8000)
echo "Ensuring API port 8000 is free..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Navigate to the script's directory
cd "$(dirname "$0")"

# Activate the virtual environment
echo "Activating Python virtual environment..."
source venv/bin/activate

# Start the Unified API server
echo "Starting Virion Labs Unified Business Logic API..."
python3 main.py
