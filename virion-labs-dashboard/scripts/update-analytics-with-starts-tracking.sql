-- Migration: Update analytics to use campaign_onboarding_starts for accurate completion rates
-- Date: January 2025
-- Purpose: Fix completion rate calculations by using true onboarding starts tracking

-- Update the campaign_onboarding_overview view to use starts table
DROP VIEW IF EXISTS campaign_onboarding_overview CASCADE;

CREATE VIEW campaign_onboarding_overview AS
SELECT 
    c.id as campaign_id,
    c.campaign_name,
    c.campaign_type,
    clients.name as client_name,
    -- Use the new starts table for accurate tracking
    COALESCE(starts_stats.total_users_started, 0) as total_users_started,
    COALESCE(completion_stats.total_users_completed, 0) as total_users_completed,
    -- Calculate completion rate using starts vs completions
    CASE 
        WHEN COALESCE(starts_stats.total_users_started, 0) > 0 
        THEN ROUND((COALESCE(completion_stats.total_users_completed, 0)::numeric / starts_stats.total_users_started::numeric) * 100, 2)
        ELSE 0 
    END as completion_rate_percentage,
    COALESCE(field_counts.total_fields, 0) as total_fields,
    COALESCE(field_counts.required_fields, 0) as required_fields,
    starts_stats.first_start_date,
    completion_stats.latest_completion_date
FROM discord_guild_campaigns c
LEFT JOIN clients ON c.client_id = clients.id
-- Join with starts statistics
LEFT JOIN (
    SELECT 
        campaign_id,
        COUNT(DISTINCT discord_user_id) as total_users_started,
        MIN(started_at) as first_start_date
    FROM campaign_onboarding_starts
    GROUP BY campaign_id
) starts_stats ON c.id = starts_stats.campaign_id
-- Join with completion statistics  
LEFT JOIN (
    SELECT 
        campaign_id,
        COUNT(DISTINCT discord_user_id) as total_users_completed,
        MAX(completed_at) as latest_completion_date
    FROM campaign_onboarding_completions
    GROUP BY campaign_id
) completion_stats ON c.id = completion_stats.campaign_id
-- Join with field counts
LEFT JOIN (
    SELECT 
        campaign_id,
        COUNT(*) as total_fields,
        COUNT(CASE WHEN is_required = true THEN 1 END) as required_fields
    FROM campaign_onboarding_fields
    WHERE is_enabled = true
    GROUP BY campaign_id
) field_counts ON c.id = field_counts.campaign_id
WHERE c.is_deleted = false;

-- Update the campaign_analytics_view to use the new logic
DROP VIEW IF EXISTS campaign_analytics_view CASCADE;

CREATE VIEW campaign_analytics_view AS
SELECT 
    c.id as campaign_id,
    c.campaign_name,
    c.client_id,
    clients.name as client_name,
    c.is_active,
    c.created_at,
    COALESCE(field_counts.total_fields, 0) as total_fields,
    COALESCE(field_counts.active_fields, 0) as active_fields,
    COALESCE(field_counts.required_fields, 0) as required_fields,
    -- Use starts table for accurate started count
    COALESCE(starts_stats.total_users_started, 0) as total_users_started,
    COALESCE(completion_stats.total_users_completed, 0) as total_users_completed,
    COALESCE(interaction_stats.total_interactions, 0) as total_interactions,
    COALESCE(interaction_stats.interactions_last_7_days, 0) as interactions_last_7_days,
    -- Fixed completion rate calculation
    CASE 
        WHEN COALESCE(starts_stats.total_users_started, 0) > 0 
        THEN ROUND((COALESCE(completion_stats.total_users_completed, 0)::numeric / starts_stats.total_users_started::numeric) * 100, 2)
        ELSE 0 
    END as completion_rate
