-- Migration: Fix Conversion Count Synchronization
-- Date: 2024-06-26
-- Purpose: Create an RPC function to efficiently and accurately sync conversion counts.

CREATE OR REPLACE FUNCTION refresh_conversion_counts_for_influencer(p_influencer_id UUID)
RETURNS JSONB AS $$
DECLARE
    conversion_counts JSONB;
    updated_link_ids UUID[];
BEGIN
    -- Aggregate the true conversion counts from the referrals table
    WITH counts AS (
        SELECT
            referral_link_id,
            COUNT(*) as actual_conversions
        FROM referrals
        WHERE influencer_id = p_influencer_id
        AND referral_link_id IS NOT NULL
        GROUP BY referral_link_id
    )
    -- Update the referral_links table with the correct counts
    UPDATE referral_links
    SET
        conversions = counts.actual_conversions,
        updated_at = NOW()
    FROM counts
    WHERE
        referral_links.id = counts.referral_link_id
        AND referral_links.influencer_id = p_influencer_id
        -- Only update rows where the count is different to avoid unnecessary writes
        AND referral_links.conversions <> counts.actual_conversions
    RETURNING referral_links.id INTO updated_link_ids;

    -- Also, reset the count to 0 for any links that have no conversions
    -- but currently have a non-zero count.
    UPDATE referral_links
    SET
        conversions = 0,
        updated_at = NOW()
    WHERE
        influencer_id = p_influencer_id
        AND conversions > 0
        AND id NOT IN (SELECT referral_link_id FROM referrals WHERE influencer_id = p_influencer_id AND referral_link_id IS NOT NULL)
    RETURNING referral_links.id INTO updated_link_ids;


    -- Select the data to return
    SELECT jsonb_agg(
        jsonb_build_object(
            'link_id', id,
            'conversions', conversions
        )
    )
    INTO conversion_counts
    FROM referral_links
    WHERE id = ANY(updated_link_ids);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Conversion counts refreshed successfully',
        'updated_links_count', COALESCE(array_length(updated_link_ids, 1), 0),
        'details', COALESCE(conversion_counts, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_conversion_counts_for_influencer(UUID) IS 'Efficiently recalculates and updates conversion counts for all links belonging to a specific influencer.'; 