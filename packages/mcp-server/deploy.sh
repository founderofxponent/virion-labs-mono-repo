#!/bin/bash

# Deploy MCP Server to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-virion-labs}
REGION=${2:-us-central1}
SERVICE_NAME="virion-labs-mcp-server"

echo "Deploying MCP Server to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep '=' | xargs)
    echo "Loaded environment variables from .env"
else
    echo "Warning: .env file not found, using default values"
fi

# Ensure we're using the correct project
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run from source
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=10 \
  --timeout=300 \
  --concurrency=1000 \
  --set-env-vars="TRANSPORT=${TRANSPORT},HOST=${HOST},MCP_PATH=${MCP_PATH},API_BASE_URL=${API_BASE_URL},INTERNAL_API_KEY=${INTERNAL_API_KEY},JWT_SECRET=${JWT_SECRET},SUPABASE_URL=${SUPABASE_URL},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},LOG_LEVEL=${LOG_LEVEL}" \
  --execution-environment=gen2

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
echo ""
echo "To test the service:"
echo "gcloud run services proxy $SERVICE_NAME --port=8080 --region=$REGION"