# 🚀 Multi-Client Deployment Guide

This guide explains how to deploy the Virion Labs Discord Bot for new client projects. The modular architecture makes it incredibly easy to spin up new bot instances for different clients.

## 🎯 Overview

With the new modular structure, deploying for a new client involves:
1. **5 minutes**: Environment setup
2. **2 minutes**: Discord bot creation
3. **1 minute**: Database configuration
4. **1 minute**: Deployment

**Total time: ~10 minutes per client**

## 📋 Prerequisites Checklist

- [ ] Node.js 16+ installed
- [ ] Docker (optional, for containerized deployment)
- [ ] Access to client's Discord server (admin permissions)
- [ ] Supabase project (can be shared or client-specific)
- [ ] Virion Labs Dashboard API access

## 🏗️ Deployment Options

### Option 1: Individual Server Deployment (Recommended)
Each client gets their own server/container with isolated bot instance.

### Option 2: Shared Infrastructure
Multiple clients use the same bot instance with different configurations.

### Option 3: Docker Swarm/Kubernetes
Enterprise-level deployment with orchestration.

## 🚀 Quick Deployment (Option 1)

### Step 1: Clone and Setup (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url> client-discord-bot-{CLIENT_NAME}
cd client-discord-bot-{CLIENT_NAME}

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

### Step 2: Discord Bot Creation (2 minutes)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application: `{CLIENT_NAME} Bot`
3. Bot section → Create Bot
4. **Enable required intents:**
   - ✅ Message Content Intent
   - ✅ Server Members Intent
5. Copy bot token
6. Generate invite URL with permissions:
   - ✅ Send Messages
   - ✅ Use Slash Commands  
   - ✅ Manage Roles
   - ✅ Read Message History
   - ✅ View Channels

### Step 3: Environment Configuration (3 minutes)

Edit `.env` file:

```bash
# Discord Configuration
DISCORD_BOT_TOKEN=YOUR_CLIENT_BOT_TOKEN_HERE
DISCORD_GUILD_ID=CLIENT_SERVER_ID_HERE
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=CLIENT_CHANNEL_ID_HERE

# API Configuration  
DASHBOARD_API_URL=https://your-dashboard.com/api
WEBHOOK_PORT=3001

# Database Configuration (can be shared)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Client-specific settings
BOT_NAME={CLIENT_NAME} Bot
DEBUG=false
```

### Step 4: Deploy (1 minute)

Choose your deployment method:

**Local/VPS Deployment:**
```bash
npm start
```

**PM2 (Production):**
```bash
npm run pm2:start
```

**Docker:**
```bash
npm run docker:build
npm run docker:run
```

## 🐳 Docker Deployment (Recommended for Production)

### Single Client Container

```bash
# Build client-specific image
docker build -t virion-bot-{CLIENT_NAME} .

# Run with environment file
docker run -d \
  --name virion-bot-{CLIENT_NAME} \
  --env-file .env \
  --restart unless-stopped \
  -p 3001:3001 \
  virion-bot-{CLIENT_NAME}
```

### Docker Compose (Multiple Clients)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  client1-bot:
    build: .
    container_name: virion-bot-client1
    env_file: ./client1/.env
    ports:
      - "3001:3001"
    restart: unless-stopped
    
  client2-bot:
    build: .
    container_name: virion-bot-client2
    env_file: ./client2/.env
    ports:
      - "3002:3001"
    restart: unless-stopped
    
  client3-bot:
    build: .
    container_name: virion-bot-client3
    env_file: ./client3/.env
    ports:
      - "3003:3001"
    restart: unless-stopped
```

Deploy all clients:
```bash
docker-compose up -d
```

## 🔧 Configuration Management

### Automated Setup Script

Create `deploy-client.sh`:

```bash
#!/bin/bash

CLIENT_NAME=$1
BOT_TOKEN=$2
GUILD_ID=$3
CHANNEL_ID=$4

if [ -z "$CLIENT_NAME" ]; then
    echo "Usage: ./deploy-client.sh CLIENT_NAME BOT_TOKEN GUILD_ID CHANNEL_ID"
    exit 1
fi

echo "🚀 Deploying bot for client: $CLIENT_NAME"

# Create client directory
mkdir -p "clients/$CLIENT_NAME"
cd "clients/$CLIENT_NAME"

# Copy source code
cp -r ../../src .
cp ../../package*.json .
cp ../../Dockerfile .

# Create environment file
cat > .env << EOF
DISCORD_BOT_TOKEN=$BOT_TOKEN
DISCORD_GUILD_ID=$GUILD_ID
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=$CHANNEL_ID
DASHBOARD_API_URL=https://dashboard.virionlabs.com/api
WEBHOOK_PORT=3001
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY
BOT_NAME=$CLIENT_NAME Bot
DEBUG=false
EOF

# Install dependencies
npm install

# Deploy with Docker
docker build -t "virion-bot-$CLIENT_NAME" .
docker run -d \
  --name "virion-bot-$CLIENT_NAME" \
  --env-file .env \
  --restart unless-stopped \
  -p "$(shuf -i 3001-3999 -n 1):3001" \
  "virion-bot-$CLIENT_NAME"

