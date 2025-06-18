# Event-Driven Client Influencer Count Implementation

## Overview

Implemented an event-driven system to automatically maintain accurate influencer counts for clients in the `clients.influencers` field. This fixes the issue where counts were manually maintained and always showed `0` despite having active influencers.

## Problem Solved

**Before:**
- `clients.influencers` field was manually maintained and always showed `0`
- **Reality**: Adidas had 2 influencers, Rumble Royal had 1+ influencers
- No automatic updates when influencers created/deleted referral links

**After:**
- Automatic real-time updates when influencers join/leave client campaigns
- Accurate counts: Adidas shows 2, Rumble Royal shows 1
- Event-driven architecture ensures data consistency

## Implementation Details

### 1. Client Helper Functions (`lib/client-helpers.ts`)

Created utility functions to manage influencer count calculations:

- `calculateClientInfluencerCount(clientId)` - Counts unique influencers for a client
- `updateClientInfluencerCount(clientId)` - Updates stored count in database
- `batchUpdateClientInfluencerCounts(clientIds)` - Bulk update for multiple clients
- `getClientsNeedingCountUpdate()` - Get all clients with campaigns

### 2. Referral Link Operations (`hooks/use-referral-links.ts`)

Enhanced `addLink()` and `deleteLink()` functions to:

**On Link Creation:**
1. Create referral link
2. Automatically update client influencer count
3. Update local state

**On Link Deletion:**
1. Get campaign/client info before deletion
2. Delete referral link
3. Automatically update client influencer count
4. Update local state

### 3. Campaign Access Operations (`app/api/admin/access-requests/route.ts`)

Enhanced access request approval/denial to:
1. Process access request (approve/deny)
2. Automatically update client influencer count
3. Return response

### 4. Database Migration

Applied migration `sync_client_influencer_counts` to sync existing data:

```sql
UPDATE clients 
SET influencers = (
  SELECT COUNT(DISTINCT rl.influencer_id)
  FROM referral_links rl
  JOIN discord_guild_campaigns dgc ON rl.campaign_id = dgc.id
  WHERE dgc.client_id = clients.id 
    AND rl.is_active = true
    AND (dgc.is_deleted IS NOT TRUE OR dgc.is_deleted IS NULL)
),
updated_at = NOW()
```

### 5. Real-time Updates (`hooks/use-clients.ts`)

Added Supabase real-time subscription to automatically refresh client data when influencer counts change.

## Event Trigger Points

The influencer count automatically updates when:

1. **Referral Link Created** - New influencer joins client campaign
2. **Referral Link Deleted** - Influencer leaves client campaign  
3. **Campaign Access Granted** - Admin approves influencer access
4. **Campaign Access Revoked** - Admin denies/removes access

## Data Flow

```
Influencer Action → Database Change → Count Calculation → Client Update → Frontend Refresh
```

1. Influencer creates/deletes referral link
2. System calculates unique influencers for affected client
3. Updates `clients.influencers` field
4. Real-time subscription triggers frontend refresh
5. Dashboard shows accurate, live counts

## Results

**Migration Results:**
- Adidas: 0 → 2 influencers ✅
- Rumble Royal: 0 → 1 influencer ✅
- Other clients: Remain 0 (correct) ✅

**Verification Query:**
```sql
SELECT 
  c.name, 
  c.influencers as stored_count,
  COUNT(DISTINCT rl.influencer_id) as actual_count
FROM clients c 
LEFT JOIN discord_guild_campaigns dgc ON c.id = dgc.client_id 
LEFT JOIN referral_links rl ON dgc.id = rl.campaign_id AND rl.is_active = true
GROUP BY c.id, c.name, c.influencers 
ORDER BY c.influencers DESC;
```

## Benefits

✅ **Always Accurate** - Counts update immediately when relationships change  
✅ **Real-time** - Dashboard shows live data via Supabase subscriptions  
✅ **Performance** - No expensive JOINs on dashboard loads  
✅ **Fault-tolerant** - Count updates don't break main operations if they fail  
✅ **Maintainable** - Clear event-driven architecture  
✅ **Automated** - No manual maintenance required

## Frontend Impact

The frontend continues to work exactly as before:
- `useClients()` hook fetches the same data
- Client components display the same fields
- No breaking changes to existing UI

The only difference is that `client.influencers` now shows accurate, real-time data instead of always being `0`.

## Monitoring

Console logs added for debugging:
- "Updated influencer count for client after adding referral link"
- "Updated influencer count for client after deleting referral link"  
- "Updated influencer count for client after approving/denying access request"

## Schema Documentation Updated

Updated `SUPABASE_DATABASE_SCHEMA.md` to reflect that `clients.influencers` is now automatically maintained via the event-driven system. 