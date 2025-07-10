# 🚀 Google Cloud Run Deployment Guide
## Virion Labs Discord Bot

This comprehensive guide will walk you through deploying the Virion Labs Discord Bot to Google Cloud Run in production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (15 minutes)](#quick-start-15-minutes)
- [Detailed Setup](#detailed-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Methods](#deployment-methods)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## 🎯 Prerequisites

### 1. **Google Cloud Account & Project**
```bash
# Create a new Google Cloud project (if needed)
gcloud projects create your-project-id --name="Virion Discord Bot"

# Set your project as default
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com
```

### 2. **Install Google Cloud CLI**
```bash
# macOS
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login
gcloud auth configure-docker
```

### 3. **Verify Bot Files**
Ensure these files exist in your `virion-labs-discord-bot/` directory:
- ✅ `Dockerfile.gcp` - Cloud Run optimized container
- ✅ `cloudbuild.yaml` - CI/CD pipeline configuration
- ✅ `src/index.gcp.js` - Cloud Run entry point
- ✅ `.env.example` - Environment variables template

## 🚀 Quick Start (15 minutes)

### Step 1: Configure Environment Variables
```bash
cd virion-labs-discord-bot

# Copy environment template
cp .env.example .env.production

# Edit with your production values
nano .env.production
```

**Required Environment Variables:**
```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Dashboard Integration
DASHBOARD_API_URL=https://your-dashboard-domain.com/api

# Cloud Run Specific
NODE_ENV=production
PORT=8080
WEBHOOK_PORT=8080
```

### Step 2: Deploy Using Cloud Build
```bash
# Submit build to Cloud Build (automated deployment)
gcloud builds submit --config cloudbuild.yaml .

# Monitor deployment progress
gcloud builds list --limit=5
```

### Step 3: Verify Deployment
```bash
# Get service URL
gcloud run services describe virion-discord-bot \
  --region=us-central1 \
  --format="value(status.url)"

# Test health endpoint
curl https://YOUR_SERVICE_URL/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "uptime": "0:01:23",
  "discord": "connected",
  "environment": "production"
}
```

## 🔧 Detailed Setup

### Method 1: Automated Deployment (Recommended)

#### **Cloud Build Deployment**
```bash
# 1. Configure project
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# 2. Create Cloud Build trigger (optional - for Git integration)
gcloud alpha builds triggers create github \
  --repo-name=virion-labs-mono-repo \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=virion-labs-discord-bot/cloudbuild.yaml \
  --included-files=virion-labs-discord-bot/**

# 3. Manual deployment
cd virion-labs-discord-bot
gcloud builds submit --config cloudbuild.yaml .
```

#### **Monitor Build Progress**
```bash
# Watch build logs in real-time
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)") --stream

# Check deployment status
gcloud run services describe virion-discord-bot --region=us-central1
```

### Method 2: Manual Docker Deployment

```bash
# 1. Build Docker image locally
docker build -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/virion-discord-bot .

# 2. Push to Container Registry
docker push gcr.io/$PROJECT_ID/virion-discord-bot

# 3. Deploy to Cloud Run
gcloud run deploy virion-discord-bot \
  --image gcr.io/$PROJECT_ID/virion-discord-bot \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 1 \
  --timeout 3600 \
  --port 8080 \
  --set-env-vars NODE_ENV=production,PORT=8080,WEBHOOK_PORT=8080
```

## 🔐 Environment Configuration

### **Setting Environment Variables in Cloud Run**

#### **Method 1: Using gcloud CLI**
```bash
# Set individual environment variables
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --set-env-vars="DISCORD_BOT_TOKEN=your_token_here"

# Set multiple variables at once
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --set-env-vars="NODE_ENV=production,PORT=8080,WEBHOOK_PORT=8080"
```

#### **Method 2: Using Secret Manager (Recommended for sensitive data)**
```bash
# Create secrets for sensitive data
echo -n "your_discord_bot_token" | gcloud secrets create discord-bot-token --data-file=-
echo -n "your_supabase_service_key" | gcloud secrets create supabase-service-key --data-file=-

# Deploy with secret references
gcloud run deploy virion-discord-bot \
  --image gcr.io/$PROJECT_ID/virion-discord-bot \
  --region us-central1 \
  --set-secrets="DISCORD_BOT_TOKEN=discord-bot-token:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-key:latest"
```

#### **Method 3: Using Environment File**
```bash
# Create env file for bulk upload
cat > env.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: virion-discord-bot
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
    spec:
      containers:
      - image: gcr.io/$PROJECT_ID/virion-discord-bot
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        - name: DISCORD_BOT_TOKEN
          value: "your_token_here"
        - name: SUPABASE_URL
          value: "your_supabase_url"
EOF

# Apply configuration
gcloud run services replace env.yaml --region=us-central1
```

## 📊 Monitoring & Maintenance

### **Real-time Monitoring**
```bash
# View live logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=virion-discord-bot" \
  --project=$PROJECT_ID

# Monitor specific log levels
gcloud logging tail "resource.type=cloud_run_revision AND jsonPayload.level=ERROR" \
  --project=$PROJECT_ID

# Check service metrics
gcloud run services describe virion-discord-bot \
  --region=us-central1 \
  --format="table(status.traffic[].percent,status.traffic[].revisionName)"
```

### **Health Monitoring Setup**
```bash
# Create uptime check
gcloud alpha monitoring uptime check-configs create \
  --display-name="Discord Bot Health Check" \
  --http-check-path="/health" \
  --http-check-port=443 \
  --monitored-resource-type="uptime_url" \
  --monitored-resource-labels="host=YOUR_SERVICE_URL"
```

### **Performance Optimization**
```bash
# Update resource allocation based on monitoring
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=2 \
  --max-instances=20

# Enable CPU throttling for cost optimization
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --cpu-throttling
```

## 💰 Cost Optimization

### **Estimated Monthly Costs**
| Resource | Usage | Cost (USD) |
|----------|-------|------------|
| Cloud Run (1 instance, 512Mi RAM) | 24/7 | ~$8-12 |
| Container Registry | Storage + transfers | ~$1-3 |
| Cloud Build | 30 builds/month | ~$0-2 |
| **Total Estimated** | | **~$9-17/month** |

### **Cost Optimization Tips**
```bash
# 1. Enable CPU allocation only during request processing
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --cpu-throttling

# 2. Set appropriate resource limits
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --memory=512Mi \
  --cpu=1

# 3. Configure automatic scaling
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --min-instances=1 \
  --max-instances=10

# 4. Monitor and optimize
gcloud monitoring dashboards list
```

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. Discord Connection Issues**
```bash
# Check Discord bot status in logs
gcloud logging read "resource.type=cloud_run_revision AND textPayload:discord" \
  --limit=50 \
  --project=$PROJECT_ID

# Verify environment variables
gcloud run services describe virion-discord-bot \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

#### **2. Container Startup Issues**
```bash
# Check container logs
gcloud run services logs read virion-discord-bot \
  --region=us-central1 \
  --limit=100

# Verify health endpoint
curl -f https://YOUR_SERVICE_URL/health || echo "Health check failed"
```

#### **3. Memory/CPU Issues**
```bash
# Monitor resource usage
gcloud logging read "resource.type=cloud_run_revision AND textPayload:memory" \
  --project=$PROJECT_ID

# Increase resources if needed
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=2
```

#### **4. Deployment Failures**
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# Verify Docker image
gcloud container images list --repository=gcr.io/$PROJECT_ID

# Force new deployment
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --image=gcr.io/$PROJECT_ID/virion-discord-bot:latest
```

## 🔒 Security Best Practices

### **1. Use Secret Manager**
```bash
# Store sensitive environment variables in Secret Manager
gcloud secrets create discord-bot-token --data-file=-
gcloud secrets create supabase-service-key --data-file=-

# Grant Cloud Run access to secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### **2. Configure IAM Properly**
```bash
# Create dedicated service account
gcloud iam service-accounts create discord-bot-service \
  --display-name="Discord Bot Service Account"

# Assign minimal required permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:discord-bot-service@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

# Use service account for Cloud Run
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --service-account=discord-bot-service@$PROJECT_ID.iam.gserviceaccount.com
```

### **3. Enable Security Features**
```bash
# Enable Cloud Run security features
gcloud run services update virion-discord-bot \
  --region=us-central1 \
  --no-allow-unauthenticated \
  --execution-environment=gen2

# Configure VPC connector (if needed)
gcloud compute networks vpc-access connectors create discord-bot-connector \
  --region=us-central1 \
  --subnet=default \
  --subnet-project=$PROJECT_ID \
  --min-instances=2 \
  --max-instances=10
```

## 🔄 Maintenance & Updates

### **Regular Maintenance Tasks**

#### **Weekly:**
```bash
# Check service health
curl https://YOUR_SERVICE_URL/health

# Review logs for errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=50 \
  --project=$PROJECT_ID
```

#### **Monthly:**
```bash
# Update dependencies
cd virion-labs-discord-bot
npm audit && npm update

# Rebuild and redeploy
gcloud builds submit --config cloudbuild.yaml .

# Review costs
gcloud billing accounts list
gcloud billing budgets list --billing-account=BILLING_ACCOUNT_ID
```

#### **Quarterly:**
```bash
# Review and optimize resource allocation
gcloud run services describe virion-discord-bot \
  --region=us-central1 \
  --format="table(status.traffic[].percent,status.traffic[].revisionName)"

# Security review
gcloud secrets list
gcloud iam service-accounts list
```

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring alerts** for service health
2. **Configure backup and disaster recovery** procedures
3. **Implement CI/CD pipeline** with GitHub Actions
4. **Set up staging environment** for testing
5. **Document runbooks** for incident response

## 📞 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review Cloud Run documentation: https://cloud.google.com/run/docs
3. Check Discord.js documentation: https://discord.js.org/
4. Review project logs and monitoring data

---

**✅ Your Discord bot is now successfully deployed to Google Cloud Run!**

The bot will automatically scale based on demand, maintain persistent Discord connections, and provide high availability for your users. 