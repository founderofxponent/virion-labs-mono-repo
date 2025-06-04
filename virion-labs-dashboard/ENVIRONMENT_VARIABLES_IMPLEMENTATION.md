# Environment Variables Implementation Summary

## What Was Implemented

We've successfully implemented environment variable support for referral links, allowing you to use different domains for development and production environments.

## Changes Made

### 1. Environment Variables Added (`env.example`)
- `NEXT_PUBLIC_APP_URL`: Base URL of your application
- `NEXT_PUBLIC_REFERRAL_DOMAIN`: Optional custom domain for referral links

### 2. Utility Functions (`lib/url-utils.ts`)
Created centralized functions for URL generation:
- `getAppUrl()`: Gets the base application URL
- `getReferralDomain()`: Gets the domain for referral links
- `generateReferralUrl(code)`: Generates complete referral URLs
- `generateReferralCode(title)`: Generates referral codes
- `getEnvironmentConfig()`: Returns current environment configuration

### 3. Updated Components
- **Referral Links Hook** (`hooks/use-referral-links.ts`): Now uses utility functions
- **Campaign API Route** (`app/api/campaigns/[id]/referral-links/route.ts`): Uses utility functions
- **Seed Data Script** (`scripts/seed-data.ts`): Uses utility functions for sample data

### 4. Documentation
- **Environment Setup Guide** (`ENVIRONMENT_SETUP.md`): Complete setup instructions
- **Updated env.example**: Added new environment variables with documentation

## How It Works

### Development Environment
```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_REFERRAL_DOMAIN=
```
**Result**: Referral links will be `http://localhost:3000/api/referral/your-code`

### Production Environment
```bash
# Production environment variables
NEXT_PUBLIC_APP_URL=https://dashboard.virionlabs.com
NEXT_PUBLIC_REFERRAL_DOMAIN=https://ref.virionlabs.com
```
**Result**: Referral links will be `https://ref.virionlabs.com/api/referral/your-code`

## Quick Setup Instructions

### For Development:
1. Copy `env.example` to `.env.local`
2. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. Leave `NEXT_PUBLIC_REFERRAL_DOMAIN` empty
4. Add your Supabase credentials
5. Run `npm run dev`

### For Production:
1. Set environment variables in your deployment platform:
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_REFERRAL_DOMAIN=https://ref.yourdomain.com` (optional)
2. Deploy your application

## Testing Your Setup

1. **Start Development Server**: Run `npm run dev`
2. **Create a Test Link**: Create a referral link and verify the URL format
3. **Test the Link**: Click the generated link to ensure it redirects properly

## Benefits

✅ **Environment Flexibility**: Different URLs for development and production  
✅ **Custom Domains**: Support for branded referral domains  
✅ **Easy Testing**: Test referral links locally with localhost URLs  
✅ **Production Ready**: Seamless deployment with proper production domains  
✅ **Clean Interface**: No annoying debug components cluttering the UI  
✅ **Backward Compatible**: Existing functionality remains unchanged  

## Files Modified

- `env.example` - Added new environment variables
- `lib/url-utils.ts` - New utility functions
- `hooks/use-referral-links.ts` - Updated to use utilities
- `app/api/campaigns/[id]/referral-links/route.ts` - Updated to use utilities
- `scripts/seed-data.ts` - Updated to use utilities
- `ENVIRONMENT_SETUP.md` - Complete setup documentation

## Next Steps

1. Copy `env.example` to `.env.local` and configure for development
2. Test referral link creation and functionality locally
3. Configure production environment variables when deploying
4. Set up custom referral domain DNS (if using a custom domain) 