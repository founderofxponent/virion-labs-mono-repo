# Avatar Upload and API Key Management Implementation

## Overview

This document describes the implementation of avatar upload functionality and real API key management for the Virion Labs Dashboard settings page.

## Features Implemented

### 1. Avatar Upload Functionality

#### Files Created/Modified:
- `lib/avatar-upload.ts` - Core avatar upload logic
- `components/ui/file-upload.tsx` - Reusable file upload component
- `hooks/use-user-settings.ts` - Added avatar upload method
- `components/settings-page.tsx` - Updated ProfileSettings component

#### Functionality:
- **File Validation**: Supports JPEG, PNG, WebP, and GIF formats (max 5MB)
- **Supabase Storage**: Uses dedicated 'avatars' bucket with proper RLS policies
- **Auto-cleanup**: Removes old avatars when uploading new ones
- **Error Handling**: Comprehensive error messages and user feedback
- **Loading States**: Visual feedback during upload process

#### Storage Structure:
```
avatars/
├── {user_id}/
│   └── avatar-{timestamp}.{ext}
```

#### RLS Policies:
- Public read access for avatar images
- Users can only upload/update/delete their own avatars
- Folder-based isolation using user ID

### 2. API Key Management

#### Files Created/Modified:
- `lib/api-keys.ts` - API key generation utilities
- `hooks/use-user-settings.ts` - Added API key regeneration method
- `components/settings-page.tsx` - Updated ApiSettings component
- `lib/supabase.ts` - Added API key fields to TypeScript types

#### Database Changes:
```sql
-- Added to user_settings table
ALTER TABLE user_settings 
ADD COLUMN api_key TEXT,
ADD COLUMN api_key_test TEXT;
```

#### Functionality:
- **Key Generation**: Secure 32-character random strings with proper prefixes
- **Live/Test Keys**: Separate keys for production and testing
- **Copy to Clipboard**: One-click copying with visual feedback
- **Show/Hide**: Toggle visibility for security
- **Regeneration**: Generate new keys with timestamp tracking
- **Database Integration**: Keys stored securely in user_settings table

## Security Considerations

### Avatar Upload:
1. **File Type Validation**: Only allows safe image formats
2. **Size Limits**: 5MB maximum file size
3. **RLS Policies**: Users can only access their own avatars
4. **Path Sanitization**: Uses Supabase's built-in path handling

### API Keys:
1. **Secure Generation**: Uses crypto-strong random number generation
2. **Proper Prefixes**: `sk_live_` and `sk_test_` for easy identification
3. **No Exposure**: Keys are hidden by default in UI
4. **Regeneration Tracking**: Timestamps for audit trails

## Usage Examples

### Avatar Upload:
```typescript
const { uploadUserAvatar } = useUserSettings()

const handleFileUpload = async (file: File) => {
  const result = await uploadUserAvatar(file)
  if (result.success) {
    // Handle success
  } else {
    // Handle error: result.error
  }
}
```

### API Key Management:
```typescript
const { regenerateApiKeys, settings } = useUserSettings()

const handleRegenerate = async () => {
  const keys = await regenerateApiKeys()
  if (keys) {
    console.log('Live key:', keys.liveKey)
    console.log('Test key:', keys.testKey)
  }
}

// Access current keys
const liveKey = settings?.api_key
const testKey = settings?.api_key_test
```

## Database Schema Updates

### Storage Bucket:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

### User Settings Table:
```sql
-- New columns added
api_key TEXT NULL
api_key_test TEXT NULL
api_key_regenerated_at TIMESTAMP WITH TIME ZONE NULL (existing)
```

## Error Handling

### Avatar Upload Errors:
- Invalid file type
- File size too large
- Upload failure
- Profile update failure
- Network errors

### API Key Errors:
- Generation failure
- Database update failure
- Copy to clipboard failure

## Testing

### Avatar Upload:
1. Test various file formats (JPEG, PNG, WebP, GIF)
2. Test file size limits (should reject >5MB)
3. Test invalid file types (should reject)
4. Test upload progress and error states
5. Test avatar replacement (old avatar cleanup)

### API Keys:
1. Test key generation for new users
2. Test key regeneration for existing users
3. Test copy to clipboard functionality
4. Test show/hide key visibility
5. Test database persistence

## Future Enhancements

1. **Avatar Cropping**: Add image cropping before upload
2. **Multiple Formats**: Support for additional image formats
3. **Key Scoping**: Add scoped permissions for API keys
4. **Usage Analytics**: Track API key usage
5. **Rate Limiting**: Implement rate limiting for key generation
6. **Webhook Integration**: Real-time notifications for key changes 