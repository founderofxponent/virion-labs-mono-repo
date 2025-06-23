# Secure API Key Implementation with Hashing

## Overview

The API keys are now **properly hashed** using bcrypt with a salt rounds of 12, providing enterprise-level security for API key storage and verification.

## Security Features

### ✅ **Bcrypt Hashing**
- **Salt Rounds**: 12 (high security)
- **One-way hashing**: Keys cannot be reversed from hash
- **Unique salts**: Each key gets a unique salt
- **Time-resistant**: Designed to resist brute force attacks

### ✅ **Secure Storage**
- API keys are **never stored in plain text**
- Only hashed versions are stored in database
- Original keys are only shown once during generation
- No way to retrieve original keys after generation

### ✅ **Secure Display**
- Keys are masked with `sk_live_••••••••••••••••••••••••••••` pattern
- Original keys only shown immediately after generation
- Dismissible notification prevents accidental exposure
- Copy-to-clipboard functionality for easy use

## Implementation Details

### Key Generation Process

1. **Generate Random Key**: 32-character secure random string
2. **Add Prefix**: `sk_live_` or `sk_test_` prefix
3. **Hash Key**: Use bcrypt with 12 salt rounds
4. **Store Hash**: Only hash is stored in database
5. **Return Original**: Original key returned to user once

```typescript
// Generate and hash API keys
const liveKey = generateApiKey('sk_live')     // sk_live_AbC123...
const hashedKey = await hashApiKey(liveKey)   // $2b$12$hash...
// Store hashedKey in database, return liveKey to user
```

### Key Verification Process

```typescript
// When API request comes in
const apiKey = "sk_live_AbC123..." // From Authorization header
const hashedKey = "$2b$12$hash..." // From database

const isValid = await verifyApiKey(apiKey, hashedKey)
if (isValid) {
  // Allow API access
} else {
  // Reject request
}
```

## API Usage Examples

### Basic API Authentication

```bash
curl -H "Authorization: Bearer sk_live_AbC123..." \
     https://api.virionlabs.com/v1/referrals
```

### Node.js/JavaScript

```javascript
const apiKey = 'sk_live_AbC123...'

const response = await fetch('https://api.virionlabs.com/v1/referrals', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
})
```

### Python

```python
import requests

api_key = 'sk_live_AbC123...'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.virionlabs.com/v1/referrals', headers=headers)
```

## Backend Integration

### API Route Protection

```typescript
// app/api/v1/referrals/route.ts
import { requireApiKey } from '@/lib/api-auth'

export async function GET(request: Request) {
  // Validate API key
  const auth = await requireApiKey(request)
  
  if (!auth.valid) {
    return Response.json(
      { error: auth.error }, 
      { status: 401 }
    )
  }

  // API key is valid, proceed with request
  const userId = auth.userId
  const keyType = auth.keyType // 'live' or 'test'
  
  // Your API logic here...
}
```

### Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireApiKey(request)
  
  if (!auth.valid) {
    return Response.json({ error: auth.error }, { status: 401 })
  }

  // Check rate limit (100 requests per hour)
  if (!checkRateLimit(auth.userId!, 100, 3600000)) {
    return Response.json(
      { error: 'Rate limit exceeded' }, 
      { status: 429 }
    )
  }

  // Process request...
}
```

## Security Benefits

### 🔒 **Hash Security**
- **Bcrypt**: Industry standard for password/key hashing
- **Salt Rounds 12**: ~250ms computation time per hash
- **Rainbow Table Resistant**: Unique salts prevent precomputed attacks
- **Future Proof**: Salt rounds can be increased as hardware improves

### 🔒 **Storage Security**
- **No Plain Text**: Keys never stored in recoverable form
- **Database Breach Protection**: Stolen database doesn't expose working keys
- **Audit Trail**: Key regeneration timestamps tracked
- **Clean Rotation**: Old keys immediately invalidated on regeneration

### 🔒 **Usage Security**
- **Bearer Token**: Standard OAuth 2.0 pattern
- **HTTPS Only**: Keys transmitted securely
- **Rate Limiting**: Prevents abuse
- **Prefix Validation**: `sk_live_` and `sk_test_` format enforcement

## Migration from Previous Version

If you had any plain text API keys from the previous implementation, they would need to be regenerated as the hashing is not backwards compatible. However, since no keys existed in the current database, no migration is needed.

## Key Management Best Practices

### For Users
1. **Copy Keys Immediately**: Keys are only shown once during generation
2. **Store Securely**: Use environment variables or secure key management
3. **Rotate Regularly**: Regenerate keys periodically
4. **Use Test Keys**: Use test keys for development/testing
5. **Monitor Usage**: Watch for unexpected API calls

### For Developers
1. **Environment Variables**: Never hardcode keys in source code
2. **Different Keys**: Use test keys for development, live keys for production
3. **Error Handling**: Handle 401/403 responses gracefully
4. **Rate Limiting**: Respect rate limits to avoid blocking
5. **HTTPS Only**: Never send keys over unencrypted connections

## Example Environment Setup

```bash
# .env.local
VIRION_API_KEY_LIVE=sk_live_AbC123...
VIRION_API_KEY_TEST=sk_test_XyZ789...
```

```javascript
// config.js
const config = {
  apiKey: process.env.NODE_ENV === 'production' 
    ? process.env.VIRION_API_KEY_LIVE
    : process.env.VIRION_API_KEY_TEST
}
```

## Performance Considerations

- **Hashing Time**: ~250ms per bcrypt operation
- **Caching**: Consider caching valid keys for performance
- **Rate Limiting**: Prevents brute force attempts
- **Database Queries**: Optimized to check only relevant keys

## Testing the Implementation

```bash
# Test key generation (should work)
curl -X POST /api/user/regenerate-keys \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"

# Test API authentication (should work with valid key)
curl -H "Authorization: Bearer sk_live_AbC123..." \
  /api/v1/test

# Test invalid key (should fail)
curl -H "Authorization: Bearer sk_live_invalid" \
  /api/v1/test
``` 