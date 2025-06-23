# Referrals System Documentation

## Overview

The referrals system allows influencers to track users who sign up through their referral links. It provides comprehensive management of referral data, status tracking, and analytics integration.

## Database Schema

### `referrals` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `influencer_id` | UUID | Foreign key to auth.users |
| `referral_link_id` | UUID | Foreign key to referral_links |
| `referred_user_id` | UUID | Optional foreign key to auth.users (if user creates account) |
| `name` | TEXT | Full name of the referred user |
| `email` | TEXT | Email address of the referred user |
| `discord_id` | TEXT | Optional Discord username/ID |
| `age` | INTEGER | Optional age of the referred user |
| `status` | TEXT | Current status: 'pending', 'active', 'completed', 'inactive' |
| `source_platform` | TEXT | Platform where the referral originated |
| `conversion_value` | DECIMAL | Monetary value from this referral |
| `metadata` | JSONB | Additional data (signup source, interests, etc.) |
| `created_at` | TIMESTAMP | When the referral was created |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Relationships

- `influencer_id` → `auth.users(id)`
- `referral_link_id` → `referral_links(id)`
- `referred_user_id` → `auth.users(id)` (optional)

### Indexes

- `idx_referrals_influencer_id` on `influencer_id`
- `idx_referrals_link_id` on `referral_link_id`
- `idx_referrals_status` on `status`
- `idx_referrals_created_at` on `created_at`

## API Endpoints

### POST `/api/referral/signup`

Creates a new referral when someone signs up through a referral link.

**Request Body:**
```json
{
  "referral_code": "gaming-setup-ghi789",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "discord_id": "johndoe#1234",
  "age": 25,
  "user_agent": "Mozilla/5.0...",
  "ip_address": "192.168.1.100"
}
```

**Response:**
```json
{
  "success": true,
  "referral_id": "uuid",
  "message": "Referral signup successful"
}
```

**Features:**
- Validates referral code exists and is active
- Checks link expiration
- Prevents duplicate email registrations per influencer
- Creates referral record with 'pending' status
- Tracks signup as conversion in analytics
- Updates referral link conversion count

## Frontend Components

### `useReferrals` Hook

Custom hook for managing referrals data with the following features:

**Functions:**
- `fetchReferrals()` - Loads referrals with link information
- `updateReferralStatus(id, status)` - Updates referral status
- `deleteReferral(id)` - Removes a referral
- `getReferralsSummary()` - Calculates summary statistics
- `formatDate(dateString)` - Formats dates consistently

**State:**
- `referrals` - Array of referrals with link data
- `loading` - Loading state
- `error` - Error message if any

**Summary Statistics:**
- Total referrals count
- Active/completed/pending counts
- Total earnings
- Conversion rate
- Top platform
- Platform breakdown
- Average age

### `ReferralsPage` Component

Main dashboard for managing referrals with:

**Features:**
- Real-time summary cards showing key metrics
- Search by name or email
- Filter by source platform and status
- Sort by date, name, or earnings
- Status management (pending → active → completed)
- Bulk actions and individual referral management
- CSV export functionality
- Delete confirmation dialogs

**Status Management:**
- **Pending**: Initial signup, awaiting activation
- **Active**: User is engaged and active
- **Completed**: User has made a purchase/conversion
- **Inactive**: User is no longer active

## Integration with Referral Links

The referrals system is tightly integrated with the referral links system:

1. **Link Tracking**: Each referral is linked to the specific referral link used
2. **Analytics**: Referral signups are tracked as conversions in `referral_analytics`
3. **Metrics**: Link conversion counts are automatically updated
4. **Platform Consistency**: Source platform matches the link platform

## Usage Examples

### Creating a Referral via API

```javascript
const response = await fetch('/api/referral/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    referral_code: 'gaming-setup-ghi789',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    discord_id: 'janesmith#5678',
    age: 28
  })
})

const result = await response.json()
```

### Using the Referrals Hook

```javascript
import { useReferrals } from '@/hooks/use-referrals'

function MyComponent() {
  const {
    referrals,
    loading,
    updateReferralStatus,
    getReferralsSummary
  } = useReferrals()

  const summary = getReferralsSummary()
  
  const handleStatusChange = async (referralId, newStatus) => {
    const result = await updateReferralStatus(referralId, newStatus)
    if (result.error) {
      console.error('Failed to update status:', result.error)
    }
  }

  // Component JSX...
}
```

## Security Features

### Row Level Security (RLS)

All referrals operations are protected by RLS policies:

- Users can only view their own referrals
- Users can only create referrals for their own links
- Users can only update/delete their own referrals

### Data Validation

- Required fields validation (referral_code, name, email)
- Email uniqueness per influencer
- Referral link validation (active, not expired)
- Status enum validation

## Performance Considerations

### Database Optimization

- Proper indexing on frequently queried columns
- Efficient joins with referral_links table
- JSONB metadata for flexible additional data

### Frontend Optimization

- Efficient filtering and sorting in memory
- Optimistic updates for status changes
- Proper loading states and error handling

## Test Data

The system includes comprehensive test data with:

- 18 referrals across different platforms
- Various statuses (pending, active, completed, inactive)
- Realistic user information and metadata
- Linked to existing referral links
- Recent timestamps for testing

## Future Enhancements

Potential improvements to consider:

1. **Automated Status Transitions**: Rules for automatic status updates
2. **Referral Tiers**: Multi-level referral tracking
3. **Custom Fields**: Configurable additional data fields
4. **Bulk Operations**: Mass status updates and imports
5. **Advanced Analytics**: Cohort analysis and retention metrics
6. **Notifications**: Email/Discord notifications for new referrals
7. **Referral Rewards**: Automated reward calculation and distribution

## Troubleshooting

### Common Issues

1. **Referral not created**: Check referral code validity and link status
2. **Duplicate email error**: Email already exists for this influencer
3. **Permission denied**: Ensure proper authentication and RLS policies
4. **Missing link data**: Verify referral_link relationship is properly joined

### Debug Queries

```sql
-- Check referral with link information
SELECT r.*, rl.title, rl.platform 
FROM referrals r 
JOIN referral_links rl ON r.referral_link_id = rl.id 
WHERE r.id = 'referral-uuid';

-- Check referral summary for influencer
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  SUM(conversion_value) as total_earnings
FROM referrals 
WHERE influencer_id = 'influencer-uuid';
``` 