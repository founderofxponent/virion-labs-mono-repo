-- Migration: Add Click Count Synchronization
-- Date: 2024-06-26
-- Purpose: Create an RPC function to efficiently and accurately sync click counts.

CREATE OR REPLACE FUNCTION refresh_click_counts_for_influencer(p_influencer_id UUID)
RETURNS JSONB AS $$
DECLARE
    click_counts JSONB;
    updated_link_ids UUID[];
BEGIN
    -- Aggregate the true click counts from the referral_analytics table
    WITH counts AS (
        SELECT
            link_id,
            COUNT(*) as actual_clicks
        FROM referral_analytics
        WHERE event_type = 'click'
        AND link_id IN (SELECT id FROM referral_links WHERE influencer_id = p_influencer_id)
        GROUP BY link_id
    )
    -- Update the referral_links table with the correct counts
    UPDATE referral_links
    SET
        clicks = counts.actual_clicks,
        updated_at = NOW()
    FROM counts
    WHERE
        referral_links.id = counts.link_id
        AND referral_links.influencer_id = p_influencer_id
        AND referral_links.clicks <> counts.actual_clicks
    RETURNING referral_links.id INTO updated_link_ids;

    -- Also, reset the count to 0 for any links that have no clicks
    -- but currently have a non-zero count.
    UPDATE referral_links
    SET
        clicks = 0,
        updated_at = NOW()
    WHERE
        influencer_id = p_influencer_id
        AND clicks > 0
        AND id NOT IN (SELECT link_id FROM referral_analytics WHERE event_type = 'click' AND link_id IS NOT NULL)
    RETURNING referral_links.id INTO updated_link_ids;

    -- Select the data to return
    SELECT jsonb_agg(
        jsonb_build_object(
            'link_id', id,
            'clicks', clicks
        )
    )
    INTO click_counts
    FROM referral_links
    WHERE id = ANY(updated_link_ids);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Click counts refreshed successfully',
        'updated_links_count', COALESCE(array_length(updated_link_ids, 1), 0),
        'details', COALESCE(click_counts, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_click_counts_for_influencer(UUID) IS 'Efficiently recalculates and updates click counts for all links belonging to a specific influencer.'; 