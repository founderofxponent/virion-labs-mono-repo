# Development to Production Workflow Guide

**Version:** 1.0 | **Updated:** January 3, 2025 | **Status:** Complete

## 📋 Overview

Complete workflow for safely developing features in development environment and deploying to production with automated tools, safety checks, and comprehensive documentation.

## 🎯 System Architecture

### Database Environments

| Environment | Project ID | Purpose |
|-------------|------------|---------|
| **Development** | `xhfrxwyggplhytlopixb` | Feature development & testing |
| **Production** | `mcynacktfmtzkkohctps` | Live application database |

### Schema Status (January 3, 2025)
- ✅ Complete schema copy completed
- ✅ 24 tables recreated with identical structure  
- ✅ All constraints and relationships preserved
- ✅ Performance indexes added

## 🛠️ Tools & Scripts

### Environment Management
```bash
npm run env:dev        # Switch to development
npm run env:prod       # Switch to production
npm run env:status     # Check current environment
npm run env:init       # Create environment templates
```

### Migration Management
```bash
npm run migration:create        # Create new migration
npm run migration:create list   # List all migrations
npm run compare-schemas         # Compare dev vs prod schemas
```

## 🔄 Complete Workflow

### Phase 1: Initial Setup

1. **Create Environment Files**
   ```bash
   npm run env:init
   ```

2. **Configure API Keys**
   - Edit `.env.development` with development database keys
   - Edit `.env.production` with production database keys

3. **Verify Setup**
   ```bash
   npm run env:status
   ```

### Phase 2: Development

1. **Switch to Development**
   ```bash
   npm run env:dev
   npm run dev
   ```

2. **Make Database Changes**
   - Use Supabase MCP tools on development database
   - Apply schema changes via `mcp_supabase-virion-labs_apply_migration`
   - Test with `mcp_supabase-virion-labs_execute_sql`

3. **Develop Features**
   - Code against development database
   - Test thoroughly
   - Handle error scenarios

4. **Document Changes**
   ```bash
   npm run migration:create
   ```

### Phase 3: Pre-Production Validation

1. **Schema Comparison**
   ```bash
   npm run compare-schemas
   ```

2. **Testing Checklist**
   - [ ] Features work in development
   - [ ] Database changes tested
   - [ ] Error scenarios handled
   - [ ] Performance acceptable

### Phase 4: Production Deployment

1. **Pre-Deployment**
   - [ ] Production backup created
   - [ ] Team notified
   - [ ] Migration tested
   - [ ] Rollback plan ready

2. **Deploy**
   ```bash
   npm run env:prod  # ⚠️ PRODUCTION MODE
   ```
   - Apply migrations using Supabase MCP tools
   - Move migration files to applied folder

3. **Post-Deployment Verification**
   - [ ] Application starts correctly
   - [ ] APIs respond properly
   - [ ] Database performs well
   - [ ] Critical features work

## 🛡️ Safety Features

### Environment Isolation
- Visual indicators for current environment
- Separate API keys and configuration
- Production mode warnings

### Migration Safety
- Pre-migration schema comparison
- Rollback documentation in each migration
- Validation queries included

### Emergency Procedures
- Immediate rollback procedures
- Database restore options
- Clear escalation path

## 📝 Migration Template

```sql
-- Migration: [Name]
-- Generated: [Timestamp]
-- Description: [Purpose]

BEGIN;

-- Migration SQL here
CREATE TABLE IF NOT EXISTS example (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

COMMIT;

-- Rollback: DROP TABLE IF EXISTS example;
-- Validation: SELECT table_name FROM information_schema.tables WHERE table_name = 'example';
```

## 🗂️ File Structure

```
virion-labs-dashboard/
├── scripts/
│   ├── switch-environment.js     # Environment switching
│   ├── create-migration.js       # Migration creation
│   ├── compare-schemas.js        # Schema comparison
│   └── dev-to-prod-workflow.md   # Detailed workflow
├── migrations/
│   ├── development/              # Dev migrations
│   ├── production/
│   │   ├── applied/              # Applied to prod
│   │   └── pending/              # Ready for prod
│   └── reports/                  # Comparison reports
├── .env.development              # Dev environment
└── .env.production               # Prod environment
```

## 📊 Success Metrics

- ✅ Zero data loss during migration
- ✅ All features functional post-deployment
- ✅ Performance within acceptable ranges
- ✅ Clean migration completion
- ✅ No rollbacks required

## 🚨 Troubleshooting

### Common Issues
- **Environment switch fails**: Check file permissions, verify environment files exist
- **Schema comparison issues**: Verify API keys, check network connectivity
- **Migration fails**: Review SQL syntax, check dependencies

### Getting Help
1. Check this documentation
2. Review related KB articles
3. Test on development first
4. Escalate to senior developers

## 📚 Related Documentation

- [Supabase Database Schema](../database/SUPABASE_DATABASE_SCHEMA.md)
- [Environment Setup Guide](../../dashboard/deployment/ENVIRONMENT_SETUP.md)
- [API Documentation](../../dashboard/api-documentation/)

---

This workflow ensures safe, reliable deployments while maintaining data integrity and system stability. 