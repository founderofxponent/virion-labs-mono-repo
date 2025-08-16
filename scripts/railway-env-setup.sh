#!/bin/bash

# Railway Environment Variables Setup Script
# Sets up environment variables for all services in Railway deployment

set -e

echo "🚄 Railway Environment Variables Setup"
echo "======================================"

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

echo "✅ Railway CLI is available"

# Function to set environment variables for a service
setup_service_env() {
    local service_name=$1
    local variables=("${@:2}")
    
    echo ""
    echo "🔧 Setting up environment variables for $service_name..."
    
    # Note: This is a template - you'll need to replace these with actual values
    for var in "${variables[@]}"; do
        echo "   📝 Variable needed: $var"
    done
    
    echo "   💡 Use Railway dashboard to set these variables manually"
}

echo ""
echo "📋 Environment Variables Setup Guide"
echo ""

# Business Logic API
echo "🔹 virion-labs-business-logic-api"
echo "   Required variables to set in Railway dashboard:"
setup_service_env "business-logic-api" \
    "PYTHONPATH=/app" \
    "ENVIRONMENT=production" \
    "STRAPI_URL=https://virion-labs-strapi-cms.railway.app" \
    "STRAPI_API_TOKEN=[Your Strapi API Token]" \
    "SUPABASE_URL=[Your Supabase URL]" \
    "SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key]" \
    "JWT_SECRET=[Generate JWT Secret]" \
    "API_KEY=[Generate API Key]" \
    "FRONTEND_URL=https://virion-labs-dashboard.railway.app" \
    "REFERRAL_BASE_URL=https://[your-domain]/r" \
    "DISCORD_BOT_TOKEN=[Your Discord Bot Token]" \
    "DISCORD_CLIENT_BOT_CLIENT_ID=[Your Discord Client Bot ID]" \
    "ADMIN_EMAIL=[Admin Email]" \
    "API_TITLE=Virion Labs Business Logic API" \
    "API_VERSION=1.0.0" \
    "JWT_ALGORITHM=HS256" \
    "PASSWORD_RESET_EXPIRE_MINUTES=30"

# Dashboard
echo "🔹 virion-labs-dashboard"
echo "   Required variables to set in Railway dashboard:"
setup_service_env "dashboard" \
    "NODE_ENV=production" \
    "NEXT_PUBLIC_SUPABASE_URL=[Your Supabase URL]" \
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase Anon Key]" \
    "SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key]" \
    "SUPABASE_PROJECT_ID=[Your Supabase Project ID]" \
    "SUPABASE_ENV=production" \
    "NEXT_PUBLIC_BUSINESS_LOGIC_API_URL=https://virion-labs-business-logic-api.railway.app" \
    "NEXT_PUBLIC_API_URL=https://virion-labs-business-logic-api.railway.app" \
    "NEXT_PUBLIC_API_KEY=[Your API Key - same as business logic]" \
    "NEXT_PUBLIC_APP_URL=https://virion-labs-dashboard.railway.app" \
    "NEXTAUTH_SECRET=[Generate NextAuth Secret]" \
    "NEXTAUTH_URL=https://virion-labs-dashboard.railway.app" \
    "NEXT_TELEMETRY_DISABLED=1" \
    "DISCORD_BOT_TOKEN=[Your Discord Bot Token]" \
    "DISCORD_GUILD_ID=[Your Discord Server ID]" \
    "DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=[Your Discord Channel ID]" \
    "DEBUG_MODE=false" \
    "VERBOSE_LOGGING=false"

# Strapi CMS
echo "🔹 virion-labs-strapi-cms"
echo "   Required variables to set in Railway dashboard:"
setup_service_env "strapi-cms" \
    "NODE_ENV=production" \
    "HOST=0.0.0.0" \
    "PORT=1337" \
    "DATABASE_CLIENT=postgres" \
    "DATABASE_HOST=[Your Supabase Database Host]" \
    "DATABASE_PORT=5432" \
    "DATABASE_NAME=postgres" \
    "DATABASE_USERNAME=[Your Supabase Database Username]" \
    "DATABASE_PASSWORD=[Your Supabase Database Password]" \
    "DATABASE_SSL=true" \
    "DATABASE_SSL_REJECT_UNAUTHORIZED=false" \
    "APP_KEYS=[Generate 4 random base64 keys]" \
    "API_TOKEN_SALT=[Generate random base64 salt]" \
    "ADMIN_JWT_SECRET=[Generate random JWT secret]" \
    "TRANSFER_TOKEN_SALT=[Generate random base64 salt]" \
    "JWT_SECRET=[Generate random JWT secret]" \
    "ENCRYPTION_KEY=[Generate random base64 key]"

# Discord Bots
echo "🔹 virion-labs-discord-bot-mvp"
echo "   Required variables to set in Railway dashboard:"
setup_service_env "discord-bot-mvp" \
    "DISCORD_BOT_TOKEN=[Your Discord Bot MVP Token]" \
    "DISCORD_GUILD_ID=[Your Discord Server ID]" \
    "BUSINESS_LOGIC_API_URL=https://virion-labs-business-logic-api.railway.app/api/v1" \
    "API_KEY=[Your API Key - same as business logic]" \
    "ADMIN_EMAILS=[Optional: Admin email addresses comma-separated]"

echo "🔹 virion-labs-discord-bot-client"
echo "   Required variables to set in Railway dashboard:"
setup_service_env "discord-bot-client" \
    "DISCORD_CLIENT_BOT_TOKEN=[Your Discord Bot Client Token]" \
    "BUSINESS_LOGIC_API_URL=https://virion-labs-business-logic-api.railway.app" \
    "BUSINESS_LOGIC_API_KEY=[Your API Key - same as business logic]"

# MCP Server
echo "🔹 virion-labs-mcp-server"
echo "   Required variables to set in Railway dashboard:"
setup_service_env "mcp-server" \
    "SUPABASE_URL=[Your Supabase URL]" \
    "SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key]" \
    "PORT=[Railway will set this automatically, but can override if needed]"

echo ""
echo "🎯 Next Steps:"
echo "1. Go to Railway dashboard → Your Project"
echo "2. Select each service"
echo "3. Go to Variables tab"
echo "4. Add the variables listed above"
echo "5. Replace [placeholder] values with actual values"
echo ""
echo "📄 Reference files:"
echo "   - railway-env-vars.md"
echo "   - packages/*/RAILWAY_ENV_SETUP.md"
echo "   - packages/*/.env.example"
echo ""
echo "💡 Tip: Set all variables before deploying to avoid multiple restarts"