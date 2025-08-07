#!/bin/bash

# Deploy Discord Bot MVP to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-virion-labs}
REGION=${2:-us-central1}
SERVICE_NAME="virion-labs-discord-bot-mvp"

echo "Deploying Discord Bot MVP to Cloud Run..."
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
  --max-instances=3 \
  --timeout=3600 \
  --concurrency=1000 \
  --env-vars-file=.env.deploy \
  --execution-environment=gen2

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
echo ""
echo "To test the service:"
echo "gcloud run services proxy $SERVICE_NAME --port=8080 --region=$REGION"
echo ""
echo "Health check endpoint: <SERVICE_URL>/health"