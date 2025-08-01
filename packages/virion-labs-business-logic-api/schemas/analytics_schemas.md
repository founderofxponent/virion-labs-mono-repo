# Analytics Schemas

This document defines the Pydantic schemas for the analytics-related API endpoints, specifically for data exports.

## Onboarding Data Export

These schemas are used for the `POST /analytics/export/onboarding-data` endpoint.

### Request Schema: `OnboardingExportRequest`

This schema defines the expected request body for initiating an onboarding data export.

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class OnboardingExportRequest(BaseModel):
    """
    Defines the request body for exporting campaign onboarding data.
    """
    select_mode: Literal["all", "multiple", "single"] = Field(
        ...,
        description="The selection mode for campaigns."
    )
    campaign_ids: Optional[List[str]] = Field(
        None,
        description="A list of campaign documentIds to export. Required if select_mode is 'multiple' or 'single'."
    )
    file_format: Literal["csv", "json"] = Field(
        "csv",
        description="The desired file format for the export."
    )
    date_range: Literal["7", "30", "90", "365", "all"] = Field(
        "all",
        description="The date range for the data to be exported."
    )
```

### Response Schema: `OnboardingExportResponse`

This schema defines the response from the export endpoint. It provides a secure, temporary URL for the client to download the generated file.

```python
from pydantic import BaseModel
from typing import List
from datetime import datetime

class CampaignExportStats(BaseModel):
    """
    Provides a summary of the data included in the export for a single campaign.
    """
    campaign_id: str
    campaign_name: str
    total_responses: int
    completed_responses: int

class OnboardingExportResponse(BaseModel):
    """
    Defines the successful response for an onboarding data export request.
    """
    download_url: str
    filename: str
    content_type: str
    size_bytes: int
    expires_at: datetime
    campaigns_summary: List[CampaignExportStats]
```

### Frontend (TypeScript) Schemas

For end-to-end type safety, the frontend will use corresponding Zod schemas for validation and TypeScript types for static analysis.

**`OnboardingExportRequest.ts`**
```typescript
import { z } from 'zod';

export const onboardingExportRequestSchema = z.object({
  selectMode: z.enum(['all', 'multiple', 'single']),
  campaignIds: z.array(z.string()).optional(),
  fileFormat: z.enum(['csv', 'json']).default('csv'),
  dateRange: z.enum(['7', '30', '90', '365', 'all']).default('all'),
});

export type OnboardingExportRequest = z.infer<typeof onboardingExportRequestSchema>;
```

**`OnboardingExportResponse.ts`**
```typescript
import { z } from 'zod';

export const campaignExportStatsSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  totalResponses: z.number(),
  completedResponses: z.number(),
});

export const onboardingExportResponseSchema = z.object({
  downloadUrl: z.string().url(),
  filename: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  expiresAt: z.string().datetime(),
  campaignsSummary: z.array(campaignExportStatsSchema),
});

export type OnboardingExportResponse = z.infer<typeof onboardingExportResponseSchema>;