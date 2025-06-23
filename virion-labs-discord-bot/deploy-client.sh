#!/bin/bash

# Virion Labs Discord Bot - Client Deployment Script
# Usage: ./deploy-client.sh CLIENT_NAME BOT_TOKEN GUILD_ID CHANNEL_ID

CLIENT_NAME=$1
BOT_TOKEN=$2
GUILD_ID=$3
CHANNEL_ID=$4

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate input parameters
if [ -z "$CLIENT_NAME" ] || [ -z "$BOT_TOKEN" ] || [ -z "$GUILD_ID" ]; then
    print_error "Missing required parameters!"
    echo ""
    echo "Usage: $0 CLIENT_NAME BOT_TOKEN GUILD_ID [CHANNEL_ID]"
    echo ""
    echo "Parameters:"
    echo "  CLIENT_NAME  - Name of the client (e.g., 'AcmeCorp')"
    echo "  BOT_TOKEN    - Discord bot token"
    echo "  GUILD_ID     - Discord server (guild) ID"
    echo "  CHANNEL_ID   - Discord channel ID (optional)"
    echo ""
    echo "Example:"
    echo "  $0 AcmeCorp MTExNDM4... 123456789012345678 987654321098765432"
    exit 1
fi

# Set default channel ID if not provided
if [ -z "$CHANNEL_ID" ]; then
    print_warning "No channel ID provided, will use channel name 'join-campaigns'"
    CHANNEL_ID=""
fi

print_status "🚀 Starting deployment for client: $CLIENT_NAME"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    print_status "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    print_status "Please start Docker first"
    exit 1
fi

# Create client directory
CLIENT_DIR="clients/$CLIENT_NAME"
print_status "📁 Creating client directory: $CLIENT_DIR"

if [ -d "$CLIENT_DIR" ]; then
    print_warning "Client directory already exists"
    read -p "Do you want to overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    rm -rf "$CLIENT_DIR"
fi

mkdir -p "$CLIENT_DIR"
cd "$CLIENT_DIR"

# Copy source code and configuration files
print_status "📋 Copying source code and configuration files"
cp -r ../../src .
cp ../../package*.json .
cp ../../Dockerfile .

# Create environment file
print_status "⚙️ Creating environment configuration"
cat > .env << EOF
# Discord Configuration
DISCORD_BOT_TOKEN=$BOT_TOKEN
DISCORD_GUILD_ID=$GUILD_ID
EOF

if [ -n "$CHANNEL_ID" ]; then
    echo "DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=$CHANNEL_ID" >> .env
fi

cat >> .env << EOF

# API Configuration
DASHBOARD_API_URL=${DASHBOARD_API_URL:-https://dashboard.virionlabs.com/api}
WEBHOOK_PORT=3001

# Database Configuration
SUPABASE_URL=${SUPABASE_URL:-https://your-project.supabase.co}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-your_service_role_key}

# Client-specific settings
BOT_NAME=$CLIENT_NAME Bot
DEBUG=false
EOF

# Install dependencies
print_status "📦 Installing dependencies"
if ! npm install --silent; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Find available port
print_status "🔍 Finding available port"
PORT=3001
while netstat -tuln 2>/dev/null | grep -q ":$PORT "; do
    PORT=$((PORT + 1))
done
print_status "📡 Using port: $PORT"

# Build Docker image
print_status "🐳 Building Docker image"
IMAGE_NAME="virion-bot-$(echo $CLIENT_NAME | tr '[:upper:]' '[:lower:]')"

if ! docker build -t "$IMAGE_NAME" . --quiet; then
    print_error "Failed to build Docker image"
    exit 1
fi

# Stop existing container if it exists
CONTAINER_NAME="virion-bot-$CLIENT_NAME"
if docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    print_warning "Stopping existing container: $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME" &> /dev/null
    docker rm "$CONTAINER_NAME" &> /dev/null
fi

# Run Docker container
print_status "🚀 Starting Docker container"
if ! docker run -d \
    --name "$CONTAINER_NAME" \
    --env-file .env \
    --restart unless-stopped \
    -p "$PORT:3001" \
    "$IMAGE_NAME" &> /dev/null; then
    print_error "Failed to start Docker container"
    exit 1
fi

# Wait for container to start
print_status "⏳ Waiting for bot to initialize..."
sleep 5

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    print_error "Container failed to start"
    print_status "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi

# Test health endpoint
print_status "🏥 Testing health endpoint"
sleep 3
if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_warning "Health check failed, but container is running"
fi

# Print deployment summary
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  Client Name: $CLIENT_NAME"
echo "  Container: $CONTAINER_NAME"
echo "  Image: $IMAGE_NAME"
echo "  Port: $PORT"
echo "  Guild ID: $GUILD_ID"
if [ -n "$CHANNEL_ID" ]; then
    echo "  Channel ID: $CHANNEL_ID"
fi
echo ""
echo "🔧 Management Commands:"
echo "  View logs:    docker logs $CONTAINER_NAME"
echo "  Follow logs:  docker logs -f $CONTAINER_NAME"
echo "  Stop bot:     docker stop $CONTAINER_NAME"
echo "  Start bot:    docker start $CONTAINER_NAME"
echo "  Remove bot:   docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
echo ""
echo "🌐 Endpoints:"
echo "  Health check: http://localhost:$PORT/health"
echo "  Webhook:      http://localhost:$PORT/api/publish-campaigns"
echo ""
print_success "✅ Bot is now running and ready to serve $CLIENT_NAME!"
echo ""
print_status "📝 Next steps:"
echo "  1. Invite the bot to the Discord server with proper permissions"
echo "  2. Test with /campaigns command in the server"
echo "  3. Test with /start command for onboarding"
echo "  4. Configure campaigns in the Virion Labs dashboard"
echo "" 