#!/bin/bash

# Deploy Business Logic API to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-virion-labs}
REGION=${2:-us-central1}
SERVICE_NAME="virion-labs-business-logic-api"

echo "Deploying Business Logic API to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Ensure we're using the correct project
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run from source
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8000 \
  --cpu=2 \
  --memory=1Gi \
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
echo "gcloud run services proxy $SERVICE_NAME --port=8000 --region=$REGION"
echo ""
echo "Health check endpoint: <SERVICE_URL>/health"