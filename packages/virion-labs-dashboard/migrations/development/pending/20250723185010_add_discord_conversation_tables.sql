CREATE TABLE discord_message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES discord_guild_campaigns(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ongoing' -- ongoing, completed, abandoned
);

CREATE TABLE discord_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES discord_message_threads(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_bot_message BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE onboarding_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES discord_message_threads(id) ON DELETE CASCADE,
    summary TEXT,
    extracted_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update 'updated_at' timestamp on discord_message_threads
CREATE OR REPLACE FUNCTION update_thread_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discord_message_threads
    SET updated_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discord_messages_thread_updated_at
AFTER INSERT ON discord_messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_updated_at_column();

