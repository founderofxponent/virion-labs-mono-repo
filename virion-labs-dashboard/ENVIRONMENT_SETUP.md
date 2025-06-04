# Environment Setup Guide

This guide explains how to configure your environment variables for development and production deployments.

## Environment Variables

### Required Variables

#### `NEXT_PUBLIC_APP_URL`
The base URL of your application. This is used for generating referral links and other URLs.

- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

Example:
```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://dashboard.virionlabs.com
```

#### `NEXT_PUBLIC_REFERRAL_DOMAIN` (Optional)
A custom domain for referral links. If not set, the main app URL will be used.

- **Development**: Leave empty (uses localhost)
- **Production**: Set to your custom referral domain if you have one

Example:
```bash
# Use main domain for referrals (leave empty)
NEXT_PUBLIC_REFERRAL_DOMAIN=

# Or use a custom referral domain
NEXT_PUBLIC_REFERRAL_DOMAIN=https://ref.virionlabs.com
```

### Complete Environment File Examples

#### Development (`.env.local`)
```bash
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_REFERRAL_DOMAIN=

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Database URL
DATABASE_URL=your_database_url_here

# Optional: Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
```

#### Production (`.env.production` or deployment environment)
```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://dashboard.virionlabs.com
NEXT_PUBLIC_REFERRAL_DOMAIN=https://ref.virionlabs.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Database URL
DATABASE_URL=your_production_database_url

# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_production_bot_token
DISCORD_CLIENT_ID=your_production_client_id
```

## How Referral Links Work

### Development
When running locally, referral links will be generated as:
- Without custom domain: `http://localhost:3000/api/referral/your-code-here`
- With custom domain: `https://ref.virionlabs.com/api/referral/your-code-here`

### Production
In production, referral links will be generated as:
- Without custom domain: `https://dashboard.virionlabs.com/api/referral/your-code-here`
- With custom domain: `https://ref.virionlabs.com/api/referral/your-code-here`

## Setting Up for Different Deployment Platforms

### Vercel
Add environment variables in your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for the appropriate environment (Development, Preview, Production)

### Netlify
Add environment variables in your Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add each variable

### Railway/Render/Heroku
Add environment variables through their respective dashboards or CLI tools.

## Testing Your Configuration

You can verify your environment configuration by checking the generated URLs:

1. Create a referral link in the dashboard
2. Check the generated URL format
3. Test the link to ensure it redirects properly

## Troubleshooting

### Links not working in development
- Ensure `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000`
- Make sure you're running the development server on port 3000

### Links not working in production
- Verify `NEXT_PUBLIC_APP_URL` matches your production domain
- Ensure all environment variables are set in your deployment platform
- Check that your domain/subdomain is properly configured

### Custom referral domain not working
- Verify DNS settings for your custom domain
- Ensure the custom domain points to your application
- Check that `NEXT_PUBLIC_REFERRAL_DOMAIN` is set correctly

## Security Notes

1. Never commit `.env.local` or any environment files to version control
2. Use different Supabase projects/keys for development and production
3. Rotate service role keys regularly
4. Ensure your production domain uses HTTPS 