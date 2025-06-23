# Supabase Query Fix for Campaign Context

## Issue Found
The campaign context was not showing in the success modal when creating referral links from the links page. The Supabase query was failing with error PGRST201 due to ambiguous relationship references.

## Root Cause
Supabase returned error PGRST201 because there are multiple relationships between `referral_links` and `discord_guild_campaigns`:

1. `discord_guild_campaigns_referral_link_id_fkey` (one-to-many)
2. `referral_links_campaign_id_fkey` (many-to-one)

When using a generic join syntax, Supabase couldn't determine which relationship to use.

## Error Message
```
Could not embed because more than one relationship was found for 'referral_links' and 'discord_guild_campaigns'
```

## Fix Applied
Updated both `fetchLinks` and `addLink` functions in `hooks/use-referral-links.ts` to use the correct specific foreign key reference:

**Before (incorrect):**
```typescript
campaign:discord_guild_campaigns(...)
```

**After (correct):**
```typescript
campaign:discord_guild_campaigns!referral_links_campaign_id_fkey(
  id,
  campaign_name,
  campaign_type,
  client:clients(name)
)
```

## Expected Result
Now when creating a referral link from the links page with a campaign selected:
1. The Supabase query correctly joins the campaign data using the many-to-one relationship
2. The `addLink` function returns complete campaign information
3. The success modal receives proper `campaignName` and `clientName` props
4. The blue campaign context card displays correctly

## Technical Notes
- We use `referral_links_campaign_id_fkey` because we want the many-to-one relationship (a referral link belongs to a campaign)
- The `!` syntax explicitly specifies which foreign key relationship to use when multiple relationships exist
- Both `fetchLinks` and `addLink` now use consistent query syntax
- All builds pass successfully with no TypeScript errors

## Testing Steps
1. Go to the links page
2. Create a new referral link
3. Select a campaign from the dropdown (not "Independent Link")
4. Submit the form
5. Verify that the success modal shows the blue campaign context card with campaign name and client name 