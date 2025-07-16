-- Migration: Fix Conversion Count Synchronization
-- Date: 2024-06-26
-- Purpose: Create an RPC function to efficiently and accurately sync conversion counts.

CREATE OR REPLACE FUNCTION refresh_conversion_counts_for_influencer(p_influencer_id UUID)
RETURNS JSONB AS $$
DECLARE
    conversion_counts JSONB;
BEGIN
    -- Use a Common Table Expression (CTE) for clarity and correctness
    WITH updated_links AS (
        -- First, calculate the correct counts from the source of truth
        WITH true_counts AS (
            SELECT
                referral_link_id,
                COUNT(*) as actual_conversions
            FROM referrals
            WHERE influencer_id = p_influencer_id
            GROUP BY referral_link_id
        )
        -- Update the referral_links table
        UPDATE referral_links
        SET conversions = COALESCE(true_counts.actual_conversions, 0)
        FROM true_counts
        WHERE
            referral_links.id = true_counts.referral_link_id
            AND referral_links.influencer_id = p_influencer_id
        RETURNING referral_links.id, referral_links.conversions
    )
    -- Select the aggregated data to return
    SELECT jsonb_agg(
        jsonb_build_object(
            'link_id', id,
            'conversions', conversions
        )
    )
    INTO conversion_counts
    FROM updated_links;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Conversion counts refreshed successfully',
        'details', COALESCE(conversion_counts, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_conversion_counts_for_influencer(UUID) IS 'Efficiently recalculates and updates conversion counts for all links belonging to a specific influencer.'; 