-- Migration Script: Cleanup Obsolete bot_configurations Table
-- This script removes the old bot_configurations table and related references
-- since we've migrated to campaign templates with embedded bot configurations

-- Step 1: Remove foreign key constraints that reference bot_configurations
-- (The system should already be using discord_guild_campaigns table)

-- Step 2: Update any remaining references in related tables
-- Check if there are any bot_configuration_id columns that need to be removed

-- Step 3: Archive existing data (optional - for safety)
CREATE TABLE IF NOT EXISTS bot_configurations_archive AS
SELECT * FROM bot_configurations;

-- Step 4: Add note about archived data
COMMENT ON TABLE bot_configurations_archive IS 'Archived data from obsolete bot_configurations table before migration to campaign templates';

-- Step 5: Drop the obsolete table
-- Note: This will cascade and remove related foreign key constraints
DROP TABLE IF EXISTS bot_configurations CASCADE;

-- Step 6: Clean up any remaining references in other tables
-- Remove bot_configuration_id column from any tables that still have it
-- (Based on the current schema, this appears to be handled already)

-- Step 7: Update sequences and indexes if needed
-- (Not needed for this migration)

-- Verification query to confirm cleanup
-- Run this after the migration to verify no references remain
SELECT 
    schemaname,
    tablename,
    attname as column_name
FROM pg_attribute 
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid 
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
WHERE attname LIKE '%bot_config%' 
    AND schemaname = 'public'
    AND NOT attisdropped;

-- Migration complete - bot_configurations table and references cleaned up
-- All bot configuration data is now managed through campaign templates 