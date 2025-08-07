#!/bin/bash

# Deploy Strapi CMS to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-virion-labs}
REGION=${2:-us-central1}
SERVICE_NAME="virion-labs-strapi-cms"

echo "Deploying Strapi CMS to Cloud Run..."
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
  --port=1337 \
  --cpu=2 \
  --memory=2Gi \
  --min-instances=1 \
  --max-instances=10 \
  --timeout=3600 \
  --concurrency=1000 \
  --set-env-vars="NODE_ENV=production,HOST=${HOST},PORT=1337,APP_KEYS=${APP_KEYS},API_TOKEN_SALT=${API_TOKEN_SALT},ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET},TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT},JWT_SECRET=${JWT_SECRET},ENCRYPTION_KEY=${ENCRYPTION_KEY},GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID},GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET},DATABASE_CLIENT=${DATABASE_CLIENT},DATABASE_HOST=${DATABASE_HOST},DATABASE_PORT=${DATABASE_PORT},DATABASE_NAME=${DATABASE_NAME},DATABASE_USERNAME=${DATABASE_USERNAME},DATABASE_PASSWORD=${DATABASE_PASSWORD},DATABASE_SSL=${DATABASE_SSL},DATABASE_SSL_REJECT_UNAUTHORIZED=${DATABASE_SSL_REJECT_UNAUTHORIZED},RESEND_API_KEY=${RESEND_API_KEY}" \
  --execution-environment=gen2

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
echo ""
echo "To test the service:"
echo "gcloud run services proxy $SERVICE_NAME --port=1337 --region=$REGION"
echo ""
echo "Admin panel will be available at: <SERVICE_URL>/admin"