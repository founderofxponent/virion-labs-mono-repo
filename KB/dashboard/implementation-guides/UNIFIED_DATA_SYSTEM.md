# Unified Data Loading System

## Overview

The new unified data loading system replaces the previous role-specific data hooks with a single, simplified approach that works for all user roles (influencer, admin, client). This system removes backend limitations and provides a consistent data loading experience.

## Key Features

### 🎯 **Unified Data Structure**
- Single data format that adapts to any user role
- Consistent API across all components
- Simplified state management

### 🔄 **Error Handling and Retry**
- Graceful error reporting when backend is unavailable or data fetching fails.
- Automatic retries for transient network errors.
- Clear user feedback about data loading issues.

### 🚀 **Performance Optimized**
- Single hook instead of multiple role-specific hooks
- Efficient data fetching with proper abort handling
- Reduced API calls and improved caching

### 🛡️ **Backend Limitation Handling**
- Detects JWT, permission, and rate limit errors.
- Displays clear error messages to the user.
- No longer automatically switches to fallback/demo data for these issues.

## Architecture

### Core Components

1. **`useUnifiedData`** - Main data loading hook
2. **`UnifiedDashboard`** - Single dashboard component for all roles
3. **Data Transformers** - Convert raw data to unified format

### Data Flow

```
User Login → Role Detection → Unified Data Hook → Backend API
                                      ↓
                              Error Detection/Retry → Error Message Displayed to User
                                      ↓
                              Unified Dashboard → Role-Specific UI (or error state)
```

## Usage

### Basic Implementation

```tsx
import { useUnifiedData } from "@/hooks/use-unified-data"
import { UnifiedDashboard } from "@/components/unified-dashboard"

function Dashboard() {
  return <UnifiedDashboard />
}
```

### Advanced Usage

```tsx
import { useUnifiedData } from "@/hooks/use-unified-data"

function CustomComponent() {
  const { data, loading, error, refetch } = useUnifiedData()
  
  if (loading) return <Loading />
  if (error) return <Error error={error} />
  
  return (
    <div>
      <DataDisplay data={data} />
    </div>
  )
}
```

## Data Structure

### UnifiedData Interface

```typescript
interface UnifiedData {
  stats: UnifiedStats           // 4 key metrics with labels
  primaryList: UnifiedListItem[] // Main data list (links/clients/campaigns)
  secondaryList: UnifiedListItem[] // Secondary data (referrals/bots/influencers)
  recentActivity: UnifiedActivity[] // Recent actions/events
  metadata: {
    role: string
    permissions: string[]
    lastUpdated: string
  }
}
```

### Role-Specific Adaptations

#### Influencer Role
- **Stats**: Clicks, Conversions, Earnings, Active Links
- **Primary List**: Referral Links
- **Secondary List**: Recent Referrals
- **Activity**: User signups and purchases

#### Admin Role
- **Stats**: Clients, Bots, Users, Active Bots
- **Primary List**: Client Management
- **Secondary List**: Bot Status
- **Activity**: System events and deployments

#### Client Role
- **Stats**: Campaigns, Influencers, Conversions, Revenue
- **Primary List**: Campaign Performance
- **Secondary List**: Top Influencers
- **Activity**: Conversion events

## Error Handling

### Backend Limitations
The system automatically detects and handles:
- JWT authentication errors
- Permission/authorization issues
- Rate limiting
- Quota exceeded errors
- Network timeouts

### Error Strategy (Replaces Fallback Strategy)
1. **Detect Error Type**: Classify as backend limitation, network error, or timeout.
2. **Display Error**: Show a user-friendly error message.
3. **Retry Logic**: Automatic retries for network errors. If retries fail, an error is shown.
4. **User Feedback**: Clear indication of data loading failure and advice (e.g., try again, contact support).

### Demo Mode (Behavior Changed)
- The explicit "Demo Mode" triggered by backend issues and prolonged loads (using `useDataFallback`) has been removed.
- If any demo/sample data is to be shown, it would be part of a specific error recovery path, not the default for backend issues.
- The primary approach is to show an error if actual data cannot be loaded.

## Migration Guide

### From Old System
The old role-specific hooks are now deprecated:
- `useDashboardData` → `useUnifiedData`
- `useAdminData` → `useUnifiedData`
- `useClientData` → `useUnifiedData`

### Component Updates
Replace role-specific dashboard components:
- `InfluencerDashboard` → `UnifiedDashboard`
- `AdminDashboard` → `UnifiedDashboard`
- `ClientDashboard` → `UnifiedDashboard`