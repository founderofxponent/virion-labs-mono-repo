# Export Data Feature - Implementation Summary

## Overview
The Export Data feature allows administrators and clients to export comprehensive data from the Virion Labs platform in multiple formats. The system uses a **backend file generation** approach for reliable and scalable data exports.

## Implementation Architecture

### Backend File Generation Approach
- **Step 1**: API generates export files server-side and stores them temporarily
- **Step 2**: Frontend receives a download URL and fetches the generated file
- **Benefits**: Better reliability, handles large datasets, proper authentication, automatic cleanup

### Export API Endpoints

#### 1. Generate Export (`/api/analytics/export`)
```typescript
GET /api/analytics/export?exportType=comprehensive&format=csv&dateRange=30

Headers:
Authorization: Bearer {supabase_access_token}

Response:
{
  "success": true,
  "download_url": "/api/analytics/export/download?file=comprehensive_export_all_2024-01-15_abc123.csv",
  "filename": "comprehensive_export_all_2024-01-15_abc123.csv",
  "content_type": "text/csv",
  "size": 1024
}
```

#### 2. Download Export (`/api/analytics/export/download`)
```typescript
GET /api/analytics/export/download?file=comprehensive_export_all_2024-01-15_abc123.csv

Headers:
Authorization: Bearer {supabase_access_token}

Response: File content with appropriate headers
```

## Authentication
- **Frontend**: Uses Supabase session tokens (`session.access_token`)
- **Backend**: Validates tokens using Supabase `auth.getUser()`
- **Role Check**: Requires `admin` or `client` role for access

## Export Types

### 1. Comprehensive Export
**Description**: Complete data export including all available data types
**Includes**:
- Campaign analytics and performance metrics
- Complete onboarding responses and user data
- Referral links, conversions, and earnings data
- User interaction and engagement metrics
- Access requests and form submissions (admin only)

### 2. Onboarding & User Data
**Description**: User responses, completion data, and onboarding analytics
**Includes**:
- All user onboarding form responses
- Completion and start tracking data
- User engagement and progress metrics
- Campaign-specific user data

### 3. Referral System Data
**Description**: Referral links, conversions, earnings, and analytics
**Includes**:
- Referral link performance and statistics
- User conversion and signup data
- Earnings and commission tracking
- Referral analytics and attribution data

### 4. Analytics & Reports
**Description**: Campaign performance metrics and business intelligence
**Includes**:
- Campaign performance summaries
- User engagement metrics
- Conversion rates and completion data
- Daily activity and trend reports

## File Formats

### CSV Format
- **Use Case**: Excel compatibility, business analysis
- **Features**: Multiple data tables in single file, proper escaping
- **Structure**: Sectioned data with clear headers

Example CSV structure:
```csv
=== ONBOARDING RESPONSES ===
Response ID,Campaign Name,Client Name,Discord User ID,Discord Username,Field Key,Field Value,Is Completed,Created At,Updated At
"123","My Campaign","Acme Corp","456789","user123","name","John Doe","Yes","2024-01-15T10:00:00Z","2024-01-15T10:00:00Z"

=== ONBOARDING COMPLETIONS ===
Completion ID,Campaign Name,Client Name,Discord User ID,Discord Username,Guild ID,Completed At
"789","My Campaign","Acme Corp","456789","user123","987654","2024-01-15T10:30:00Z"
```

### JSON Format
- **Use Case**: Developer-friendly, API integration
- **Features**: Structured data with metadata
- **Structure**: Nested objects with clear hierarchy

Example JSON structure:
```json
{
  "generated_at": "2024-01-15T10:00:00Z",
  "export_type": "comprehensive",
  "campaign_id": null,
  "date_range_days": 30,
  "user_role": "admin",
  "analytics": {
    "overview": {...},
    "campaigns": [...]
  },
  "onboarding": {
    "responses": [...],
    "completions": [...],
    "starts": [...],
    "summary": {...}
  },
  "referrals": {
    "referral_links": [...],
    "referrals": [...],
    "analytics": [...],
    "summary": {...}
  }
}
```

## Security Features

### File Security
- **Unique Filenames**: Include timestamp and random ID
- **Filename Validation**: Regex pattern validation to prevent path traversal
- **Automatic Cleanup**: Files deleted after download
- **Temp Directory**: Isolated storage in `/temp/exports/`

