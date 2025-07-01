# Development to Production Workflow Guide

## 🎯 Overview

This guide outlines the complete workflow for developing features in the development environment and safely promoting them to production.

## 🚀 Development Environment Setup

### Environment Variables Configuration

**Development (.env.development):**
```bash
# Supabase Development Database
NEXT_PUBLIC_SUPABASE_URL=https://xhfrxwyggplhytlopixb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
SUPABASE_PROJECT_ID=xhfrxwyggplhytlopixb

# Environment Indicators
NODE_ENV=development
SUPABASE_ENV=development

# Discord Bot (Development)
DISCORD_BOT_TOKEN=your_dev_bot_token
DISCORD_CLIENT_ID=your_dev_client_id
DISCORD_CLIENT_SECRET=your_dev_client_secret

# Optional: Development-specific settings
DEBUG_MODE=true
VERBOSE_LOGGING=true
```

**Production (.env.production):**
```bash
# Supabase Production Database
NEXT_PUBLIC_SUPABASE_URL=https://mcynacktfmtzkkohctps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
SUPABASE_PROJECT_ID=mcynacktfmtzkkohctps

# Environment Indicators
NODE_ENV=production
SUPABASE_ENV=production

# Discord Bot (Production)
DISCORD_BOT_TOKEN=your_prod_bot_token
DISCORD_CLIENT_ID=your_prod_client_id
DISCORD_CLIENT_SECRET=your_prod_client_secret

# Production-specific settings
DEBUG_MODE=false
VERBOSE_LOGGING=false
```

## 🔄 Development Workflow

### Phase 1: Feature Development

1. **Switch to Development Environment**
   ```bash
   # Copy development environment variables
   cp .env.development .env.local
   
   # Start development server
   npm run dev
   ```

2. **Database Changes**
   - Make schema changes using Supabase MCP tools on development DB
   - Test changes thoroughly
   - Document changes in migration files

3. **Code Development**
   - Develop features against development database
   - Test all functionality
   - Ensure proper error handling

### Phase 2: Migration Preparation

1. **Schema Comparison**
   ```bash
   # Compare development vs production schemas
   npm run compare-schemas
   ```

2. **Create Migration Files**
   ```bash
   # Generate migration SQL from schema differences
   npm run generate-migration
   ```

3. **Migration Testing**
   ```bash
   # Test migration on development copy
   npm run test-migration
   ```

### Phase 3: Production Deployment

1. **Pre-deployment Checklist**
   - [ ] All features tested in development
   - [ ] Migration scripts created and tested
   - [ ] Production backup created
   - [ ] Team notified of deployment
   - [ ] Rollback plan prepared

2. **Production Migration**
   ```bash
   # Switch to production environment
   cp .env.production .env.local
   
   # Apply migration to production
   npm run migrate-production
   ```

3. **Post-deployment Verification**
   - [ ] Schema changes applied successfully
   - [ ] Application functions correctly
   - [ ] No data loss or corruption
   - [ ] Performance metrics normal

## 🛠 Required Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "compare-schemas": "node scripts/compare-schemas.js",
    "generate-migration": "node scripts/generate-migration.js",
    "test-migration": "node scripts/test-migration.js",
    "migrate-production": "node scripts/migrate-production.js",
    "backup-production": "node scripts/backup-production.js",
    "rollback-migration": "node scripts/rollback-migration.js"
  }
}
```

## 🔧 Migration Management

### Migration File Structure

```
migrations/
├── development/
│   ├── 001_initial_schema.sql
│   ├── 002_add_user_preferences.sql
│   └── 003_campaign_improvements.sql
├── production/
│   ├── applied/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_add_user_preferences.sql
│   └── pending/
│   │   └── 003_campaign_improvements.sql
└── scripts/
    ├── compare-schemas.js
    ├── generate-migration.js
    └── migrate-production.js
```

### Migration Naming Convention

```
YYYY-MM-DD-HH-MM_descriptive_name.sql

Examples:
2025-01-03-14-30_add_user_preferences_table.sql
2025-01-03-15-45_update_campaign_status_enum.sql
2025-01-03-16-00_add_analytics_indexes.sql
```

## 🛡 Safety Measures

### 1. Automatic Backups
```bash
# Before any production migration
npm run backup-production
```

### 2. Schema Validation
```bash
# Validate schema integrity after migration
npm run validate-schema
```

### 3. Rollback Capability
```bash
# Rollback last migration if needed
npm run rollback-migration
```

### 4. Data Integrity Checks
```bash
# Check for data consistency issues
npm run check-data-integrity
```

## 🚨 Emergency Procedures

### If Migration Fails

1. **Immediate Response**
   ```bash
   # Stop application
   npm run stop-production
   
   # Rollback database
   npm run rollback-migration
   
   # Restore from backup if needed
   npm run restore-backup
   ```

2. **Investigation**
   - Check migration logs
   - Identify failure point
   - Assess data impact

3. **Recovery**
   - Fix migration script
   - Test on development copy
   - Re-apply corrected migration

### Communication Protocol

1. **Pre-deployment**: Notify team 30 minutes before
2. **During deployment**: Status updates every 5 minutes
3. **Post-deployment**: Success/failure notification immediately
4. **Issues**: Immediate escalation to senior developers

## 📊 Monitoring and Validation

### Post-Migration Checks

1. **Application Health**
   ```bash
   # Check all endpoints
   npm run health-check
   ```

2. **Database Performance**
   ```bash
   # Monitor query performance
   npm run monitor-db-performance
   ```

3. **User Functionality**
   - Test critical user flows
   - Verify data integrity
   - Check authentication

### Success Criteria

- ✅ All database changes applied successfully
- ✅ Application starts without errors
- ✅ All API endpoints respond correctly
- ✅ User authentication works
- ✅ Critical features function properly
- ✅ No performance degradation

## 🔄 Continuous Integration

### Automated Testing Pipeline

1. **Development Environment**
   - Unit tests pass
   - Integration tests pass
   - Schema validation passes

2. **Staging Environment** (Optional)
   - Full application testing
   - Performance testing
   - Security testing

3. **Production Environment**
   - Gradual rollout
   - Real-time monitoring
   - Quick rollback capability

## 📝 Documentation Requirements

### For Each Migration

1. **Purpose**: What changes and why
2. **Impact**: Affected tables and features
3. **Risk Assessment**: Potential issues
4. **Rollback Plan**: How to undo changes
5. **Validation Steps**: How to verify success

### Migration Log Template

```markdown
# Migration: [Name]
**Date**: YYYY-MM-DD
**Developer**: [Name]
**Ticket**: [Link to issue/task]

## Purpose
[Description of changes and reasoning]

## Changes
- [ ] Table modifications
- [ ] New constraints
- [ ] Index additions
- [ ] Data transformations

## Risk Assessment
**Risk Level**: Low/Medium/High
**Potential Issues**: [List potential problems]
**Mitigation**: [How risks are addressed]

## Validation
- [ ] Schema applied successfully
- [ ] Data integrity maintained
- [ ] Application functions correctly
- [ ] Performance acceptable

## Rollback Plan
[Detailed steps to undo changes if needed]
```

This workflow ensures safe, reliable deployments from development to production while maintaining data integrity and system stability. 