FROM discord_guild_campaigns c
LEFT JOIN clients ON c.client_id = clients.id
-- Onboarding starts statistics
LEFT JOIN (
    SELECT 
        campaign_id,
        COUNT(DISTINCT discord_user_id) as total_users_started
    FROM campaign_onboarding_starts
    GROUP BY campaign_id
) starts_stats ON c.id = starts_stats.campaign_id
-- Completion statistics
LEFT JOIN (
    SELECT 
        campaign_id,
        COUNT(DISTINCT discord_user_id) as total_users_completed
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
WHERE c.is_deleted = false;

-- Update or create the get_comprehensive_analytics_summary function
CREATE OR REPLACE FUNCTION get_comprehensive_analytics_summary(p_campaign_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    overview_data JSONB;
    campaigns_data JSONB;
BEGIN
    -- Get overall metrics using the updated logic
    SELECT jsonb_build_object(
        'total_campaigns', COUNT(DISTINCT c.id),
        'active_campaigns', COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.id END),
        'campaigns_last_30_days', COUNT(DISTINCT CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN c.id END),
        'total_clients', COUNT(DISTINCT c.client_id),
        'active_clients', COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.client_id END),
        'new_clients_30_days', COUNT(DISTINCT CASE WHEN clients.created_at >= NOW() - INTERVAL '30 days' THEN c.client_id END),
        -- Fixed metrics using starts table
        'total_users_responded', COALESCE(SUM(starts_stats.total_users_started), 0),
        'users_completed', COALESCE(SUM(completion_stats.total_users_completed), 0),
        'total_field_responses', COALESCE(SUM(response_counts.total_responses), 0),
        'responses_last_7_days', COALESCE(SUM(CASE WHEN response_counts.responses_last_7_days IS NOT NULL THEN response_counts.responses_last_7_days ELSE 0 END), 0),
        'responses_last_30_days', COALESCE(SUM(CASE WHEN response_counts.responses_last_30_days IS NOT NULL THEN response_counts.responses_last_30_days ELSE 0 END), 0),
        'total_interactions', COALESCE(SUM(c.total_interactions), 0),
        'unique_interaction_users', COUNT(DISTINCT interaction_users.discord_user_id),
        'onboarding_completions', COALESCE(SUM(completion_stats.total_users_completed), 0),
        'interactions_24h', COALESCE(SUM(CASE WHEN interaction_users.created_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END), 0),
        'total_referral_links', (SELECT COUNT(*) FROM referral_links WHERE is_active = true),
        'active_referral_links', (SELECT COUNT(*) FROM referral_links WHERE is_active = true AND expires_at > NOW()),
        'total_clicks', (SELECT COALESCE(SUM(clicks), 0) FROM referral_links),
        'total_conversions', (SELECT COALESCE(SUM(conversions), 0) FROM referral_links),
        -- Fixed completion rate
        'completion_rate', CASE 
            WHEN SUM(starts_stats.total_users_started) > 0 
            THEN ROUND((SUM(completion_stats.total_users_completed)::numeric / SUM(starts_stats.total_users_started)::numeric) * 100, 2)
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
    -- Join with starts statistics
    LEFT JOIN (
        SELECT campaign_id, COUNT(DISTINCT discord_user_id) as total_users_started
        FROM campaign_onboarding_starts
        GROUP BY campaign_id
    ) starts_stats ON c.id = starts_stats.campaign_id
    -- Join with completion statistics
    LEFT JOIN (
        SELECT campaign_id, COUNT(DISTINCT discord_user_id) as total_users_completed
        FROM campaign_onboarding_completions
        GROUP BY campaign_id
    ) completion_stats ON c.id = completion_stats.campaign_id
    -- Join with response counts
    LEFT JOIN (
        SELECT 
            campaign_id,
            COUNT(*) as total_responses,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as responses_last_7_days,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as responses_last_30_days
        FROM campaign_onboarding_responses
        GROUP BY campaign_id
    ) response_counts ON c.id = response_counts.campaign_id
    -- Join with interaction users
    LEFT JOIN discord_referral_interactions interaction_users ON c.id = interaction_users.guild_campaign_id
    WHERE c.is_deleted = false
    AND (p_campaign_id IS NULL OR c.id = p_campaign_id);

    -- Get campaign-specific data using the updated view
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
    FROM campaign_analytics_view
    WHERE (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    -- Build final result
    result := jsonb_build_object(
        'overview', overview_data,
        'campaigns', COALESCE(campaigns_data, '[]'::jsonb)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update daily metrics to include starts tracking
CREATE OR REPLACE FUNCTION get_daily_activity_metrics(p_campaign_id UUID DEFAULT NULL, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    campaigns_created INTEGER,
    responses_received INTEGER,
    responses_completed INTEGER,
    interactions INTEGER,
    referral_clicks INTEGER,
    new_users INTEGER,
    onboarding_starts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - (p_days - 1), 
            CURRENT_DATE, 
            '1 day'::interval
        )::date as metric_date
    ),
    daily_stats AS (
        SELECT 
            ds.metric_date,
            COALESCE(cs.campaigns_created, 0) as campaigns_created,
            COALESCE(rs.responses_received, 0) as responses_received,
            COALESCE(rs.responses_completed, 0) as responses_completed,
            COALESCE(is.interactions, 0) as interactions,
            COALESCE(rc.referral_clicks, 0) as referral_clicks,
            COALESCE(uu.new_users, 0) as new_users,
            COALESCE(os.onboarding_starts, 0) as onboarding_starts
        FROM date_series ds
        -- Campaign creation stats
        LEFT JOIN (
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as campaigns_created
            FROM discord_guild_campaigns
            WHERE (p_campaign_id IS NULL OR id = p_campaign_id)
            AND created_at >= CURRENT_DATE - (p_days - 1)
            GROUP BY DATE(created_at)
        ) cs ON ds.metric_date = cs.date
        -- Response stats
        LEFT JOIN (
            SELECT 
                DATE(cor.created_at) as date,
                COUNT(*) as responses_received,
                COUNT(CASE WHEN cor.is_completed = true THEN 1 END) as responses_completed
            FROM campaign_onboarding_responses cor
            WHERE (p_campaign_id IS NULL OR cor.campaign_id = p_campaign_id)
            AND cor.created_at >= CURRENT_DATE - (p_days - 1)
            GROUP BY DATE(cor.created_at)
        ) rs ON ds.metric_date = rs.date
        -- Interaction stats
        LEFT JOIN (
            SELECT 
                DATE(dri.created_at) as date,
                COUNT(*) as interactions
            FROM discord_referral_interactions dri
            WHERE (p_campaign_id IS NULL OR dri.guild_campaign_id = p_campaign_id)
            AND dri.created_at >= CURRENT_DATE - (p_days - 1)
            GROUP BY DATE(dri.created_at)
        ) is ON ds.metric_date = is.date
        -- Referral click stats
        LEFT JOIN (
            SELECT 
                DATE(ra.created_at) as date,
                COUNT(*) as referral_clicks
            FROM referral_analytics ra
            JOIN referral_links rl ON ra.link_id = rl.id
            WHERE (p_campaign_id IS NULL OR rl.campaign_id = p_campaign_id)
            AND ra.created_at >= CURRENT_DATE - (p_days - 1)
            AND ra.event_type = 'click'
            GROUP BY DATE(ra.created_at)
        ) rc ON ds.metric_date = rc.date
        -- Unique users stats
        LEFT JOIN (
            SELECT 
                DATE(cor.created_at) as date,
                COUNT(DISTINCT cor.discord_user_id) as new_users
            FROM campaign_onboarding_responses cor
            WHERE (p_campaign_id IS NULL OR cor.campaign_id = p_campaign_id)
            AND cor.created_at >= CURRENT_DATE - (p_days - 1)
            GROUP BY DATE(cor.created_at)
        ) uu ON ds.metric_date = uu.date
        -- NEW: Onboarding starts stats
        LEFT JOIN (
            SELECT 
                DATE(cos.started_at) as date,
                COUNT(DISTINCT cos.discord_user_id) as onboarding_starts
            FROM campaign_onboarding_starts cos
            WHERE (p_campaign_id IS NULL OR cos.campaign_id = p_campaign_id)
            AND cos.started_at >= CURRENT_DATE - (p_days - 1)
            GROUP BY DATE(cos.started_at)
        ) os ON ds.metric_date = os.date
    )
    SELECT 
        daily_stats.metric_date,
        daily_stats.campaigns_created,
        daily_stats.responses_received,
        daily_stats.responses_completed,
        daily_stats.interactions,
        daily_stats.referral_clicks,
        daily_stats.new_users,
        daily_stats.onboarding_starts
    FROM daily_stats
    ORDER BY daily_stats.metric_date;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON VIEW campaign_onboarding_overview IS 'Updated view using campaign_onboarding_starts for accurate completion rate calculations';
COMMENT ON VIEW campaign_analytics_view IS 'Updated analytics view with fixed completion rate calculation using starts tracking';
COMMENT ON FUNCTION get_comprehensive_analytics_summary IS 'Updated analytics function with accurate completion rates based on onboarding starts';
COMMENT ON FUNCTION get_daily_activity_metrics IS 'Updated daily metrics including onboarding starts tracking';

COMMIT; 