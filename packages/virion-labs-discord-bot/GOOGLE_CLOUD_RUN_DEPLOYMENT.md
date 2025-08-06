# 🚀 Google Cloud Run Deployment Guide
## Virion Labs Discord Bot

This guide provides complete instructions for deploying the Virion Labs Discord Bot on Google Cloud Run, including cost analysis, best practices, and troubleshooting.

## 📋 Table of Contents

- [Why Google Cloud Run?](#why-google-cloud-run)
- [Prerequisites](#prerequisites)
- [Quick Deploy (5 minutes)](#quick-deploy-5-minutes)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Cost Analysis](#cost-analysis)
- [Monitoring & Logging](#monitoring--logging)
- [Scaling & Performance](#scaling--performance)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## 🎯 Why Google Cloud Run?

### ✅ **Perfect for Discord Bots**
- **WebSocket Support**: Maintains persistent Discord connections
- **Auto-scaling**: Scales from 0 to handle Discord events
- **HTTP Endpoints**: Built-in webhook server for dashboard integration
- **Cost-effective**: Pay only for what you use
- **Global**: Deploy close to Discord's servers for low latency

### ✅ **Technical Benefits**
- **Serverless**: No infrastructure management
- **Container-based**: Use existing Docker expertise
- **HTTPS**: Built-in SSL termination
- **Health checks**: Automatic health monitoring
- **Rolling deployments**: Zero-downtime updates

### 📊 **Comparison with Other Platforms**

| Platform | Cost | Ease | Scaling | WebSocket | Verdict |
|----------|------|------|---------|-----------|---------|
| **Cloud Run** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Best Choice** |
| Compute Engine | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Good |
| GKE | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Overkill |
| Cloud Functions | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | Not Suitable |

## 📋 Prerequisites

### Required Accounts & Tools
- ✅ **Google Cloud Account** with billing enabled
- ✅ **Discord Bot** created and configured
- ✅ **Google Cloud CLI** installed
- ✅ **Docker** installed (for local testing)

### Required Permissions
```bash
# Required IAM roles for deployment
roles/run.admin
roles/cloudbuild.builds.editor
roles/storage.admin
roles/iam.serviceAccountUser
```

## ⚡ Quick Deploy (5 minutes)

### 1. Enable APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com
```

### 2. Set Project & Region
```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Set your preferred region (closest to your users)
gcloud config set run/region us-central1
```

### 3. Deploy from Source
```bash
# Clone the repository
git clone YOUR_REPO_URL
cd virion-labs-discord-bot

# Deploy directly from source
gcloud run deploy virion-discord-bot \
  --source . \
  --dockerfile Dockerfile.gcp \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 1 \
  --timeout 3600 \
  --port 8080 \
  --set-env-vars="DISCORD_BOT_TOKEN=YOUR_TOKEN,DISCORD_GUILD_ID=YOUR_GUILD_ID"
```

### 4. Verify Deployment
```bash
# Get service URL
gcloud run services describe virion-discord-bot \
  --format="value(status.url)"

# Test health endpoint
curl YOUR_SERVICE_URL/health
```

**🎉 Your Discord bot is now live on Cloud Run!**

## 🔧 Detailed Setup

### Step 1: Project Configuration

```bash
# Create a new project (optional)
gcloud projects create virion-discord-bot-prod --name="Virion Discord Bot Production"

# Set the project
gcloud config set project virion-discord-bot-prod

# Enable billing (required)
gcloud beta billing projects link virion-discord-bot-prod \
  --billing-account=YOUR_BILLING_ACCOUNT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```

### Step 2: Set Up Secrets Management

```bash
# Store Discord bot token securely
echo -n "YOUR_DISCORD_BOT_TOKEN" | gcloud secrets create discord-bot-token --data-file=-

# Store other sensitive data
echo -n "YOUR_DASHBOARD_API_KEY" | gcloud secrets create dashboard-api-key --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding discord-bot-token \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Build and Deploy with Cloud Build

```bash
# Submit build using Cloud Build configuration
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1
```

### Step 4: Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service virion-discord-bot \
  --domain bot.yourdomain.com
```

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot token | `MTAx...` |
| `DISCORD_GUILD_ID` | Primary Discord server ID | `123456789` |
| `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID` | Campaigns channel ID | `987654321` |
| `DASHBOARD_API_URL` | Dashboard API endpoint | `https://dashboard.com/api` |

### Cloud Run Specific Variables

| Variable | Description | Set By |
|----------|-------------|--------|
| `PORT` | HTTP server port | Cloud Run (auto) |
| `K_SERVICE` | Service name | Cloud Run (auto) |
| `K_REVISION` | Revision ID | Cloud Run (auto) |
| `K_CONFIGURATION` | Configuration name | Cloud Run (auto) |

### Setting Environment Variables

**Option 1: CLI Deployment**
```bash
gcloud run deploy virion-discord-bot \
  --set-env-vars="DISCORD_BOT_TOKEN=YOUR_TOKEN,DISCORD_GUILD_ID=YOUR_GUILD"
```

**Option 2: Using Secrets**
```bash
gcloud run deploy virion-discord-bot \
  --set-secrets="DISCORD_BOT_TOKEN=discord-bot-token:latest"
```

**Option 3: Cloud Build with Substitutions**
```yaml
# In cloudbuild.yaml
substitutions:
  _DISCORD_BOT_TOKEN: 'your-token'
  _DISCORD_GUILD_ID: 'your-guild-id'
```

## 💰 Cost Analysis

### Pricing Structure

**Cloud Run Pricing (as of 2024):**
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Requests**: $0.40 per million requests
- **Free Tier**: 2 million requests, 400,000 GiB-seconds, 200,000 vCPU-seconds per month

### Discord Bot Cost Estimate

**Typical Discord Bot (24/7 operation):**
```
Configuration:
- 512 MiB memory
- 1 vCPU
- ~100 Discord events/hour
- ~10 webhook requests/hour

Monthly Costs:
- vCPU: 0.5 vCPU × 720 hours × $0.0864 = ~$31.10
- Memory: 0.5 GiB × 720 hours × $0.0018 = ~$0.65
- Requests: 1,000 requests × $0.0000004 = ~$0.0004
- Total: ~$31.76/month
```

**Optimized Configuration (min instances = 0):**
```
Configuration:
- 256 MiB memory
- 0.5 vCPU
- Min instances = 0 (scale to zero)
- Only active during Discord events

Monthly Costs:
- vCPU: 0.25 vCPU × 100 hours × $0.0864 = ~$2.16
- Memory: 0.25 GiB × 100 hours × $0.0018 = ~$0.045
- Requests: 1,000 requests × $0.0000004 = ~$0.0004
- Total: ~$2.21/month
```

### Cost Optimization Tips

1. **Scale to Zero**: Set `min-instances=0` for development
2. **Right-size Resources**: Start with 256Mi memory, scale up if needed
3. **Use Secrets Manager**: More secure than environment variables
4. **Monitor Usage**: Use Cloud Monitoring to track costs
5. **Regional Deployment**: Choose closest region to reduce latency and costs

## 📊 Monitoring & Logging

### Built-in Monitoring

**Cloud Run provides automatic monitoring for:**
- ✅ Request latency
- ✅ Request count
- ✅ Error rate
- ✅ Container CPU utilization
- ✅ Container memory utilization
- ✅ Active instances

### Setting Up Alerts

```bash
# Create alerting policy for high error rate
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring-policy.yaml
```

**monitoring-policy.yaml:**
```yaml
displayName: "Discord Bot High Error Rate"
conditions:
  - displayName: "Error rate > 5%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.05
```

### Custom Metrics

**Add to your bot code:**
```javascript
const { Monitoring } = require('@google-cloud/monitoring');
const monitoring = new Monitoring.MetricServiceClient();

// Track Discord events
async function recordDiscordEvent(eventType) {
  // Custom metric implementation
}
```

### Log Analysis

```bash
# View real-time logs
gcloud run services logs tail virion-discord-bot

# Filter logs by severity
gcloud run services logs read virion-discord-bot \
  --filter="severity>=ERROR"

# Search logs for specific patterns
gcloud run services logs read virion-discord-bot \
  --filter="textPayload:\"Discord API error\""
```

## 🚀 Scaling & Performance

### Auto-scaling Configuration

**Recommended Settings:**
```bash
gcloud run deploy virion-discord-bot \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=1000 \
  --max-instances=10 \
  --min-instances=1 \
  --timeout=3600
```

### Performance Optimization

**1. Container Optimization**
- Use Alpine Linux base image (smaller size)
- Multi-stage builds to reduce image size
- Minimize dependencies

**2. Connection Management**
- Maintain persistent Discord WebSocket connections
- Implement connection pooling for database
- Use HTTP/2 for webhook requests

**3. Memory Management**
```javascript
// In your bot code
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('Memory warning:', warning);
  }
});
```

### Load Testing

```bash
# Install load testing tool
npm install -g artillery

# Test webhook endpoints
artillery quick --count 100 --num 5 https://YOUR_SERVICE_URL/health
```

## 🔒 Security Best Practices

### 1. Service Account Management

```bash
# Create custom service account
gcloud iam service-accounts create discord-bot \
  --description="Discord bot service account" \
  --display-name="Discord Bot"

# Grant minimal permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:discord-bot@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with custom service account
gcloud run deploy virion-discord-bot \
  --service-account=discord-bot@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. Network Security

```bash
# Restrict ingress to specific IP ranges (if needed)
gcloud run deploy virion-discord-bot \
  --ingress=internal-and-cloud-load-balancing

# Use VPC Connector for private resources
gcloud run deploy virion-discord-bot \
  --vpc-connector=projects/YOUR_PROJECT/locations/us-central1/connectors/discord-bot-connector
```

### 3. Secret Management

**Best Practices:**
- ✅ Use Secret Manager instead of environment variables
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/production
- ✅ Audit secret access

```bash
# Rotate Discord bot token
gcloud secrets versions add discord-bot-token --data-file=new-token.txt

# Update Cloud Run to use new version
gcloud run services update virion-discord-bot \
  --update-secrets=DISCORD_BOT_TOKEN=discord-bot-token:latest
```

## 🔧 Troubleshooting

### Common Issues

**1. Bot Not Responding to Commands**
```bash
# Check service status
gcloud run services describe virion-discord-bot

# Check logs for errors
gcloud run services logs read virion-discord-bot --limit=50

# Verify environment variables
gcloud run services describe virion-discord-bot \
  --format="value(spec.template.spec.template.spec.containers[0].env[].name)"
```

**2. WebSocket Connection Issues**
```bash
# Check Discord API connectivity
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
  https://discord.com/api/v10/gateway/bot

# Verify firewall rules allow outbound HTTPS
gcloud compute firewall-rules list --filter="name~discord"
```

**3. Health Check Failures**
```bash
# Test health endpoint locally
curl -f YOUR_SERVICE_URL/health

# Check health check configuration
gcloud run services describe virion-discord-bot \
  --format="value(spec.template.spec.template.spec.containers[0].livenessProbe)"
```

**4. Memory or CPU Limits**
```bash
# Check resource utilization
gcloud run services describe virion-discord-bot \
  --format="value(status.latestReadyRevisionName)"

# Increase resources if needed
gcloud run services update virion-discord-bot \
  --memory=1Gi --cpu=2
```

### Debug Mode

**Enable debug logging:**
```bash
gcloud run services update virion-discord-bot \
  --set-env-vars="DEBUG=true,NODE_ENV=development"
```

### Performance Debugging

**Check cold start times:**
```bash
# Monitor cold start metrics
gcloud logging read "resource.type=cloud_run_revision AND 
  jsonPayload.message=~\"Cold start\""
```

## 🔄 Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review error logs
- [ ] Check resource utilization
- [ ] Monitor costs
- [ ] Test health endpoints

**Monthly:**
- [ ] Update dependencies
- [ ] Rotate secrets
- [ ] Review security settings
- [ ] Performance analysis

**Quarterly:**
- [ ] Update base image
- [ ] Review and optimize costs
- [ ] Security audit
- [ ] Disaster recovery testing

### Automated Updates

**GitHub Actions Example:**
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      - run: gcloud builds submit --config cloudbuild.yaml
```

### Backup Strategy

**Export configuration:**
```bash
# Export Cloud Run service configuration
gcloud run services describe virion-discord-bot \
  --format="export" > service-backup.yaml

# Backup secrets
gcloud secrets versions access latest --secret="discord-bot-token" > token-backup.txt
```

### Disaster Recovery

**Recovery Steps:**
1. Restore from configuration backup
2. Restore secrets from backup
3. Redeploy using Cloud Build
4. Verify functionality

```bash
# Quick disaster recovery
gcloud run services replace service-backup.yaml
gcloud secrets create discord-bot-token --data-file=token-backup.txt
```

## 📚 Additional Resources

### Documentation
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Discord.js Guide](https://discordjs.guide/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Monitoring Tools
- [Cloud Monitoring](https://cloud.google.com/monitoring)
- [Cloud Trace](https://cloud.google.com/trace)
- [Error Reporting](https://cloud.google.com/error-reporting)

### Community
- [Google Cloud Discord](https://discord.gg/google-cloud)
- [Cloud Run Reddit](https://reddit.com/r/googlecloud)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-run)

---

## 🎉 Success!

Your Discord bot is now running on Google Cloud Run with:
- ✅ **Auto-scaling** from 0 to handle any load
- ✅ **Global availability** with sub-second latency
- ✅ **Cost optimization** with pay-per-use pricing
- ✅ **Security** with IAM and Secret Manager
- ✅ **Monitoring** with built-in observability
- ✅ **Zero-downtime deployments** with rolling updates

**Need help?** Check the troubleshooting section or reach out to the community!

---

*Last updated: 2024 | Virion Labs Discord Bot Cloud Run Deployment Guide* 