echo "✅ Bot deployed for $CLIENT_NAME"
echo "🔗 Check logs: docker logs virion-bot-$CLIENT_NAME"
```

Usage:
```bash
chmod +x deploy-client.sh
./deploy-client.sh "AcmeCorp" "BOT_TOKEN_HERE" "GUILD_ID" "CHANNEL_ID"
```

## 📊 Resource Requirements

### Per Bot Instance
- **RAM**: 128MB - 256MB
- **CPU**: 0.1 - 0.2 cores
- **Storage**: 50MB - 100MB
- **Network**: Minimal (Discord API calls only)

### Scaling Estimates
- **1 server**: 20-50 bot instances
- **Small VPS**: 5-10 bot instances
- **Medium VPS**: 10-20 bot instances
- **Large VPS**: 20-50 bot instances

## 🔍 Monitoring & Management

### Health Checks

Each bot instance provides:
- HTTP health endpoint: `http://localhost:3001/health`
- Process monitoring via PM2 or Docker
- Log aggregation support

### Centralized Monitoring

```bash
# Check all client bots
docker ps --filter "name=virion-bot-*"

# View logs for specific client
docker logs virion-bot-{CLIENT_NAME}

# Monitor resource usage
docker stats $(docker ps --filter "name=virion-bot-*" -q)
```

### Automated Monitoring Script

```bash
#!/bin/bash
# monitor-bots.sh

echo "🤖 Bot Instance Status Report"
echo "=============================="

for container in $(docker ps --filter "name=virion-bot-*" --format "{{.Names}}"); do
    echo "📊 $container:"
    
    # Health check
    if curl -s "http://localhost:$(docker port $container 3001/tcp | cut -d: -f2)/health" > /dev/null; then
        echo "  ✅ Health: OK"
    else
        echo "  ❌ Health: FAILED"
    fi
    
    # Resource usage
    docker stats --no-stream --format "  💾 Memory: {{.MemUsage}} | 🔄 CPU: {{.CPUPerc}}" $container
    echo ""
done
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Find available port
   netstat -tulpn | grep :3001
   # Use different port in .env: WEBHOOK_PORT=3002
   ```

2. **Discord Permissions**
   ```bash
   # Regenerate invite URL with correct permissions
   # Check bot role hierarchy in Discord server
   ```

3. **Database Connection**
   ```bash
   # Test Supabase connection
   curl -H "apikey: YOUR_KEY" "https://your-project.supabase.co/rest/v1/"
   ```

4. **Memory Issues**
   ```bash
   # Monitor memory usage
   docker stats --no-stream
   # Increase container memory limit if needed
   ```

### Log Analysis

```bash
# View real-time logs
docker logs -f virion-bot-{CLIENT_NAME}

# Search for errors
docker logs virion-bot-{CLIENT_NAME} 2>&1 | grep "ERROR\|❌"

# Export logs for analysis
docker logs virion-bot-{CLIENT_NAME} > client-bot-logs.txt
```

## 💰 Cost Optimization

### Shared Resources
- **Database**: One Supabase project for all clients
- **Dashboard API**: Shared API instance
- **Container Registry**: Shared Docker images

### Resource Optimization
- Use Alpine Linux base images (smaller size)
- Implement graceful shutdown for clean restarts
- Use health checks to prevent failed deployments
- Implement log rotation to manage disk space

## 🔐 Security Best Practices

### Per-Client Isolation
- Separate Discord bot tokens
- Isolated environment files
- Container-level isolation
- Network segmentation

### Secrets Management
```bash
# Use Docker secrets
docker secret create client1-bot-token bot_token.txt
docker service create --secret client1-bot-token virion-bot-client1

# Or use environment variable injection
docker run --env-file <(gpg -d secrets.env.gpg) virion-bot-client1
```

## 📈 Scaling Strategy

### Horizontal Scaling
1. **Load Balancer**: Route webhook requests
2. **Container Orchestration**: Kubernetes/Docker Swarm
3. **Auto-scaling**: Based on CPU/memory usage
4. **Geographic Distribution**: Deploy closer to client servers

### Vertical Scaling
1. **Resource Allocation**: Increase container limits
2. **Database Optimization**: Connection pooling
3. **Caching**: Redis for frequently accessed data

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Discord bot created and configured
- [ ] Environment variables set
- [ ] Database access confirmed
- [ ] Webhook endpoints accessible
- [ ] Bot invited to client server with correct permissions

### Post-Deployment
- [ ] Bot responds to `/campaigns` command
- [ ] Bot responds to `/start` command
- [ ] Onboarding flow works end-to-end
- [ ] Webhook endpoint accessible
- [ ] Health check endpoint responding
- [ ] Logs show no errors
- [ ] Resource usage within limits

### Client Handover
- [ ] Bot functionality demonstrated
- [ ] Admin access provided
- [ ] Documentation shared
- [ ] Support contact established

## 🎉 Success!

With this setup, you can deploy a new client bot in under 10 minutes! The modular architecture ensures:

- **Consistency**: Same reliable functionality for all clients
- **Isolation**: Each client has their own bot instance
- **Scalability**: Easy to add more clients
- **Maintainability**: Updates can be rolled out across all instances
- **Monitoring**: Centralized monitoring and management

---

**Need help?** Check the main [README.md](README.md) for detailed documentation. 