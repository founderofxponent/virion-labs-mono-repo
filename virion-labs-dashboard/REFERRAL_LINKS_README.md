# Referral Links System

This document describes the complete implementation of the referral links system for influencers in the Virion Labs Dashboard.

## Overview

The referral links system allows influencers to:
- Create and manage referral links for their content
- Track clicks, conversions, and earnings
- View detailed analytics and performance metrics
- Organize links by platform and status

## Database Schema

### Tables Created

#### 1. `referral_links`
Stores the main referral link data:
- `id` (UUID, Primary Key)
- `influencer_id` (UUID, Foreign Key to auth.users)
- `title` (TEXT, Required)
- `description` (TEXT, Optional)
- `platform` (TEXT, Required - YouTube, Instagram, TikTok, etc.)
- `original_url` (TEXT, Required)
- `referral_code` (TEXT, Unique)
- `referral_url` (TEXT, Generated)
- `thumbnail_url` (TEXT, Optional)
- `clicks` (INTEGER, Default 0)
- `conversions` (INTEGER, Default 0)
- `earnings` (DECIMAL, Default 0.00)
- `conversion_rate` (DECIMAL, Computed)
- `is_active` (BOOLEAN, Default true)
- `expires_at` (TIMESTAMP, Optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### 2. `referral_analytics`
Stores detailed analytics for each click and conversion:
- `id` (UUID, Primary Key)
- `link_id` (UUID, Foreign Key to referral_links)
- `event_type` (TEXT - 'click' or 'conversion')
- `user_agent` (TEXT)
- `ip_address` (INET)
- `referrer` (TEXT)
- `country` (TEXT)
- `city` (TEXT)
- `device_type` (TEXT)
- `browser` (TEXT)
- `conversion_value` (DECIMAL)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

## Backend Implementation

### API Routes

#### 1. `/api/referral/[code]/route.ts`
Handles referral link redirects and click tracking:
- **Method**: GET
- **Purpose**: Redirects users to original URL while tracking analytics
- **Features**:
  - Validates referral code and link status
  - Checks expiration dates
  - Records click analytics (device, browser, referrer)
  - Updates click count
  - Redirects to original URL

#### 2. `/api/referral/conversion/route.ts`
Records conversion events:
- **Method**: POST
- **Purpose**: Track when a referral results in a conversion
- **Body**:
  ```json
  {
    "referral_code": "string",
    "conversion_value": "number",
    "metadata": "object"
  }
  ```
- **Features**:
  - Validates referral code
  - Records conversion analytics
  - Updates conversion count and earnings

### Custom Hooks

#### `useReferralLinks()`
Provides complete CRUD operations for referral links:
- `fetchLinks()` - Load all links for current user
- `addLink(data)` - Create new referral link
- `updateLink(id, updates)` - Update existing link
- `deleteLink(id)` - Delete link
- `toggleLinkStatus(id)` - Activate/deactivate link
- `getAnalyticsSummary()` - Get aggregated statistics

## Frontend Components

### 1. `LinksPage`
Main page component featuring:
- Analytics summary cards (total links, clicks, conversions, earnings)
- Search and filtering capabilities
- Link management (create, edit, delete, toggle status)
- Responsive grid layout
- Real-time data updates

### 2. `ReferralLinkForm`
Form component for creating/editing links:
- Form validation with Zod schema
- Platform selection
- URL validation
- Optional expiration dates
- Thumbnail URL support
- Active/inactive toggle

### 3. `ReferralAnalytics`
Detailed analytics component:
- Time range selection (7d, 30d, 90d)
- Interactive charts (clicks/conversions over time)
- Device and browser breakdowns
- Top referrers analysis
- Recent activity feed

### 4. `LinkCard`
Individual link display component:
- Link preview with thumbnail
- Performance metrics
- Quick actions (copy, edit, delete, toggle)
- Status indicators

## Features

### Link Management
- **Create Links**: Generate unique referral codes and URLs
- **Edit Links**: Update title, description, platform, etc.
- **Delete Links**: Remove links with confirmation
- **Toggle Status**: Activate/deactivate links
- **Bulk Operations**: Filter and sort multiple links

### Analytics & Tracking
- **Click Tracking**: Automatic tracking of all link clicks
- **Conversion Tracking**: API endpoint for recording conversions
- **Device Analytics**: Mobile vs desktop breakdown
- **Browser Analytics**: Browser usage statistics
- **Referrer Tracking**: Source of traffic analysis
- **Geographic Data**: Country/city tracking (when available)

### Performance Metrics
- **Click Count**: Total number of clicks per link
- **Conversion Count**: Number of successful conversions
- **Conversion Rate**: Percentage of clicks that convert
- **Earnings**: Total revenue from conversions
- **Time-based Analytics**: Performance over different time periods

### User Experience
- **Search & Filter**: Find links by title, platform, or status
- **Sorting**: Order by date, clicks, conversions, or conversion rate
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live data without page refresh
- **Copy to Clipboard**: Easy link sharing

## Usage Examples

### Creating a Referral Link
```typescript
const { addLink } = useReferralLinks()

const newLink = await addLink({
  title: "Summer Collection Review",
  description: "My honest review of the new summer collection",
  platform: "YouTube",
  original_url: "https://example.com/product",
  thumbnail_url: "https://example.com/thumbnail.jpg",
  is_active: true,
  expires_at: "2024-12-31T23:59:59Z"
})
```

### Recording a Conversion
```javascript
fetch('/api/referral/conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    referral_code: 'summer-collection-abc123',
    conversion_value: 25.99,
    metadata: { product_id: '12345', order_id: 'ORD-789' }
  })
})
```

### Using Analytics Component
```tsx
import { ReferralAnalytics } from '@/components/referral-analytics'

function LinkDetailsPage({ linkId }) {
  return (
    <div>
      <h1>Link Analytics</h1>
      <ReferralAnalytics linkId={linkId} />
    </div>
  )
}
```

## Security Considerations

- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Prevention**: Using Supabase parameterized queries
- **Rate Limiting**: Consider implementing rate limiting for API endpoints
- **User Authentication**: Links tied to authenticated users only
- **Data Privacy**: IP addresses and user agents stored securely

## Performance Optimizations

- **Database Indexes**: Created on frequently queried columns
- **Computed Columns**: Conversion rate calculated at database level
- **Efficient Queries**: Optimized for common use cases
- **Client-side Caching**: React state management for UI responsiveness
- **Lazy Loading**: Analytics loaded on demand

## Future Enhancements

- **QR Code Generation**: Generate QR codes for links
- **A/B Testing**: Support for multiple link variants
- **Advanced Analytics**: Geographic heatmaps, time-of-day analysis
- **Bulk Import/Export**: CSV import/export functionality
- **Link Scheduling**: Automatic activation/deactivation
- **Custom Domains**: Support for branded short URLs
- **Webhook Integration**: Real-time notifications for conversions

## Troubleshooting

### Common Issues

1. **Links not redirecting**: Check if link is active and not expired
2. **Analytics not recording**: Verify API endpoints are accessible
3. **Conversion tracking fails**: Ensure referral_code is valid
4. **Performance issues**: Check database indexes and query optimization

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG_REFERRALS=true
LOG_LEVEL=debug
```

## API Documentation

### GET `/api/referral/[code]`
Redirect and track referral link click.

**Parameters:**
- `code` (string): The referral code

**Response:**
- Redirects to original URL
- Records analytics in background

### POST `/api/referral/conversion`
Record a conversion event.

**Body:**
```json
{
  "referral_code": "string (required)",
  "conversion_value": "number (optional, default: 0)",
  "metadata": "object (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversion recorded successfully",
  "data": {
    "link_id": "uuid",
    "conversions": "number",
    "earnings": "number",
    "conversion_value": "number"
  }
}
```

## Database Migrations

The system includes two main migrations:

1. **create_referral_links_table**: Creates the main referral_links table
2. **create_referral_analytics_table**: Creates the analytics tracking table

Both migrations include proper indexes, constraints, and RLS policies for security. 