-- Create campaign_publish_logs table for tracking Discord campaign publishes
CREATE TABLE IF NOT EXISTS campaign_publish_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL DEFAULT 'join-campaigns',
  active_campaigns_count INTEGER NOT NULL DEFAULT 0,
  inactive_campaigns_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_by TEXT NOT NULL DEFAULT 'dashboard',
  message_id TEXT, -- Discord message ID of the published message
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_publish_logs_guild_id ON campaign_publish_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_campaign_publish_logs_published_at ON campaign_publish_logs(published_at);

-- Add RLS policy if RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'campaign_publish_logs' AND n.nspname = current_schema()
    AND c.relrowsecurity = true
  ) THEN
    -- Enable RLS
    ALTER TABLE campaign_publish_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for authenticated users
    CREATE POLICY "Users can view campaign publish logs" ON campaign_publish_logs
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if RLS is not enabled
END
$$; 