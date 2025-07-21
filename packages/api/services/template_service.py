from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
import json

# Generated schemas
from schemas.db.campaign_templates import (
    CampaignTemplate,
    CampaignTemplateCreate,
    CampaignTemplateUpdate
)

# Manual schemas for types not yet generated
from schemas.api.template import (
    CampaignTemplateResponse,
    CampaignTemplateListResponse,
    CampaignTemplateWithLandingPage,
    CampaignTemplateWithLandingPageResponse,
    CampaignTemplateWithLandingPageListResponse,
    LandingPageTemplate,
    LandingPageTemplateCreate,
    LandingPageTemplateUpdate,
    LandingPageTemplateResponse,
    LandingPageTemplateListResponse,
    ApplyTemplateRequest,
    ApplyTemplateResponse,
    OnboardingField
)

def get_campaign_templates(db: Client, include_landing_page: bool = False) -> CampaignTemplateListResponse:
    """
    Get all campaign templates, optionally including landing page data.
    """
    try:
        if include_landing_page:
            # Join with landing page templates
            query = """
            SELECT 
                ct.*,
                lpt.id as lp_id,
                lpt.template_id as lp_template_id,
                lpt.name as lp_name,
                lpt.description as lp_description,
                lpt.category as lp_category,
                lpt.campaign_types as lp_campaign_types,
                lpt.default_offer_title as lp_default_offer_title,
                lpt.default_offer_subtitle as lp_default_offer_subtitle,
                lpt.default_offer_description as lp_default_offer_description,
                lpt.default_cta_text as lp_default_cta_text,
                lpt.default_success_message as lp_default_success_message,
                lpt.customizable_fields as lp_customizable_fields,
                lpt.color_scheme as lp_color_scheme,
                lpt.layout_config as lp_layout_config,
                lpt.is_default as lp_is_default,
                lpt.created_at as lp_created_at,
                lpt.updated_at as lp_updated_at
            FROM campaign_templates ct
            LEFT JOIN landing_page_templates lpt ON ct.default_landing_page_id = lpt.id
            ORDER BY ct.created_at DESC
            """
            
            response = db.rpc('exec_sql', {'sql': query}).execute()
            
            if not response.data:
                return CampaignTemplateWithLandingPageListResponse(
                    success=True,
                    message="No campaign templates found",
                    templates=[],
                    total_count=0
                )
            
            templates = []
            for row in response.data:
                # Build campaign template
                template_data = {
                    "id": row["id"],
                    "campaign_type": row["campaign_type"],
                    "name": row["name"],
                    "description": row["description"],
                    "category": row["category"],
                    "template_config": row["template_config"],
                    "default_landing_page_id": row["default_landing_page_id"],
                    "is_default": row["is_default"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"]
                }
                
                # Build landing page template if exists
                landing_page_template = None
                if row["lp_id"]:
                    landing_page_template = LandingPageTemplate(
                        id=row["lp_id"],
                        template_id=row["lp_template_id"],
                        name=row["lp_name"],
                        description=row["lp_description"],
                        category=row["lp_category"],
                        campaign_types=row["lp_campaign_types"] or [],
                        default_offer_title=row["lp_default_offer_title"],
                        default_offer_subtitle=row["lp_default_offer_subtitle"],
                        default_offer_description=row["lp_default_offer_description"],
                        default_cta_text=row["lp_default_cta_text"],
                        default_success_message=row["lp_default_success_message"],
                        customizable_fields=row["lp_customizable_fields"] or [],
                        color_scheme=row["lp_color_scheme"] or {},
                        layout_config=row["lp_layout_config"] or {},
                        is_default=row["lp_is_default"],
                        created_at=row["lp_created_at"],
                        updated_at=row["lp_updated_at"]
                    )
                
                template_with_lp = CampaignTemplateWithLandingPage(
                    **template_data,
                    landing_page_template=landing_page_template
                )
                templates.append(template_with_lp)
            
            return CampaignTemplateWithLandingPageListResponse(
                success=True,
                message="Campaign templates retrieved successfully",
                templates=templates,
                total_count=len(templates)
            )
        else:
            # Simple query without landing page data
            response = db.table("campaign_templates").select("*").order("created_at", desc=True).execute()
            
            if not response.data:
                return CampaignTemplateListResponse(
                    success=True,
                    message="No campaign templates found",
                    templates=[],
                    total_count=0
                )
            
            templates = []
            for template_data in response.data:
                try:
                    templates.append(CampaignTemplate.model_validate(template_data))
                except Exception as e:
                    print(f"Skipping template due to validation error: {template_data.get('id')}, error: {e}")

            return CampaignTemplateListResponse(
                success=True,
                message="Campaign templates retrieved successfully",
                templates=templates,
                total_count=len(templates)
            )
    
    except Exception as e:
        return CampaignTemplateListResponse(
            success=False,
            message=f"Failed to retrieve campaign templates: {str(e)}",
            templates=[],
            total_count=0
        )

def get_campaign_template_by_id(db: Client, template_id: UUID, include_landing_page: bool = False) -> CampaignTemplateResponse:
    """
    Get a specific campaign template by ID.
    """
    try:
        if include_landing_page:
            # Join with landing page template
            query = """
            SELECT 
                ct.*,
                lpt.id as lp_id,
                lpt.template_id as lp_template_id,
                lpt.name as lp_name,
                lpt.description as lp_description,
                lpt.category as lp_category,
                lpt.campaign_types as lp_campaign_types,
                lpt.default_offer_title as lp_default_offer_title,
                lpt.default_offer_subtitle as lp_default_offer_subtitle,
                lpt.default_offer_description as lp_default_offer_description,
                lpt.default_cta_text as lp_default_cta_text,
                lpt.default_success_message as lp_default_success_message,
                lpt.customizable_fields as lp_customizable_fields,
                lpt.color_scheme as lp_color_scheme,
                lpt.layout_config as lp_layout_config,
                lpt.is_default as lp_is_default,
                lpt.created_at as lp_created_at,
                lpt.updated_at as lp_updated_at
            FROM campaign_templates ct
            LEFT JOIN landing_page_templates lpt ON ct.default_landing_page_id = lpt.id
            WHERE ct.id = $1
            """
            
            response = db.rpc('exec_sql', {'sql': query, 'params': [str(template_id)]}).execute()
            
            if not response.data:
                return CampaignTemplateWithLandingPageResponse(
                    success=False,
                    message="Campaign template not found",
                    template=None
                )
            
            row = response.data[0]
            
            # Build campaign template
            template_data = {
                "id": row["id"],
                "campaign_type": row["campaign_type"],
                "name": row["name"],
                "description": row["description"],
                "category": row["category"],
                "template_config": row["template_config"],
                "default_landing_page_id": row["default_landing_page_id"],
                "is_default": row["is_default"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }
            
            # Build landing page template if exists
            landing_page_template = None
            if row["lp_id"]:
                landing_page_template = LandingPageTemplate(
                    id=row["lp_id"],
                    template_id=row["lp_template_id"],
                    name=row["lp_name"],
                    description=row["lp_description"],
                    category=row["lp_category"],
                    campaign_types=row["lp_campaign_types"] or [],
                    default_offer_title=row["lp_default_offer_title"],
                    default_offer_subtitle=row["lp_default_offer_subtitle"],
                    default_offer_description=row["lp_default_offer_description"],
                    default_cta_text=row["lp_default_cta_text"],
                    default_success_message=row["lp_default_success_message"],
                    customizable_fields=row["lp_customizable_fields"] or [],
                    color_scheme=row["lp_color_scheme"] or {},
                    layout_config=row["lp_layout_config"] or {},
                    is_default=row["lp_is_default"],
                    created_at=row["lp_created_at"],
                    updated_at=row["lp_updated_at"]
                )
            
            template_with_lp = CampaignTemplateWithLandingPage(
                **template_data,
                landing_page_template=landing_page_template
            )
            
            return CampaignTemplateWithLandingPageResponse(
                success=True,
                message="Campaign template retrieved successfully",
                template=template_with_lp
            )
        else:
            # Simple query without landing page data
            response = db.table("campaign_templates").select("*").eq("id", template_id).execute()
            
            if not response.data:
                return CampaignTemplateResponse(
                    success=False,
                    message="Campaign template not found",
                    template=None
                )
            
            template = CampaignTemplate.model_validate(response.data[0])
            
            return CampaignTemplateResponse(
                success=True,
                message="Campaign template retrieved successfully",
                template=template
            )
    
    except Exception as e:
        return CampaignTemplateResponse(
            success=False,
            message=f"Failed to retrieve campaign template: {str(e)}",
            template=None
        )

def create_campaign_template(db: Client, template_data: CampaignTemplateCreate) -> CampaignTemplateResponse:
    """
    Create a new campaign template.
    """
    try:
        template_dict = template_data.model_dump()
        template_dict["id"] = str(uuid4())
        template_dict["created_at"] = datetime.utcnow().isoformat()
        template_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert UUIDs to strings for JSON serialization
        for key, value in template_dict.items():
            if isinstance(value, UUID):
                template_dict[key] = str(value)
        
        response = db.table("campaign_templates").insert(template_dict).execute()
        
        if not response.data:
            return CampaignTemplateResponse(
                success=False,
                message="Failed to create campaign template",
                template=None
            )
        
        template = CampaignTemplate.model_validate(response.data[0])
        
        return CampaignTemplateResponse(
            success=True,
            message="Campaign template created successfully",
            template=template
        )
    
    except Exception as e:
        return CampaignTemplateResponse(
            success=False,
            message=f"Failed to create campaign template: {str(e)}",
            template=None
        )

def update_campaign_template(db: Client, template_id: UUID, template_data: CampaignTemplateUpdate) -> CampaignTemplateResponse:
    """
    Update an existing campaign template.
    """
    try:
        updates = {k: v for k, v in template_data.model_dump().items() if v is not None}
        updates["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert UUIDs to strings for JSON serialization
        for key, value in updates.items():
            if isinstance(value, UUID):
                updates[key] = str(value)
        
        response = db.table("campaign_templates").update(updates).eq("id", template_id).execute()
        
        if not response.data:
            return CampaignTemplateResponse(
                success=False,
                message="Campaign template not found",
                template=None
            )
        
        template = CampaignTemplate.model_validate(response.data[0])
        
        return CampaignTemplateResponse(
            success=True,
            message="Campaign template updated successfully",
            template=template
        )
    
    except Exception as e:
        return CampaignTemplateResponse(
            success=False,
            message=f"Failed to update campaign template: {str(e)}",
            template=None
        )

def delete_campaign_template(db: Client, template_id: UUID) -> CampaignTemplateResponse:
    """
    Delete a campaign template.
    """
    try:
        response = db.table("campaign_templates").delete().eq("id", template_id).execute()
        
        if not response.data:
            return CampaignTemplateResponse(
                success=False,
                message="Campaign template not found",
                template=None
            )
        
        return CampaignTemplateResponse(
            success=True,
            message="Campaign template deleted successfully",
            template=None
        )
    
    except Exception as e:
        return CampaignTemplateResponse(
            success=False,
            message=f"Failed to delete campaign template: {str(e)}",
            template=None
        )

def get_landing_page_templates(db: Client) -> LandingPageTemplateListResponse:
    """
    Get all landing page templates.
    """
    try:
        response = db.table("landing_page_templates").select("*").order("created_at", desc=True).execute()
        
        if not response.data:
            return LandingPageTemplateListResponse(
                success=True,
                message="No landing page templates found",
                templates=[],
                total_count=0
            )
        
        templates = [LandingPageTemplate.model_validate(template) for template in response.data]
        
        return LandingPageTemplateListResponse(
            success=True,
            message="Landing page templates retrieved successfully",
            templates=templates,
            total_count=len(templates)
        )
    
    except Exception as e:
        return LandingPageTemplateListResponse(
            success=False,
            message=f"Failed to retrieve landing page templates: {str(e)}",
            templates=[],
            total_count=0
        )

def apply_template_to_campaign(db: Client, request: ApplyTemplateRequest) -> ApplyTemplateResponse:
    """
    Apply a campaign template to a specific campaign.
    """
    try:
        # Get the template
        template_response = db.table("campaign_templates").select("*").eq("id", request.template_id).execute()
        
        if not template_response.data:
            return ApplyTemplateResponse(
                success=False,
                message="Campaign template not found",
                applied_fields=None,
                campaign_id=None
            )
        
        template = template_response.data[0]
        template_config = template.get("template_config", {})
        onboarding_fields = template_config.get("onboarding_fields", [])
        
        # Override with custom fields if provided
        if request.override_fields:
            onboarding_fields = [field.model_dump() for field in request.override_fields]
        
        # Apply template to campaign by updating campaign_onboarding_fields
        # First, delete existing fields for this campaign
        db.table("campaign_onboarding_fields").delete().eq("campaign_id", request.campaign_id).execute()
        
        # Insert new fields
        fields_to_insert = []
        for field in onboarding_fields:
            field_record = {
                "id": str(uuid4()),
                "campaign_id": str(request.campaign_id),
                "field_type": field.get("type", "text"),
                "field_label": field.get("question", ""),
                "field_placeholder": field.get("placeholder", ""),
                "is_required": field.get("required", True),
                "field_options": field.get("validation", {}).get("options", []),
                "validation_rules": field.get("validation", {}),
                "discord_integration": field.get("discord_integration", {}),
                "field_order": field.get("order", 0),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            fields_to_insert.append(field_record)
        
        if fields_to_insert:
            db.table("campaign_onboarding_fields").insert(fields_to_insert).execute()
        
        # Update campaign with template configuration
        campaign_updates = {
            "template": template.get("campaign_type"),
            "bot_name": template_config.get("bot_config", {}).get("bot_name", "Virion Bot"),
            "bot_personality": template_config.get("bot_config", {}).get("bot_personality", "helpful"),
            "bot_response_style": template_config.get("bot_config", {}).get("bot_response_style", "friendly"),
            "welcome_message": template_config.get("bot_config", {}).get("welcome_message"),
            "features": template_config.get("bot_config", {}).get("features", {}),
            "response_templates": template_config.get("bot_config", {}).get("response_templates", {}),
            "onboarding_completion_requirements": template_config.get("bot_config", {}).get("onboarding_completion_requirements", {}),
            "auto_role_assignment": template_config.get("bot_config", {}).get("auto_role_assignment", False),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Apply custom config if provided
        if request.custom_config:
            campaign_updates.update(request.custom_config)
        
        # Update the campaign
        db.table("discord_guild_campaigns").update(campaign_updates).eq("id", request.campaign_id).execute()
        
        # Convert back to OnboardingField objects for response
        applied_fields = [OnboardingField.model_validate(field) for field in onboarding_fields]
        
        return ApplyTemplateResponse(
            success=True,
            message="Template applied to campaign successfully",
            applied_fields=applied_fields,
            campaign_id=request.campaign_id
        )
    
    except Exception as e:
        return ApplyTemplateResponse(
            success=False,
            message=f"Failed to apply template to campaign: {str(e)}",
            applied_fields=None,
            campaign_id=None
        )