# Referral Link Tracking Implementation

This document explains the newly implemented referral link tracking system that fixes the "zero data" issue in the influencer metrics dashboard.

## Problem Solved

The dashboard was showing "0 data" for influencer metrics because while the analytics API was correctly calculating sums, the underlying data for clicks, conversions, and earnings was never being updated in Strapi. The API was always summing zeros.

## Solution Overview

A comprehensive tracking system has been implemented with the following components:

### 1. Tracking API Endpoints (`/api/v1/tracking/`)

- **`POST /api/v1/tracking/click/{referral_code}`** - Tracks clicks on referral links
- **`GET /api/v1/tracking/r/{referral_code}`** - Redirect endpoint with automatic click tracking
- **`POST /api/v1/tracking/conversion/{referral_code}`** - Tracks conversions with specific referral code
- **`POST /api/v1/tracking/conversion`** - Tracks conversions using cookie-based attribution
- **`GET /api/v1/tracking/stats/{referral_code}`** - Gets current stats for a referral link

### 2. Automatic Conversion Tracking

The onboarding service now automatically tracks conversions when users complete onboarding flows that are associated with referral links.

### 3. Cookie-Based Attribution

When users click referral links via the redirect endpoint, a tracking cookie is set for 30 days to enable conversion attribution even if the conversion happens later.

## Implementation Details

### Database Schema Updates

The referral link tracking fields in Strapi have been mapped to the API schemas:
- `clicks` - Total number of clicks on the referral link
- `conversions` - Total number of conversions attributed to the link
- `earnings` - Total earnings from conversions
- `last_conversion_at` - Timestamp of the most recent conversion

### Tracking Flow

#### For Clicks:
1. User clicks a referral link: `https://yourdomain.com/r/{referral_code}`
2. API finds the referral link by code
3. Increments the `clicks` counter
4. Sets a tracking cookie with the referral code
5. Redirects user to the target URL

#### For Conversions:
1. **Manual Tracking**: Call `POST /api/v1/tracking/conversion/{referral_code}` with conversion data
2. **Cookie-Based**: Call `POST /api/v1/tracking/conversion` (reads referral code from cookie)
3. **Automatic**: Happens when onboarding is completed with an associated referral link

### API Usage Examples

#### Track a Click
```bash
curl -X POST "http://localhost:8000/api/v1/tracking/click/abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1",
    "referrer": "https://twitter.com"
  }'
```

#### Track a Conversion
```bash
curl -X POST "http://localhost:8000/api/v1/tracking/conversion/abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "conversion_value": 25.00,
    "conversion_type": "signup"
  }'
```

#### Get Referral Stats
```bash
curl "http://localhost:8000/api/v1/tracking/stats/abc123"
```

### Response Format

All tracking endpoints return a `TrackingResponse`:

```json
{
  "success": true,
  "message": "Click tracked successfully for referral code abc123",
  "clicks": 15,
  "conversions": 3,
  "earnings": 75.00
}
```

## Integration Instructions

### 1. Frontend Integration

Update your referral link generation to use the tracking redirect:

```javascript
// Old way
const referralUrl = `https://target-site.com?ref=${referralCode}`;

// New way (with tracking)
const referralUrl = `https://your-api.com/api/v1/tracking/r/${referralCode}`;
```

### 2. Conversion Tracking

Add conversion tracking to your onboarding completion:

```javascript
// When user completes signup/onboarding
await fetch('/api/v1/tracking/conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversion_value: 10.00,
    conversion_type: 'signup'
  })
});
```

### 3. Custom Campaign Values

The default conversion value is $10.00. To customize this per campaign, modify the `_track_conversion_if_applicable` method in `services/onboarding_service.py`.

## Testing

Run the test script to validate the implementation:

```bash
cd /path/to/virion-labs-business-logic-api
python3 test_tracking.py
```

## Monitoring

Track the following metrics to ensure the system is working:

1. **Click Tracking**: Monitor that clicks are being incremented
2. **Conversion Tracking**: Verify conversions are attributed correctly
3. **Dashboard Metrics**: Check that the influencer dashboard now shows real data
4. **API Logs**: Watch for tracking-related log entries

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **Validation**: Referral codes are validated against the database
3. **Privacy**: IP addresses and user agents are optionally collected
4. **CORS**: Ensure CORS settings allow tracking calls from your frontend

## Troubleshooting

### Dashboard Still Shows Zero Data

1. Verify referral links exist in Strapi with valid referral codes
2. Check that tracking endpoints are being called successfully
3. Confirm the API can connect to Strapi
4. Look for error logs in the API console

### Tracking Not Working

1. Ensure the tracking router is properly registered in `main.py`
2. Check that the database schema includes the tracking fields
3. Verify network connectivity between services
4. Test with the provided test script

### Conversions Not Tracking

1. Check if the onboarding completion includes `referral_link_id`
2. Verify the referral link exists in the database
3. Look for conversion tracking logs in the API
4. Test manual conversion tracking endpoints