### Access Control
- **Authentication Required**: Valid Supabase session token
- **Role-Based Access**: Admin and client roles only
- **Campaign Filtering**: Users only see their accessible data

## Technical Implementation

### Frontend (React/TypeScript)
```typescript
// Get Supabase session
const { data: { session } } = await supabase.auth.getSession()

// Step 1: Generate export
const response = await fetch(`/api/analytics/export?${params}`, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
})

// Step 2: Download file
const downloadResponse = await fetch(result.download_url, {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
})

// Step 3: Trigger browser download
const blob = new Blob([fileContent], { type: result.content_type })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = result.filename
a.click()
```

### Backend (Next.js API Routes)
```typescript
// Generate export file
const tempDir = join(process.cwd(), 'temp', 'exports')
const filePath = join(tempDir, filename)
writeFileSync(filePath, fileContent, 'utf8')

// Return download URL
return NextResponse.json({
  success: true,
  download_url: `/api/analytics/export/download?file=${filename}`,
  filename: filename,
  content_type: contentType,
  size: fileContent.length
})
```

## Error Handling

### Common Error Scenarios
1. **Authentication Failed**: Invalid or expired session token
2. **Access Denied**: Insufficient user role permissions  
3. **File Generation Failed**: Database query errors or file system issues
4. **File Not Found**: Expired or invalid download link
5. **Invalid Parameters**: Missing or malformed request parameters

### Error Response Format
```json
{
  "error": "Authentication required",
  "status": 401
}
```

## Performance Considerations

### Optimization Strategies
- **Server-Side Generation**: Reduces frontend memory usage
- **Streaming**: Large files handled efficiently 
- **Temporary Storage**: Files cleaned up automatically
- **Rate Limiting**: Prevents abuse (can be added via `checkRateLimit`)

### File Size Limits
- **Recommended**: Keep exports under 50MB for optimal performance
- **Large Datasets**: Consider pagination or date range filtering
- **Memory Usage**: Server-side generation reduces browser memory pressure

## Usage Instructions

### For Administrators
1. Navigate to Analytics page
2. Click "Export Data" button
3. Choose "Comprehensive" export type for all data
4. Select desired format (CSV or JSON)
5. Set appropriate date range
6. Click "Export" and wait for download

### For Clients
1. Access available through Analytics page
2. Can export their own campaign data
3. Limited to campaigns they have access to
4. Same interface as administrators

## File Management

### Temporary File Lifecycle
1. **Generation**: File created in `/temp/exports/` with unique name
2. **Download**: File served with appropriate headers
3. **Cleanup**: File automatically deleted after serving
4. **Backup Cleanup**: Cron job can clean up any orphaned files

### Directory Structure
```
temp/
└── exports/
    ├── comprehensive_export_all_2024-01-15_abc123.csv
    ├── onboarding_export_campaign123_2024-01-15_def456.json
    └── referrals_export_all_2024-01-15_ghi789.csv
```

## Future Enhancements

### Potential Improvements
1. **Email Delivery**: Send download links via email for large exports
2. **Scheduled Exports**: Automated recurring exports
3. **Export History**: Track and manage previous exports
4. **Compression**: ZIP files for multiple data types
5. **Real-time Progress**: WebSocket updates for large exports

### Analytics Integration
- **Export Tracking**: Log export activities for audit
- **Usage Analytics**: Track popular export types and formats
- **Performance Metrics**: Monitor export generation times

## Testing

### Manual Testing Steps
1. **Admin Access**: Verify comprehensive data access
2. **Client Access**: Confirm limited data visibility
3. **Format Testing**: Validate both CSV and JSON outputs
4. **Error Scenarios**: Test invalid tokens, missing files
5. **File Cleanup**: Confirm temporary files are removed

### Automated Testing
- **Unit Tests**: Export logic and data formatting
- **Integration Tests**: Full export workflow
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Large dataset handling

---

## Summary

The export feature provides a robust, secure, and scalable solution for data extraction from the Virion Labs platform. The backend file generation approach ensures reliability while maintaining security through proper authentication and file management. The system supports multiple data types and formats to meet diverse user needs. 