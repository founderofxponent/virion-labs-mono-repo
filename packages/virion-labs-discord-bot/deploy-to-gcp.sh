#!/bin/bash

# 🚀 Google Cloud Run Deployment Script
# Virion Labs Discord Bot

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="virion-discord-bot"
REGION="us-central1"
DOCKERFILE="Dockerfile.gcp"

echo -e "${BLUE}🚀 Deploying Virion Labs Discord Bot to Google Cloud Run${NC}"
echo "============================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI not found. Please install it first:${NC}"
    echo "curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}🔐 Please authenticate with Google Cloud:${NC}"
    gcloud auth login
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No project set. Please set your project:${NC}"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}📋 Project: $PROJECT_ID${NC}"
echo -e "${GREEN}🌍 Region: $REGION${NC}"
echo -e "${GREEN}🔧 Service: $SERVICE_NAME${NC}"
echo ""

# Check if required files exist
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}❌ $DOCKERFILE not found. Please ensure it exists.${NC}"
    exit 1
fi

if [ ! -f "cloudbuild.yaml" ]; then
    echo -e "${RED}❌ cloudbuild.yaml not found. Please ensure it exists.${NC}"
    exit 1
fi

if [ ! -f "src/index.gcp.js" ]; then
    echo -e "${RED}❌ src/index.gcp.js not found. Please ensure it exists.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required files found${NC}"

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com --quiet

# Function to deploy using Cloud Build
deploy_with_cloudbuild() {
    echo -e "${YELLOW}🏗️  Building and deploying with Cloud Build...${NC}"
    
    # Submit build
    BUILD_ID=$(gcloud builds submit --config cloudbuild.yaml . --format="value(metadata.build.id)")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build submitted successfully (ID: $BUILD_ID)${NC}"
        echo -e "${BLUE}📊 Monitor build progress:${NC}"
        echo "gcloud builds log $BUILD_ID --stream"
        
        # Wait for build to complete
        echo -e "${YELLOW}⏳ Waiting for build to complete...${NC}"
        gcloud builds wait $BUILD_ID --quiet
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}🎉 Deployment successful!${NC}"
            return 0
        else
            echo -e "${RED}❌ Build failed. Check logs:${NC}"
            echo "gcloud builds log $BUILD_ID"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to submit build${NC}"
        return 1
    fi
}

# Function to deploy manually
deploy_manually() {
    echo -e "${YELLOW}🐳 Building Docker image locally...${NC}"
    
    # Build image
    docker build -f $DOCKERFILE -t gcr.io/$PROJECT_ID/$SERVICE_NAME .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Docker build failed${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}📤 Pushing image to Container Registry...${NC}"
    docker push gcr.io/$PROJECT_ID/$SERVICE_NAME
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Docker push failed${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 10 \
        --min-instances 1 \
        --timeout 3600 \
        --port 8080 \
        --set-env-vars NODE_ENV=production,PORT=8080,WEBHOOK_PORT=8080
    
    return $?
}

# Check deployment method preference
echo -e "${BLUE}Choose deployment method:${NC}"
echo "1) Cloud Build (Recommended)"
echo "2) Manual Docker build"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        deploy_with_cloudbuild
        ;;
    2)
        deploy_manually
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Defaulting to Cloud Build...${NC}"
        deploy_with_cloudbuild
        ;;
esac

DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    echo -e "${BLUE}📋 Service Information:${NC}"
    echo "🌐 URL: $SERVICE_URL"
    echo "🏥 Health: $SERVICE_URL/health"
    echo "📊 Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
    echo ""
    
    echo -e "${YELLOW}🔍 Testing health endpoint...${NC}"
    if curl -f -s "$SERVICE_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed. Service may still be starting up.${NC}"
        echo "Wait a few minutes and try: curl $SERVICE_URL/health"
    fi
    
    echo ""
    echo -e "${BLUE}📊 Useful commands:${NC}"
    echo "# View logs:"
    echo "gcloud run services logs read $SERVICE_NAME --region=$REGION"
    echo ""
    echo "# Update service:"
    echo "gcloud run services update $SERVICE_NAME --region=$REGION"
    echo ""
    echo "# Delete service:"
    echo "gcloud run services delete $SERVICE_NAME --region=$REGION"
    
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Troubleshooting steps:${NC}"
    echo "1. Check build logs: gcloud builds list --limit=5"
    echo "2. Verify environment variables"
    echo "3. Check Docker image: gcloud container images list --repository=gcr.io/$PROJECT_ID"
    echo "4. Review deployment guide: KB/discord-bot/deployment/GOOGLE_CLOUD_RUN_DEPLOYMENT_GUIDE.md"
    exit 1
fi 