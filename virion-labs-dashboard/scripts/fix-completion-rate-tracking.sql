-- Fix completion rate tracking by adding proper onboarding starts table
-- Date: January 2025

-- Step 1: Create the onboarding starts table
CREATE TABLE IF NOT EXISTS campaign_onboarding_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES discord_guild_campaigns(id) ON DELETE CASCADE,
    discord_user_id TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    guild_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate tracking of the same user starting the same campaign
    UNIQUE(campaign_id, discord_user_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_onboarding_starts_campaign_id 
ON campaign_onboarding_starts(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_onboarding_starts_discord_user_id 
ON campaign_onboarding_starts(discord_user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_onboarding_starts_started_at 
ON campaign_onboarding_starts(started_at);

-- Step 3: Update the main analytics function
CREATE OR REPLACE FUNCTION get_comprehensive_analytics_summary(p_campaign_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    overview_data JSONB;
    campaigns_data JSONB;
BEGIN
    -- Get overall metrics using corrected logic
    SELECT jsonb_build_object(
        'total_campaigns', COUNT(DISTINCT c.id),
        'active_campaigns', COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.id END),
        'campaigns_last_30_days', COUNT(DISTINCT CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN c.id END),
        'total_clients', COUNT(DISTINCT c.client_id),
        'active_clients', COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.client_id END),
        'new_clients_30_days', COUNT(DISTINCT CASE WHEN clients.created_at >= NOW() - INTERVAL '30 days' THEN c.client_id END),
        -- Fixed: Use starts table for users who started onboarding
        'total_users_responded', COALESCE(SUM(DISTINCT starts_stats.total_users_started), 0),
        'users_completed', COALESCE(SUM(DISTINCT completion_stats.total_users_completed), 0),
        'total_field_responses', COALESCE(SUM(response_counts.total_responses), 0),
        'responses_last_7_days', COALESCE(SUM(CASE WHEN response_counts.responses_last_7_days IS NOT NULL THEN response_counts.responses_last_7_days ELSE 0 END), 0),
        'responses_last_30_days', COALESCE(SUM(CASE WHEN response_counts.responses_last_30_days IS NOT NULL THEN response_counts.responses_last_30_days ELSE 0 END), 0),
        'total_interactions', COALESCE(SUM(c.total_interactions), 0),
        'unique_interaction_users', COUNT(DISTINCT interaction_users.discord_user_id),
        'onboarding_completions', COALESCE(SUM(DISTINCT completion_stats.total_users_completed), 0),
        'interactions_24h', COALESCE(SUM(CASE WHEN interaction_users.created_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END), 0),
        'total_referral_links', (SELECT COUNT(*) FROM referral_links WHERE is_active = true),
        'active_referral_links', (SELECT COUNT(*) FROM referral_links WHERE is_active = true AND expires_at > NOW()),
        'total_clicks', (SELECT COALESCE(SUM(clicks), 0) FROM referral_links),
        'total_conversions', (SELECT COALESCE(SUM(conversions), 0) FROM referral_links),
        -- Fixed completion rate: users_completed / users_started
        'completion_rate', CASE 
            WHEN SUM(DISTINCT starts_stats.total_users_started) > 0 
            THEN ROUND((SUM(DISTINCT completion_stats.total_users_completed)::numeric / SUM(DISTINCT starts_stats.total_users_started)::numeric) * 100, 2)
            ELSE 0 
        END,
        'click_through_rate', CASE 
            WHEN (SELECT SUM(clicks) FROM referral_links) > 0 
            THEN ROUND(((SELECT SUM(conversions) FROM referral_links)::numeric / (SELECT SUM(clicks) FROM referral_links)::numeric) * 100, 2)
            ELSE 0 
        END
    ) INTO overview_data
    FROM discord_guild_campaigns c
    LEFT JOIN clients ON c.client_id = clients.id
    -- Use starts table for accurate tracking
    LEFT JOIN (
        SELECT campaign_id, COUNT(DISTINCT discord_user_id) as total_users_started
        FROM campaign_onboarding_starts
        GROUP BY campaign_id
    ) starts_stats ON c.id = starts_stats.campaign_id
    -- Use completions table for completed users
    LEFT JOIN (
        SELECT campaign_id, COUNT(DISTINCT discord_user_id) as total_users_completed
        FROM campaign_onboarding_completions
        GROUP BY campaign_id
    ) completion_stats ON c.id = completion_stats.campaign_id
    -- Response counts for detailed metrics
    LEFT JOIN (
        SELECT 
            campaign_id,
            COUNT(*) as total_responses,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as responses_last_7_days,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as responses_last_30_days
        FROM campaign_onboarding_responses
        GROUP BY campaign_id
    ) response_counts ON c.id = response_counts.campaign_id
    -- Interaction users
    LEFT JOIN discord_referral_interactions interaction_users ON c.id = interaction_users.guild_campaign_id
    WHERE c.is_deleted = false
    AND (p_campaign_id IS NULL OR c.id = p_campaign_id);

    -- Get campaign-specific data with corrected completion rates
    WITH campaign_metrics AS (
        SELECT 
            c.id as campaign_id,
            c.campaign_name,
            clients.name as client_name,
            COALESCE(field_counts.total_fields, 0) as total_fields,
            COALESCE(field_counts.active_fields, 0) as active_fields,
            COALESCE(field_counts.required_fields, 0) as required_fields,
            COALESCE(starts_stats.total_users_started, 0) as total_users_started,
            COALESCE(completion_stats.total_users_completed, 0) as total_users_completed,
            COALESCE(interaction_stats.total_interactions, 0) as total_interactions,
            COALESCE(interaction_stats.interactions_last_7_days, 0) as interactions_last_7_days,
            -- Correct completion rate calculation
            CASE 
                WHEN COALESCE(starts_stats.total_users_started, 0) > 0 
                THEN ROUND((COALESCE(completion_stats.total_users_completed, 0)::numeric / starts_stats.total_users_started::numeric) * 100, 2)
                ELSE 0 
            END as completion_rate,
            c.is_active,
            c.created_at
        FROM discord_guild_campaigns c
        LEFT JOIN clients ON c.client_id = clients.id
        -- Starts tracking
        LEFT JOIN (
            SELECT campaign_id, COUNT(DISTINCT discord_user_id) as total_users_started
            FROM campaign_onboarding_starts
            GROUP BY campaign_id
        ) starts_stats ON c.id = starts_stats.campaign_id
        -- Completion tracking
        LEFT JOIN (
            SELECT campaign_id, COUNT(DISTINCT discord_user_id) as total_users_completed
            FROM campaign_onboarding_completions
            GROUP BY campaign_id
        ) completion_stats ON c.id = completion_stats.campaign_id
        -- Field statistics
        LEFT JOIN (
            SELECT 
                campaign_id,
                COUNT(*) as total_fields,
                COUNT(CASE WHEN is_enabled = true THEN 1 END) as active_fields,
                COUNT(CASE WHEN is_required = true AND is_enabled = true THEN 1 END) as required_fields
            FROM campaign_onboarding_fields
            GROUP BY campaign_id
        ) field_counts ON c.id = field_counts.campaign_id
        -- Interaction statistics
        LEFT JOIN (
            SELECT 
                guild_campaign_id as campaign_id,
                COUNT(*) as total_interactions,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as interactions_last_7_days
            FROM discord_referral_interactions
            GROUP BY guild_campaign_id
        ) interaction_stats ON c.id = interaction_stats.campaign_id
        WHERE c.is_deleted = false
        AND (p_campaign_id IS NULL OR c.id = p_campaign_id)
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'campaign_id', campaign_id,
            'campaign_name', campaign_name,
            'client_name', client_name,
            'total_fields', total_fields,
            'active_fields', active_fields,
            'required_fields', required_fields,
            'total_users_started', total_users_started,
            'total_users_completed', total_users_completed,
            'total_interactions', total_interactions,
            'interactions_last_7_days', interactions_last_7_days,
            'completion_rate', completion_rate,
            'is_active', is_active,
            'created_at', created_at
        )
    ) INTO campaigns_data
    FROM campaign_metrics;

    -- Build final result
    result := jsonb_build_object(
        'overview', overview_data,
        'campaigns', COALESCE(campaigns_data, '[]'::jsonb)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMIT;