# Analytics Service Design: Onboarding Data Export

This document outlines the design for the new onboarding data export functionality within the `AnalyticsService`.

## New Method: `export_onboarding_data`

A new method, `export_onboarding_data`, will be added to the `AnalyticsService`. This method will be responsible for orchestrating the entire export process.

### Signature

```python
from schemas.analytics_schemas import OnboardingExportRequest, OnboardingExportResponse
from core.auth import StrapiUser

class AnalyticsService:
    # ... existing methods ...

    async def export_onboarding_data(
        self,
        request: OnboardingExportRequest,
        current_user: StrapiUser
    ) -> OnboardingExportResponse:
        """
        Generates a file containing campaign onboarding data and returns a secure
        download link.
        """
        # ... implementation details below ...
```

### Logic and Data Flow

The `export_onboarding_data` method will perform the following steps:

1.  **Authorization Check**:
    *   Verify that the `current_user` has the appropriate role (`admin` or `client`) to perform an export.
    *   If the user is a `client`, ensure they only request data for campaigns associated with their client ID.

2.  **Data Fetching**:
    *   Call a new private method, `_fetch_onboarding_responses`, which will be responsible for querying the `campaign-onboarding-responses` from Strapi.
    *   This method will construct the necessary filters based on the `campaign_ids` and `date_range` from the request.
    *   It will also fetch related campaign and client data to enrich the export.

3.  **Data Processing & File Generation**:
    *   Call another new private method, `_generate_export_file`, which will take the fetched data and the requested `file_format` as input.
    *   This method will handle the transformation of the data into either CSV or JSON format.
    *   It will generate a unique filename for the export.

4.  **File Storage**:
    *   The generated file will be temporarily stored in a secure, private location (e.g., a dedicated directory on the server or a private S3 bucket). This is a critical security consideration to prevent unauthorized access.

5.  **Secure URL Generation**:
    *   A secure, time-limited download URL will be generated for the stored file. This can be a signed URL if using a cloud storage provider, or a unique token-based URL if stored locally.

6.  **Response Formulation**:
    *   The method will construct and return an `OnboardingExportResponse` object, containing the secure download URL, filename, and other metadata.

## Private Helper Methods

### `_fetch_onboarding_responses`

*   **Responsibility**: Fetches raw data from Strapi.
*   **Input**: `campaign_ids: List[str]`, `date_range: str`.
*   **Output**: A list of enriched `CampaignOnboardingResponse` objects.
*   **Details**: This method will perform the necessary joins or population in the Strapi query to include campaign name and client name with each response.

### `_generate_export_file`

*   **Responsibility**: Transforms raw data into the desired file format.
*   **Input**: `data: List[Dict]`, `format: Literal["csv", "json"]`.
*   **Output**: The content of the file as a string or bytes, and the appropriate content type.
*   **Details**:
    *   For CSV, it will flatten the nested JSON data and generate the appropriate headers.
    *   For JSON, it will structure the data in a clean, hierarchical format.

## Error Handling

The service will handle potential errors gracefully, such as:

*   No data found for the given criteria.
*   Failures in fetching data from Strapi.
*   Errors during file generation or storage.

In these cases, it will raise appropriate `HTTPException`s with clear error messages.