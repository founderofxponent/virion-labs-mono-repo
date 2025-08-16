# Railway Environment Variables Configuration

This document outlines the environment variables needed for each service in the Railway project.

## Service: virion-labs-strapi-cms

### Required Environment Variables:
```
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_HOST=[Your Supabase Database Host]
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=[Your Supabase Database Username]
DATABASE_PASSWORD=[Your Supabase Database Password]
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
APP_KEYS=[Generate 4 random base64 keys]
API_TOKEN_SALT=[Generate random base64 salt]
ADMIN_JWT_SECRET=[Generate random JWT secret]
TRANSFER_TOKEN_SALT=[Generate random base64 salt]
JWT_SECRET=[Generate random JWT secret]
ENCRYPTION_KEY=[Generate random base64 key]
GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]
RESEND_API_KEY=[Your Resend API Key]
```

## Service: virion-labs-discord-bot-mvp

### Required Environment Variables:
```
NODE_ENV=production
PORT=8080
DISCORD_BOT_TOKEN=[Your Discord Bot MVP Token]
BUSINESS_LOGIC_API_URL=https://[business-api-service].railway.app
API_KEY=[Your API Key for Business Logic API]
DEBUG=false
```

## Service: virion-labs-discord-bot-client

### Required Environment Variables:
```
NODE_ENV=production
PORT=8081
DISCORD_BOT_TOKEN=[Your Discord Bot Client Token]
BUSINESS_LOGIC_API_URL=https://[business-api-service].railway.app
API_KEY=[Your API Key for Business Logic API]
DEBUG=false
```

## Service: virion-labs-business-logic-api

### Required Environment Variables:
```
PYTHONPATH=/app
STRAPI_URL=https://[strapi-service].railway.app
STRAPI_API_TOKEN=[Strapi API Token]
SUPABASE_URL=[Your Supabase Project URL]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key]
JWT_SECRET=[Generate JWT secret - can be same as Strapi]
API_KEY=[Generate API key for service authentication]
ENVIRONMENT=production
FRONTEND_URL=https://[dashboard-service].railway.app
REFERRAL_BASE_URL=https://[your-domain]/r
DISCORD_BOT_TOKEN=[Your Discord Bot Token]
DISCORD_CLIENT_BOT_CLIENT_ID=[Your Discord Client Bot ID]
```

### Optional Environment Variables:
```
API_TITLE=Virion Labs Business Logic API
API_VERSION=1.0.0
API_PORT=8000
JWT_ALGORITHM=HS256
PASSWORD_RESET_EXPIRE_MINUTES=30
ADMIN_EMAIL=[Admin email for notifications]
```

## Service: virion-labs-dashboard

### Required Environment Variables:
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key]
SUPABASE_PROJECT_ID=[Your Supabase Project ID]
SUPABASE_ENV=production
NEXT_PUBLIC_BUSINESS_LOGIC_API_URL=https://[business-api-service].railway.app
NEXT_PUBLIC_API_URL=https://[business-api-service].railway.app
NEXT_PUBLIC_API_KEY=[Your API Key for Business Logic API]
NEXT_PUBLIC_APP_URL=https://[dashboard-service].railway.app
NEXTAUTH_SECRET=[Generate random secret]
NEXTAUTH_URL=https://[dashboard-service].railway.app
NEXT_TELEMETRY_DISABLED=1
DISCORD_BOT_TOKEN=[Your Discord Bot Token]
DISCORD_GUILD_ID=[Your Discord Server ID]
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=[Your Discord Channel ID for Campaigns]
DEBUG_MODE=false
VERBOSE_LOGGING=false
```

### Optional Environment Variables:
```
NEXT_PUBLIC_REFERRAL_DOMAIN=[Optional: Custom referral domain]
DISCORD_BOT_WEBHOOK_URL=[Optional: Discord bot webhook URL for cache invalidation]
DISCORD_BOT_API_KEY=[Optional: Discord bot API key]
```

## Service: virion-labs-mcp-server

### Required Environment Variables:
```
PYTHONPATH=/app
SUPABASE_URL=[Your Supabase URL]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key]
MCP_SERVER_PORT=8001
ENVIRONMENT=production
```

## Database Configuration (Supabase)

1. Use your existing Supabase project database connection details
2. Get database credentials from Supabase dashboard → Settings → Database
3. For connection pooling, use the "Connection pooling" settings in Supabase
4. Ensure SSL is enabled for secure connections

## Setting Environment Variables in Railway

1. Go to your Railway project dashboard
2. Select each service
3. Go to "Variables" tab
4. Add the environment variables listed above
5. Use your Supabase database connection details for database-related services

## Security Notes

- Never commit actual environment variable values to git
- Use Railway's built-in secret management
- Generate new secrets for production deployment
- Use internal Railway URLs for service-to-service communication to avoid external traffic costs