# Discord Bot Deployment Guide - Google Cloud Run

This guide covers deploying the Virion Labs Discord Bot to Google Cloud Run using automated CI/CD with Google Cloud Build.

## Prerequisites

### 1. Google Cloud Setup
- Google Cloud Project with billing enabled
- Google Cloud CLI (`gcloud`) installed and authenticated
- Required APIs enabled:
  - Cloud Run API
  - Cloud Build API
  - Container Registry API
  - Secret Manager API

### 2. Local Development Setup
- Node.js 18+ installed
- Yarn package manager
- Docker (optional, for local testing)

## Quick Start

### 1. Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Set Up Environment Variables in Secret Manager
Create a secret containing your environment variables:

```bash
# Create the secret from your .env.production file
gcloud secrets create discord-bot-env --data-file=.env.production
```

**Important**: Your `.env.production` should contain all necessary environment variables EXCEPT `PORT` (which is reserved by Cloud Run):

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=your_channel_id_here
DISCORD_REQUEST_ACCESS_CHANNEL_ID=your_access_channel_id_here
DISCORD_VERIFIED_ROLE_ID=your_role_id_here

# API Configuration
DASHBOARD_API_URL=https://your-dashboard-url.com/api
WEBHOOK_PORT=8080

# Environment Settings
NODE_ENV=production
DEBUG=false

# Database Configuration (if using Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
```

### 3. Deploy Using Cloud Build
```bash
# Deploy using the automated Cloud Build configuration
gcloud builds submit --config cloudbuild.yaml
```

That's it! The deployment will:
1. Build the Docker image
2. Push it to Google Container Registry
3. Deploy to Cloud Run with proper environment variables
4. Provide you with a service URL

## Deployment Methods

### Method 1: Automated Cloud Build (Recommended)
Uses `cloudbuild.yaml` for complete CI/CD pipeline.

```bash
gcloud builds submit --config cloudbuild.yaml
```

### Method 2: Manual Docker Build and Deploy
For more control over the build process:

```bash
# 1. Build the Docker image
docker build -f Dockerfile.gcp -t gcr.io/YOUR_PROJECT_ID/virion-discord-bot:latest .

# 2. Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/virion-discord-bot:latest

# 3. Deploy to Cloud Run
gcloud run deploy virion-discord-bot \
  --image=gcr.io/YOUR_PROJECT_ID/virion-discord-bot:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=1 \
  --timeout=300 \
  --port=8080 \
  --set-env-vars="NODE_ENV=production" \
  --update-secrets="DISCORD_BOT_TOKEN=discord-bot-env:latest"
```

### Method 3: Using the NPM Script (Local Environment)
For development/testing purposes:

```bash
# Make sure you have .env.production file locally
yarn run deploy:gcloud
```

## Configuration

### Environment Variables
The bot requires these environment variables (stored in Google Secret Manager):

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_BOT_TOKEN` | Discord bot token | Yes |
| `DISCORD_CLIENT_ID` | Discord application client ID | Yes |
| `DISCORD_CLIENT_SECRET` | Discord application client secret | Yes |
| `DISCORD_GUILD_ID` | Primary Discord server ID | Yes |
| `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID` | Channel ID for campaign joins | Yes |
| `DISCORD_REQUEST_ACCESS_CHANNEL_ID` | Channel ID for access requests | Yes |
| `DISCORD_VERIFIED_ROLE_ID` | Role ID for verified users | Yes |
| `DASHBOARD_API_URL` | Dashboard API endpoint | Yes |
| `WEBHOOK_PORT` | Webhook server port (8080) | No |
| `NODE_ENV` | Environment (production) | No |
| `DEBUG` | Enable debug logging | No |

### Cloud Run Configuration
Current settings optimized for Discord bots:

- **Memory**: 512Mi
- **CPU**: 1
- **Max Instances**: 10
- **Min Instances**: 1 (for persistent Discord connection)
- **Timeout**: 300 seconds
- **Port**: 8080 (automatically set by Cloud Run)

## Monitoring and Logs

### View Logs
```bash
# View recent logs
gcloud run services logs read virion-discord-bot --region=us-central1

# Follow logs in real-time
gcloud run services logs tail virion-discord-bot --region=us-central1
```

### Check Service Status
```bash
gcloud run services describe virion-discord-bot --region=us-central1
```

### View Metrics
Visit the [Google Cloud Console](https://console.cloud.google.com/run) to view:
- Request metrics
- Error rates
- Resource utilization
- Revision history

## Troubleshooting

### Common Issues

#### 1. Container Failed to Start
**Error**: `The user-provided container failed to start and listen on the port defined by the PORT environment variable`

**Solution**: Ensure the WebhookServer binds to `0.0.0.0:8080` (not `localhost`)

#### 2. Reserved Environment Variables
**Error**: `The following reserved env names were provided: PORT`

**Solution**: Remove `PORT` from your environment variables (Cloud Run sets this automatically)

#### 3. Secret Access Issues
**Error**: `Failed to access secret`

**Solution**: Ensure the Cloud Build service account has `Secret Manager Secret Accessor` role:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 4. Build Failures
**Error**: Various build-related errors

**Solution**: 
- Ensure all dependencies are in `package.json`
- Remove `package-lock.json` if using Yarn
- Check Docker build logs for specific errors

### Health Check
The bot includes a health check endpoint:
```bash
curl https://your-service-url.run.app/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

## Security Best Practices

1. **Use Secret Manager**: Never hardcode sensitive values
2. **Limit IAM Permissions**: Use least-privilege principle
3. **Enable VPC**: Consider using VPC for network isolation
4. **Regular Updates**: Keep dependencies updated
5. **Monitor Logs**: Set up log-based alerts

## Updating the Deployment

### Update Environment Variables
```bash
# Update the secret with new values
gcloud secrets versions add discord-bot-env --data-file=.env.production
```

### Deploy New Version
```bash
# Trigger a new build and deployment
gcloud builds submit --config cloudbuild.yaml
```

### Rollback if Needed
```bash
# List revisions
gcloud run revisions list --service=virion-discord-bot --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic virion-discord-bot \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

## Cost Optimization

- **Min Instances**: Set to 1 to maintain Discord connection
- **Max Instances**: Adjust based on expected load
- **Memory**: 512Mi is usually sufficient for Discord bots
- **CPU**: 1 CPU handles most Discord bot workloads

## Support

For issues specific to this deployment:
1. Check the logs using `gcloud run services logs read`
2. Verify environment variables in Secret Manager
3. Ensure all required APIs are enabled
4. Check IAM permissions for Cloud Build service account

For Discord bot functionality issues, refer to the main project documentation. 