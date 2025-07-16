-- Migration: Add Click Count Synchronization
-- Date: 2024-06-26
-- Purpose: Create an RPC function to efficiently and accurately sync click counts.

CREATE OR REPLACE FUNCTION refresh_click_counts_for_influencer(p_influencer_id UUID)
RETURNS JSONB AS $$
DECLARE
    click_counts JSONB;
BEGIN
    -- Use a Common Table Expression (CTE) for clarity and correctness
    WITH updated_links AS (
        -- First, calculate the correct counts from the source of truth
        WITH true_counts AS (
            SELECT
                link_id,
                COUNT(*) as actual_clicks
            FROM referral_analytics
            WHERE event_type = 'click'
            GROUP BY link_id
        )
        -- Update the referral_links table
        UPDATE referral_links
        SET clicks = COALESCE(true_counts.actual_clicks, 0)
        FROM true_counts
        WHERE
            referral_links.id = true_counts.link_id
            AND referral_links.influencer_id = p_influencer_id
        RETURNING referral_links.id, referral_links.clicks
    )
    -- Select the aggregated data to return
    SELECT jsonb_agg(
        jsonb_build_object(
            'link_id', id,
            'clicks', clicks
        )
    )
    INTO click_counts
    FROM updated_links;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Click counts refreshed successfully',
        'details', COALESCE(click_counts, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_click_counts_for_influencer(UUID) IS 'Efficiently recalculates and updates click counts for all links belonging to a specific influencer.'; 