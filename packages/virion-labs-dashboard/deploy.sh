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

# Load environment variables from .env.deploy file
if [ -f .env.deploy ]; then
    echo "Loading environment variables from .env.deploy:"
    # Load standard .env format (KEY=value) and echo each one
    while IFS= read -r line; do
        if [[ ! "$line" =~ ^# ]] && [[ "$line" =~ = ]] && [[ -n "$line" ]]; then
            echo "  Loading: $line"
            # Remove quotes from values before exporting
            line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/="\([^"]*\)"/=\1/')
            export "$line"
        fi
    done < .env.deploy
    echo "Successfully loaded environment variables from .env.deploy"
else
    echo "Warning: .env.deploy file not found, using default values"
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
  --set-env-vars="NODE_ENV=${NODE_ENV},NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED},NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL},NEXT_PUBLIC_API_KEY=${NEXT_PUBLIC_API_KEY},NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID},SUPABASE_ENV=${SUPABASE_ENV},DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN},DISCORD_GUILD_ID=${DISCORD_GUILD_ID},DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=${DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID},NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL},NEXTAUTH_URL=${NEXTAUTH_URL},NEXTAUTH_SECRET=${NEXTAUTH_SECRET},DEBUG_MODE=${DEBUG_MODE},VERBOSE_LOGGING=${VERBOSE_LOGGING},NEXT_PUBLIC_BUSINESS_LOGIC_API_URL=${NEXT_PUBLIC_BUSINESS_LOGIC_API_URL}" \
  --set-build-env-vars="NODE_ENV=${NODE_ENV},NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED},NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL},NEXT_PUBLIC_API_KEY=${NEXT_PUBLIC_API_KEY},NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID},SUPABASE_ENV=${SUPABASE_ENV},DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN},DISCORD_GUILD_ID=${DISCORD_GUILD_ID},DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=${DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID},NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL},NEXTAUTH_URL=${NEXTAUTH_URL},NEXTAUTH_SECRET=${NEXTAUTH_SECRET},DEBUG_MODE=${DEBUG_MODE},VERBOSE_LOGGING=${VERBOSE_LOGGING},NEXT_PUBLIC_BUSINESS_LOGIC_API_URL=${NEXT_PUBLIC_BUSINESS_LOGIC_API_URL}" \
  --execution-environment=gen2

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
echo ""
echo "To test the service:"
echo "gcloud run services proxy $SERVICE_NAME --port=3000 --region=$REGION"
echo ""
echo "Dashboard URL: <SERVICE_URL>/"