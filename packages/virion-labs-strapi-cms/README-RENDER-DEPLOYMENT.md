# Render Deployment Guide for Virion Labs Strapi CMS

This guide explains how to deploy the Strapi CMS to Render using their Infrastructure as Code approach.

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Database**: External database (using Supabase PostgreSQL)

## Deployment Methods

### Method 1: Web Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select: `founderofxponent/virion-labs-mono-repo`

3. **Configure Service**
   - **Name**: `virion-labs-strapi-cms`
   - **Runtime**: Node
   - **Build Command**: `cd packages/virion-labs-strapi-cms && npm install && npm run build`
   - **Start Command**: `cd packages/virion-labs-strapi-cms && npm start`
   - **Plan**: Free (750 hours/month)

4. **Environment Variables**
   Copy from the `render.yaml` file or set manually:
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=1337
   DATABASE_CLIENT=postgres
   DATABASE_HOST=aws-0-ap-southeast-1.pooler.supabase.com
   DATABASE_PORT=6543
   DATABASE_NAME=postgres
   DATABASE_USERNAME=postgres.xexghaegbbmwwjsiyycq
   DATABASE_PASSWORD=iamgratefulandabundant.Supabase.2025
   DATABASE_SSL=false
   # ... (add all other env vars from render.yaml)
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

### Method 2: render.yaml (Infrastructure as Code)

1. **Commit render.yaml**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Deploy via Render Dashboard**
   - Go to Render dashboard
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Select branch with render.yaml
   - Click "Apply"

## Configuration Details

### Service Configuration
- **Runtime**: Node.js
- **Plan**: Free (750 hours/month)
- **Region**: Oregon
- **Auto-deploy**: Enabled on git push
- **Health Check**: `/` endpoint

### Build Process
```bash
# Install dependencies
npm install

# Build Strapi
npm run build
```

### Start Command
```bash
npm start
```

## Free Tier Limits

Render Free Plan includes:
- **750 hours/month** of runtime
- **500MB RAM**
- **0.1 CPU**
- **Auto-sleep** after 15 minutes of inactivity
- **Cold starts** when waking up

## Post-Deployment

### 1. Get Service URL
After deployment, you'll get a URL like:
```
https://virion-labs-strapi-cms.onrender.com
```

### 2. Access Admin Panel
```
https://virion-labs-strapi-cms.onrender.com/admin
```

### 3. Update Environment Variables (if needed)
- Go to Render dashboard
- Select your service
- Navigate to "Environment"
- Add/update variables
- Click "Save Changes" (triggers redeploy)

## Custom Domain (Optional)

To use a custom domain:

1. **Add Custom Domain**
   - Go to service settings
   - Add custom domain: `cms.virionlabs.io`

2. **Update DNS**
   - Add CNAME record pointing to Render's domain

3. **Update Environment Variables**
   ```
   PUBLIC_URL=https://cms.virionlabs.io
   ```

## Monitoring and Logs

### View Logs
- Go to Render dashboard
- Select your service
- Click "Logs" tab

### Monitor Performance
- Check "Metrics" tab for:
  - CPU usage
  - Memory usage
  - Response times
  - Request volume

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build logs in Render dashboard
   - Verify Node.js version compatibility
   - Ensure all dependencies are in package.json

2. **Database Connection Issues**
   - Verify Supabase connection details
   - Check DATABASE_HOST and DATABASE_PASSWORD

3. **Service Won't Start**
   - Check start command is correct: `npm start`
   - Verify PORT environment variable: `1337`
   - Check application logs

4. **Cold Starts (Free Plan)**
   - Service sleeps after 15 minutes of inactivity
   - First request after sleep will be slow (30-60 seconds)
   - Consider upgrading to paid plan for always-on service

### Useful Commands

```bash
# Check service status (if CLI installed)
render services list

# View logs
render logs --service-id <service-id>

# Trigger manual deploy
render deploy --service-id <service-id>
```

## Render vs Other Platforms

| Feature | Render Free | Railway Free | AWS App Runner |
|---------|-------------|--------------|----------------|
| Runtime Hours | 750/month | Unlimited* | Pay per use |
| RAM | 500MB | 512MB | 2GB+ |
| Auto-sleep | Yes | No | No |
| Cold starts | Yes | No | No |
| Custom domains | Yes | Yes | Yes |
| Cost after free | $7/month | $5/month | ~$15-30/month |

*Railway: $5 usage credit/month

## Upgrade Considerations

**Upgrade to Render Starter ($7/month) if you need:**
- Always-on service (no sleep/cold starts)
- More RAM (up to 2GB)
- Priority support
- Better performance

## Security Notes

1. **Environment Variables**: Never commit sensitive data to git
2. **HTTPS**: Automatically provided by Render
3. **Database SSL**: Configured for Supabase connection
4. **Access Logs**: Available in Render dashboard

## Cost Estimation

**Free Plan**: $0/month
- Good for development and testing
- 750 hours = ~31 days if always on
- Auto-sleep helps preserve hours

**Starter Plan**: $7/month
- Always-on service
- Better for production
- Up to 2GB RAM

## Next Steps

1. **Set up CI/CD**: Automatic deploys on git push (already enabled)
2. **Add monitoring**: Set up uptime monitoring
3. **Configure backups**: Database backup strategy
4. **Performance optimization**: Monitor and optimize for cold starts

## Support

For deployment issues:
1. Check Render service logs
2. Verify environment variables
3. Test database connectivity
4. Check Render status page: [status.render.com](https://status.render.com)