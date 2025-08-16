#!/bin/bash

# Railway Deployment Script for Virion Labs Mono-repo
# This script helps deploy all services to Railway

set -e

echo "🚄 Railway Deployment Script for Virion Labs"
echo "============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and authenticated"

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_path=$2
    
    echo ""
    echo "🚀 Deploying $service_name..."
    echo "   Path: $service_path"
    
    cd "$service_path"
    
    # Check if railway.json exists
    if [ ! -f "railway.json" ]; then
        echo "❌ railway.json not found in $service_path"
        return 1
    fi
    
    # Deploy the service
    railway up --detach
    
    echo "✅ $service_name deployment initiated"
    cd - > /dev/null
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "📁 Project root: $PROJECT_ROOT"

# Services to deploy (in dependency order)
declare -A services=(
    ["strapi-cms"]="packages/virion-labs-strapi-cms"
    ["business-api"]="packages/virion-labs-business-logic-api"
    ["discord-bot-mvp"]="packages/virion-labs-discord-bot-mvp"
    ["discord-bot-client"]="packages/virion-labs-discord-bot-client"
    ["dashboard"]="packages/virion-labs-dashboard"
    ["mcp-server"]="packages/mcp-server"
)

# Deploy services
echo ""
echo "🎯 Starting deployment of all services..."

for service in "${!services[@]}"; do
    service_path="$PROJECT_ROOT/${services[$service]}"
    
    if [ -d "$service_path" ]; then
        deploy_service "$service" "$service_path"
    else
        echo "⚠️  Service directory not found: $service_path"
    fi
done

echo ""
echo "🎉 All deployments initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Check Railway dashboard for deployment status"
echo "2. Configure environment variables for each service"
echo "3. Set up database connections"
echo "4. Test service endpoints"
echo ""
echo "💡 Tip: Use 'railway logs' to monitor deployment progress"