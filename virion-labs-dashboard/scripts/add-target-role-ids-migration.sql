-- Migration: Add target_role_ids array column to discord_guild_campaigns
-- This allows campaigns to specify multiple target roles

-- 1. Add the new column if it doesn't already exist
ALTER TABLE discord_guild_campaigns
ADD COLUMN IF NOT EXISTS target_role_ids TEXT[];

-- 2. Populate the new column using the existing target_role_id value
UPDATE discord_guild_campaigns
SET target_role_ids = ARRAY[target_role_id]
WHERE target_role_id IS NOT NULL
  AND target_role_ids IS NULL;
