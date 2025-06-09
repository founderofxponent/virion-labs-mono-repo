-- Database Cleanup: Remove Obsolete Tables After Bot Configuration Migration
-- This script removes tables that are no longer needed after migrating to campaign templates

-- BACKUP IMPORTANT DATA FIRST (Optional - for safety)
CREATE TABLE IF NOT EXISTS bot_configurations_archive AS SELECT * FROM bot_configurations;
CREATE TABLE IF NOT EXISTS bots_archive AS SELECT * FROM bots;
CREATE TABLE IF NOT EXISTS campaign_templates_archive AS SELECT * FROM campaign_templates;

-- Add comments for archived tables
COMMENT ON TABLE bot_configurations_archive IS 'Archived data from obsolete bot_configurations table before migration to campaign templates';
COMMENT ON TABLE bots_archive IS 'Archived data from obsolete bots table before migration to campaign-based bot management';
COMMENT ON TABLE campaign_templates_archive IS 'Archived data from obsolete campaign_templates table before migration to TypeScript-based templates';

-- REMOVE OBSOLETE TABLES
-- These tables are no longer used by the active codebase

-- 1. Remove bot_configurations table (already migrated to campaign templates)
DROP TABLE IF EXISTS bot_configurations CASCADE;

-- 2. Remove standalone bots table (replaced by campaign-based bot management)
DROP TABLE IF EXISTS bots CASCADE;

-- 3. Remove database-based campaign_templates (replaced by TypeScript templates)
DROP TABLE IF EXISTS campaign_templates CASCADE;

-- VERIFICATION QUERIES
-- Run these after the cleanup to verify the cleanup was successful

-- Check that main tables still exist
SELECT 'discord_guild_campaigns' as table_name, COUNT(*) as row_count FROM discord_guild_campaigns
UNION ALL
SELECT 'referral_links', COUNT(*) FROM referral_links
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;

-- Check that obsolete tables are gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bot_configurations', 'bots', 'campaign_templates');

-- Should return empty result set if cleanup was successful

-- Log completion
INSERT INTO migration_log (migration_name, completed_at, notes) 
VALUES (
  'cleanup_obsolete_tables_after_campaign_migration',
  NOW(),
  'Removed bot_configurations, bots, and campaign_templates tables. Data archived to *_archive tables.'
) ON CONFLICT DO NOTHING;

-- Create the migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
); 