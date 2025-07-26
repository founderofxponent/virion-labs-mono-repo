# Dashboard API Migration Guide

This guide documents the process, issues, and solutions encountered when migrating the clients pages from direct Supabase calls to the unified business logic API.

## Overview

The migration involved updating the dashboard frontend to use the new business logic API at `localhost:8000` instead of direct Supabase calls at `localhost:8001`. This ensures consistent business logic, proper authorization, and better error handling.

## Key Issues and Solutions

### 1. Authentication Token Access

**Issue**: The `useAuth()` context didn't expose a `token` property that the API calls required.

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'token')
```

**Solution**: 
- Changed from accessing non-existent `token` in useAuth context to directly getting token from localStorage
- Updated from `const { token } = useAuth()` to `const getToken = () => localStorage.getItem('auth_token')`

**Code Fix**:
```typescript
// Before (❌)
const { token } = useAuth()

// After (✅)
const getToken = () => localStorage.getItem('auth_token')
const token = getToken()
```

### 2. API Endpoint Mismatch

**Issue**: Initially assumed the API was running on port 8001 (old operations API) instead of port 8000 (new business logic API).

**Solution**: Updated all API calls to use `localhost:8000` instead of `localhost:8001`.

### 3. Data Structure Mismatch

**Issue**: The new API returns nested data structure while the UI expected flat structure.

**API Response Structure**:
```typescript
// API returns
interface ApiClient {
  id: number;
  attributes: {
    name: string;
    industry: string;
    client_status: string;
    // ... other fields
  };
}

// UI expects
interface Client {
  id: number;
  name: string;
  industry: string;
  status: string;
  // ... other fields
}
```

**Solution**: Created a `transformApiClient` function to flatten the nested structure.

**Code Fix**:
```typescript
const transformApiClient = (apiClient: ApiClient): Client => {
  return {
    id: apiClient.id,
    documentId: apiClient.documentId,
    ...apiClient.attributes,
    status: apiClient.attributes.client_status, // Map client_status to status
  }
}
```

### 4. ID Format Incompatibility (Major Issue)

**Issue**: Strapi v5 uses `documentId` (string like `s0zccr1xie1jnb8cyhqgqo1n`) for API operations, but the frontend uses numeric IDs for navigation and references.

**Errors**:
```
404 Not Found - Client error '404 Not Found' for url 'http://localhost:1337/api/clients/8'
```

**Root Cause**: Frontend was passing numeric ID (8) to API, but Strapi v5 requires documentId for CRUD operations.

**Solution**: Implemented multi-approach lookup system:

#### Backend Fix (client_service.py):
```python
# Approach 1: Try as documentId directly
try:
    client_attrs = await strapi_client.get_client(document_id)
except Exception as e:
    # Approach 2: Search by numeric ID
    all_clients = await strapi_client.get_clients()
    for client in all_clients:
        if str(client.get("id")) == document_id:
            client_attrs = client
            actual_document_id = client.get("documentId")
            break
```

#### Frontend Optimization:
- Extended Client interface to include `documentId?: string`
- Updated navigation to use `client.documentId || client.id`
- Modified API calls to prefer documentId when available
- Updated all CRUD operations to use documentId

### 5. Infinite Re-render Loop

**Issue**: useEffect dependencies causing infinite re-render in client details page.

**Error**: Browser becoming unresponsive due to infinite API calls.

**Solution**: 
- Removed unstable dependencies from useEffect
- Added eslint-disable comment for deliberate dependency omission

**Code Fix**:
```typescript
useEffect(() => {
  fetchClient()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [clientId]) // Only depend on clientId, not getClientById function
```

### 6. Missing API Method Parameters

**Issue**: StrapiClient.get_client() method didn't support populate parameter, causing flexible API calls to fail.

**Solution**: Added optional populate parameter support.

**Code Fix**:
```python
async def get_client(self, document_id: str, populate: Optional[List[str]] = None) -> Dict:
    params = {}
    if populate:
        params["populate"] = ",".join(populate)
    response = await self._request("GET", f"clients/{document_id}", params=params)
    return response.get("data")
```

### 7. Invalid Field Population

**Issue**: API tried to populate "owner" field that doesn't exist in Strapi schema.

**Error**: 400 Bad Request due to invalid populate field.

**Solution**: Removed invalid populate calls and only populated existing fields.

## Implementation Steps

### Phase 1: Basic API Connection
1. Update API endpoint URLs
2. Fix authentication token access
3. Update data transformation

### Phase 2: Handle Data Structure Differences
1. Create transformation functions
2. Update interfaces to match API response
3. Handle nested vs flat data structures

### Phase 3: Resolve ID Compatibility
1. Implement dual ID support (numeric + documentId)
2. Add multi-approach lookup on backend
3. Optimize frontend to prefer documentId

### Phase 4: Performance Optimization
1. Reduce unnecessary API calls
2. Use documentId for direct API access
3. Cache documentId from responses

## Best Practices for Future Migrations

### 1. Authentication
- Always verify token access method before starting migration
- Use direct localStorage access if auth context doesn't expose tokens
- Test authentication flow early in migration process

### 2. Data Structure Analysis
- Compare API response structure with UI expectations
- Create transformation functions for structure mismatches
- Update TypeScript interfaces to match both API and UI needs

### 3. ID Management Strategy
- Understand the ID system of both old and new APIs
- Implement fallback strategies for ID format differences
- Prefer using primary identifiers from the new system
- Keep backwards compatibility during transition

### 4. Error Handling
- Implement comprehensive error logging
- Add fallback mechanisms for ID lookups
- Test edge cases (missing data, malformed IDs, etc.)

### 5. Testing Approach
- Test each CRUD operation independently
- Verify navigation flows work correctly
- Test edit/save workflows thoroughly
- Verify data consistency after operations

## Common Gotchas

1. **Don't assume ID formats are compatible** - Always check if the new API uses different ID systems
2. **Verify authentication methods** - Auth context might not expose what you expect
3. **Check API response structures** - Nested vs flat data can break UI components
4. **Test infinite loops** - useEffect dependencies can cause render loops
5. **Validate field names** - API field names might differ from UI expectations (`client_status` vs `status`)

## Migration Checklist

- [ ] Update API endpoint URLs
- [ ] Fix authentication token access
- [ ] Create data transformation functions
- [ ] Update TypeScript interfaces
- [ ] Handle ID format differences
- [ ] Implement error handling and fallbacks
- [ ] Test all CRUD operations
- [ ] Verify navigation flows
- [ ] Test edit/save workflows
- [ ] Check for infinite render loops
- [ ] Validate field mappings
- [ ] Test with real data scenarios

## Files Typically Modified

### Frontend
- `hooks/use-[entity].ts` - Main API integration logic
- `components/[entity]-page.tsx` - List page component
- `components/[entity]-detail-page.tsx` - Detail page component
- Navigation components that link to entity pages

### Backend
- `services/[entity]_service.py` - Business logic layer
- `core/strapi_client.py` - Strapi API client methods
- `routers/operations.py` - API endpoints

## Performance Considerations

- Use documentId for direct API access when available
- Cache identifier mappings to reduce lookup calls
- Implement efficient fallback strategies
- Monitor API call frequency and optimize where possible

## Conclusion

The key to successful migration is understanding the ID systems, data structures, and authentication methods of both the old and new APIs. Always implement fallback strategies and thoroughly test CRUD operations and navigation flows.