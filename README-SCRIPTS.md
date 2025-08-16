# 🚀 Script Organization Guide

## Overview
All scripts have been reorganized for better development workflow and environment management.

## API Scripts (`packages/api/`)
- **`start_dev.sh`** - Start API server in development mode (uses `.env.development`)
- **`start.sh`** - Start API server in production mode (uses `.env`)
- **`deploy.sh`** - Deploy API to Google Cloud Run

## MCP Server Scripts (`packages/mcp-server/`)
- **`start_dev.sh`** - Start MCP server in development mode (uses `.env.development`)
- **`start.sh`** - Start MCP server in production mode (uses `.env`)
- **`deploy.sh`** - Deploy MCP server to Google Cloud Run
- **`test_deployment.sh`** - Test deployed MCP server on Cloud Run

## Discord Bot Scripts (`packages/virion-labs-discord-bot/`)
- **`deploy-to-gcp.sh`** - Deploy Discord bot to Google Cloud Run

## Usage for Local Development

### Start API Server (Development)
```bash
cd packages/api
./start_dev.sh
```

### Start MCP Server (Development)
```bash
cd packages/mcp-server
./start_dev.sh
```

### Test OAuth Flow Locally
1. Start both servers with dev scripts
2. Test API OAuth discovery: `curl http://localhost:8000/.well-known/oauth-authorization-server`
3. Test MCP OAuth discovery: `curl http://localhost:8080/.well-known/oauth-protected-resource`
4. Use MCP Inspector to connect to `http://localhost:8080` (or `http://127.0.0.1:8080`)

## Production Deployment
Use the respective `deploy.sh` scripts in each package directory.

## Railway Deployment (Alternative Platform)
New Railway deployment option available:
- **`RAILWAY_DEPLOYMENT_GUIDE.md`** - Complete Railway deployment guide
- **`RAILWAY_COST_OPTIMIZATION.md`** - Usage-based pricing optimization
- **`scripts/setup-railway-project.sh`** - Setup Railway project
- **`scripts/deploy-railway.sh`** - Deploy all services to Railway
- **`railway-env-vars.md`** - Environment variable templates

### Railway Quick Start:
```bash
# Setup Railway project
./scripts/setup-railway-project.sh

# Deploy all services
./scripts/deploy-railway.sh
```

## Environment Files
- **`.env.development`** - Local development (localhost URLs)
- **`.env`** - Production (Cloud Run URLs)
- **Railway Environment Variables** - Configured via Railway dashboard (see `railway-env-vars.md`)