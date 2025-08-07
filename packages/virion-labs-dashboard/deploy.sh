#!/bin/bash

# Deploy Dashboard to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-virion-labs}
REGION=${2:-us-central1}
SERVICE_NAME="virion-labs-dashboard"

echo "Deploying Dashboard to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Load environment variables from .env file
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | grep '=' | xargs)
    echo "Loaded environment variables from .env.production"
else
    echo "Warning: .env.production file not found, using default values"
fi

# Ensure we're using the correct project
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run from source
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --cpu=2 \
  --memory=2Gi \
  --min-instances=1 \
  --max-instances=10 \
  --timeout=3600 \
  --concurrency=1000 \
  --env-vars-file=.env.deploy \
  --execution-environment=gen2

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
echo ""
echo "To test the service:"
echo "gcloud run services proxy $SERVICE_NAME --port=3000 --region=$REGION"
echo ""
echo "Dashboard URL: <SERVICE_URL>/"