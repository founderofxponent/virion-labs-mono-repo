#!/bin/bash

# Deploy Dashboard to Google Cloud Run using Cloud Build
# Usage: ./deploy-cloudbuild.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-virion-labs}
REGION=${2:-us-central1}
SERVICE_NAME="virion-labs-dashboard"

echo "Deploying Dashboard to Cloud Run using Cloud Build..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Load environment variables from .env.deploy file
if [ -f .env.deploy ]; then
    echo "Loading environment variables from .env.deploy:"
    # Source the file to load variables
    set -a  # automatically export all variables
    source <(cat .env.deploy | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/="\([^"]*\)"/=\1/')
    set +a  # turn off automatic export
    echo "Successfully loaded environment variables from .env.deploy"
else
    echo "Warning: .env.deploy file not found"
    exit 1
fi

# Ensure we're using the correct project
gcloud config set project $PROJECT_ID

# Submit build to Cloud Build with substitutions
gcloud builds submit --config=cloudbuild.yaml \
    --substitutions=_REGION=$REGION,_SERVICE_NAME=$SERVICE_NAME,_API_KEY="$NEXT_PUBLIC_API_KEY",_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL",_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY",_SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY",_SUPABASE_PROJECT_ID="$SUPABASE_PROJECT_ID",_DISCORD_BOT_TOKEN="$DISCORD_BOT_TOKEN",_DISCORD_GUILD_ID="$DISCORD_GUILD_ID",_DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID="$DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID",_NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
echo ""
echo "To test the service:"
echo "gcloud run services proxy $SERVICE_NAME --port=3000 --region=$REGION"
echo ""
echo "Dashboard URL: <SERVICE_URL>/"