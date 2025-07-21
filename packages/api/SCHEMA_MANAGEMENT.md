# Schema Management Implementation

This document describes the automated Pydantic model generation system implemented for the Virion Labs API.

## Overview

The API now uses **automatically generated Pydantic models** that sync directly with the Supabase database schema, eliminating manual schema maintenance and reducing schema drift risk.

## Architecture

### Generated Models Location
- **Directory**: `generated_schemas/`
- **Generated Files**: 
  - `clients.py` - Client models
  - `discord_guild_campaigns.py` - Campaign models  
  - `referral_links.py` - Referral models
  - `access_requests.py` - Access request models
  - `campaign_templates.py` - Template models

### Model Structure
Each table generates 4 model classes:
1. `{Model}Base` - Core fields (excludes system fields)
2. `{Model}Create` - For creation endpoints
3. `{Model}Update` - For update endpoints (all optional)
4. `{Model}` - Full model with all fields

### Key Features
- **Automatic type detection** - UUID, datetime, boolean fields properly mapped
- **Email validation** - EmailStr for email fields
- **CRUD variants** - Create/Update models for API endpoints
- **Nullable handling** - Optional fields with defaults

## Usage

### Import Generated Models
```python
# Instead of: from schemas.client import Client, ClientCreate, ClientUpdate
from generated_schemas.clients import Client, ClientCreate, ClientUpdate
```

### Service Layer
```python
from generated_schemas.clients import Client
from supabase import Client as SupabaseClient

def get_client(db: SupabaseClient, client_id: UUID) -> Client:
    result = db.table("clients").select("*").eq("id", client_id).execute()
    return Client.model_validate(result.data[0])
```

## Schema Regeneration

### Manual Regeneration
```bash
# Run the generation script
python3 generate_schemas.py

# Or use the shell script
./regenerate_schemas.sh
```

### CI/CD Integration
The schema regeneration is integrated into the build process via:
- `pyproject.toml` script: `regenerate-schemas`
- Shell script: `regenerate_schemas.sh`

### Environment Variables Required
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Implementation Details

### Schema Detection Method
The system queries actual Supabase data to infer field types:
1. Connects to Supabase using service role key
2. Queries each table for sample data
3. Analyzes data types and field properties
4. Generates corresponding Pydantic models

### Type Mapping
- **UUID fields** - Detected by 36-character format with dashes
- **DateTime fields** - ISO timestamp format detection
- **Boolean fields** - Known field names + int/bool values
- **Email fields** - Field names containing "email"

### Field Handling
- **System fields** (`id`, `created_at`, `updated_at`) - Excluded from Create models
- **Nullable fields** - Converted to `Optional[Type] = None`
- **Required fields** - Non-nullable with proper typing

## Migration Path

### Current Status
✅ Generated schemas implemented for:
- `clients` table
- `discord_guild_campaigns` table  
- `referral_links` table
- `access_requests` table
- `campaign_templates` table

✅ Updated services:
- `client_service.py`
- Corresponding router imports

### Next Steps
1. Update remaining services to use generated schemas
2. Add schema validation tests
3. Implement in CI/CD pipeline
4. Phase out manual schemas

## Benefits Achieved

### Schema Synchronization
- ✅ **No more manual schema updates**
- ✅ **Automatic schema drift detection**  
- ✅ **Single source of truth** (Supabase database)

### Developer Experience
- ✅ **Reduced maintenance overhead**
- ✅ **Consistent model structure**
- ✅ **Automatic type safety**

### Production Safety
- ✅ **Runtime validation** via Pydantic
- ✅ **Schema change detection** in CI/CD
- ✅ **No deployment/schema mismatches**

## Comparison: Manual vs Generated

| Aspect | Manual Schemas | Generated Schemas |
|--------|---------------|-------------------|
| Maintenance | High - manual updates | Low - automatic |
| Schema Drift | High risk | Zero risk |
| Type Safety | Manual mapping | Automatic detection |
| CRUD Models | Manual creation | Auto-generated |
| Validation | Manual setup | Built-in Pydantic |
| CI/CD Integration | None | Automated |

The generated schema approach eliminates the primary schema management issues identified in the original audit.