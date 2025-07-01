# Unified Environment Management System

## Overview

The Unified Environment Management System provides consistent environment switching across both the **Dashboard** and **Discord Bot** applications. This prevents environment mismatches and ensures both services always connect to the same database.

## Problem Solved

Previously, the dashboard and Discord bot had separate environment configurations, leading to issues where:
- Dashboard could be in development while Discord bot was in production
- Manual switching of each service individually was error-prone
- Environment mismatches caused confusing user experiences

## Architecture

```
virion-labs-mono-repo/
├── scripts/
│   └── switch-all-environments.js    # Unified controller
├── package.json                      # Root package with unified commands
├── virion-labs-dashboard/
│   ├── scripts/
│   │   └── switch-environment.js     # Dashboard environment manager
│   ├── .env.development             # Dashboard dev config
│   ├── .env.production              # Dashboard prod config
│   └── .env                         # Active dashboard config
└── virion-labs-discord-bot/
    ├── scripts/
    │   └── switch-environment.js     # Bot environment manager
    ├── .env.development             # Bot dev config
    ├── .env.production              # Bot prod config
    └── .env                         # Active bot config
```

## Environment Configurations

### Development Environment
- **Database**: `xhfrxwyggplhytlopixb` (Development Supabase)
- **Features**: Debug mode enabled, verbose logging
- **Dashboard URL**: `http://localhost:3000`
- **Data**: Schema-only, no production data

### Production Environment
- **Database**: `mcynacktfmtzkkohctps` (Production Supabase)
- **Features**: Debug mode disabled, optimized logging
- **Dashboard URL**: Production domain
- **Data**: Live production data

## Usage

### From Root Directory (Recommended)

Switch both services to development:
```bash
npm run env:dev
```

Switch both services to production:
```bash
npm run env:prod
```

Check status of both services:
```bash
npm run env:status
```

### Individual Service Management

Dashboard only:
```bash
cd virion-labs-dashboard
npm run env:dev    # or env:prod, env:status
```

Discord Bot only:
```bash
cd virion-labs-discord-bot
npm run env:dev    # or env:prod, env:status
```

### Starting Services After Environment Switch

After switching environments, restart both services:

1. **Dashboard**:
   ```bash
   cd virion-labs-dashboard
   npm run dev
   ```

2. **Discord Bot**:
   ```bash
   cd virion-labs-discord-bot
   npm start
   ```

Or use the unified command:
```bash
npm run start:all
```

## Command Reference

### Root Commands (Monorepo Level)

| Command | Description |
|---------|-------------|
| `npm run env:dev` | Switch all services to development |
| `npm run env:prod` | Switch all services to production |
| `npm run env:status` | Show environment status for all services |
| `npm run dashboard:dev` | Start dashboard in development mode |
| `npm run bot:start` | Start Discord bot |
| `npm run start:all` | Start both services simultaneously |

### Individual Service Commands

| Command | Description |
|---------|-------------|
| `npm run env:dev` | Switch service to development |
| `npm run env:prod` | Switch service to production |
| `npm run env:status` | Show current environment |
| `npm run env:init` | Create environment template files |

## Safety Features

### Production Warnings
When switching to production, the system displays prominent warnings:
```
⚠️  WARNING: All services are now in PRODUCTION mode
🚨 Be extra careful with database operations!
```

### Environment Verification
The status command clearly shows which environment each service is using:
```
📊 Environment Status for All Services:

📋 Dashboard
   ✅ Development Environment
   📍 Project ID: xhfrxwyggplhytlopixb

📋 Discord Bot
   ✅ Development Environment
   📍 Project ID: xhfrxwyggplhytlopixb
```

### Automatic Validation
- Checks for environment file existence before switching
- Validates Supabase project IDs match expected values
- Provides clear error messages for missing configurations

## Best Practices

### 1. Always Use Unified Commands
```bash
# ✅ Good - Ensures consistency
npm run env:dev

# ❌ Avoid - Can cause mismatches
cd virion-labs-dashboard && npm run env:dev
cd virion-labs-discord-bot && npm run env:prod
```

### 2. Verify After Switching
```bash
npm run env:dev
npm run env:status  # Verify both services switched
```

### 3. Restart Services After Switching
Environment changes require service restarts to take effect.

### 4. Use Development for Testing
Always test changes in development before switching to production.

## Summary

The Unified Environment Management System ensures consistency across all Virion Labs services, preventing environment mismatches and simplifying deployment workflows. Use the unified commands for best results and always verify environment status after switches.
