# Quick Deploy Reference

## 🚀 One-Command Deploy
```bash
gcloud builds submit --config cloudbuild.yaml
```

## 📋 Prerequisites Checklist
- [ ] Google Cloud Project with billing enabled
- [ ] APIs enabled: Cloud Run, Cloud Build, Container Registry, Secret Manager
- [ ] Environment variables stored in Secret Manager as `discord-bot-env`
- [ ] `gcloud` CLI authenticated

## 🔧 Essential Commands

### Enable APIs
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com
```

### Create/Update Secret
```bash
gcloud secrets create discord-bot-env --data-file=.env.production
gcloud secrets versions add discord-bot-env --data-file=.env.production
```

### Deploy
```bash
gcloud builds submit --config cloudbuild.yaml
```

### View Logs
```bash
gcloud run services logs tail virion-discord-bot --region=us-central1
```

### Check Status
```bash
gcloud run services describe virion-discord-bot --region=us-central1
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Container failed to start | Check WebhookServer binds to `0.0.0.0:8080` |
| Reserved PORT variable | Remove `PORT` from environment variables |
| Secret access denied | Add Secret Manager role to Cloud Build service account |
| Build failures | Remove `package-lock.json`, ensure `yarn.lock` is current |

## 📊 Service Info
- **URL**: `https://virion-discord-bot-{PROJECT_NUMBER}.us-central1.run.app`
- **Health Check**: `GET /health`
- **Region**: `us-central1`
- **Min Instances**: 1 (for persistent Discord connection)
- **Memory**: 512Mi
- **CPU**: 1

## 🔄 Update Workflow
1. Update code
2. Commit changes
3. Run: `gcloud builds submit --config cloudbuild.yaml`
4. Monitor deployment in Cloud Console

---
*For detailed documentation, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)* 