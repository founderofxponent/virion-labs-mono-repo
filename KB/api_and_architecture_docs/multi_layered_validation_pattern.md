# Multi-Layered Validation Pattern

This document outlines the "Three-Model" approach for robust, end-to-end data validation in the `business-logic-api`. This pattern ensures data integrity at every layer of the application, from the API endpoint to the persistence layer, making the system more reliable and easier to debug.

## The Problem: Validation Blind Spots

When passing generic dictionaries (`Dict[str, Any]`) between application layers, we create "validation blind spots." A validation error at the database level can be difficult to trace back to its origin, as any layer could have introduced the invalid data. This leads to brittle code and time-consuming debugging sessions.

## The Solution: The "Three-Model" Approach

The solution is to enforce a clear, validated data contract at every layer by using distinct Pydantic models for each layer's responsibility.

1.  **API Models (`schemas/operation_schemas.py`):**
    *   **Purpose:** Define the public contract of your API.
    *   **Responsibility:** Used by FastAPI for request validation and response shaping. They should be tailored to the needs of the API consumer.

2.  **Service/Domain Models (`domain/.../schemas.py`):**
    *   **Purpose:** Represent the data structures needed for your core business logic.
    *   **Responsibility:** Used exclusively within the service layer. They are the canonical representation of data for a specific business operation.

3.  **Data/Persistence Models (`schemas/strapi.py`):**
    *   **Purpose:** A 1-to-1 representation of your persistence layer's schema (e.g., a Strapi content type).
    *   **Responsibility:** Ensure that any data being sent to or received from the persistence layer is perfectly aligned with its schema. For update operations, it's best to have a separate model (e.g., `Strapi...Update`) with all optional fields to handle partial updates.

### How it Works: The Data Flow

The data flows from the API layer to the persistence layer, being validated and transformed at each step.

```mermaid
graph TD
    subgraph Router Layer
        A[API Request with JSON] --> B(API Model);
    end

    subgraph Service Layer
        C(Service Model);
    end

    subgraph Strapi Client Layer
        D(Data Model);
    end

    subgraph Strapi API
        E[Strapi Database];
    end

    B --> |map_api_to_service()| C;
    C --> |map_service_to_data()| D;
    D --> |strapi_client.update()| E;
```

**Example: `update_campaign_landing_page`**

1.  **Router (`routers/operations.py`):**
    *   The endpoint receives the request and validates it using the `CampaignLandingPageUpdateRequest` API model.
    *   It then maps the API model to the `CampaignLandingPageUpdate` service model and passes it to the service.

2.  **Service (`services/campaign_service.py`):**
    *   The service receives the strongly-typed `CampaignLandingPageUpdate` object.
    *   It performs any necessary business logic, such as converting a string `documentId` for a campaign into a numeric `id`.
    *   It then maps the result to the `StrapiCampaignLandingPageUpdate` data model and passes it to the `strapi_client`.

3.  **Strapi Client (`core/strapi_client.py`):**
    *   The `strapi_client` receives the `StrapiCampaignLandingPageUpdate` object.
    *   It can now be confident that the data is in the correct format to be sent to the Strapi API.

### Benefits

*   **Catch Errors Early:** Validation errors are caught at the exact layer where the data becomes invalid, making them easy to fix.
*   **Clear Responsibility:** Each layer has a single, well-defined responsibility.
*   **Easy Debugging:** Tracebacks point directly to the source of the problem.
*   **Confidence in Refactoring:** Changes to one layer's data model will immediately highlight any necessary changes in adjacent layers.

By consistently applying this pattern, we can build a more robust, maintainable, and developer-friendly API.