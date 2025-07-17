from supabase import Client
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import secrets
import json
import csv
import os

# In-memory cache for export records (for demo purposes)
# In production, this would be stored in a database table
_export_cache = {}

from schemas.campaign import (
    DiscordGuildCampaign, 
    DiscordGuildCampaignCreate, 
    DiscordGuildCampaignUpdate,
    Campaign, 
    CampaignAccessRequest, 
    ReferralLink, 
    ReferralLinkCreate,
    DataExportRequest,
    DataExportResponse,
    DataExport,
    DataExportStatus,
    ExportType
)

def get_available_campaigns(db: Client, user_id: Optional[UUID]) -> List[DiscordGuildCampaign]:
    """
    Get campaigns available to a user.
    If user_id is None, returns all active campaigns.
    """
    query = db.table("discord_guild_campaigns").select("*").eq("is_active", True).eq("is_deleted", False)
    
    # In the future, we can add user-specific logic here
    # if user_id:
    #     query = query.eq("some_user_column", user_id)

    response = query.execute()

    if response.data:
        return [DiscordGuildCampaign.model_validate(campaign) for campaign in response.data]
    return []

def get_campaign_by_id(db: Client, campaign_id: UUID) -> DiscordGuildCampaign:
    """
    Get campaign by ID.
    """
    response = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def create_campaign(db: Client, campaign_data: DiscordGuildCampaignCreate) -> DiscordGuildCampaign:
    """
    Create a new campaign.
    """
    campaign_record = {
        **campaign_data.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("discord_guild_campaigns").insert(campaign_record).execute()
    if not response.data:
        raise Exception("Failed to create campaign")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def update_campaign(db: Client, campaign_id: UUID, campaign_data: DiscordGuildCampaignUpdate) -> DiscordGuildCampaign:
    """
    Update campaign details.
    """
    # Remove None values
    updates = {k: v for k, v in campaign_data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def delete_campaign(db: Client, campaign_id: UUID) -> None:
    """
    Soft delete a campaign.
    """
    updates = {
        "is_deleted": True,
        "deleted_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")

def set_campaign_status(db: Client, campaign_id: UUID, is_active: bool) -> DiscordGuildCampaign:
    """
    Set campaign active status.
    """
    updates = {
        "is_active": is_active,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if not is_active:
        updates["paused_at"] = datetime.utcnow().isoformat()
    else:
        updates["paused_at"] = None
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def update_campaign_stats(db: Client, campaign_id: UUID, stats: dict) -> DiscordGuildCampaign:
    """
    Update campaign statistics.
    """
    updates = {
        **stats,
        "updated_at": datetime.utcnow().isoformat(),
        "last_activity_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def request_campaign_access(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID, 
    request_data: CampaignAccessRequest
) -> dict:
    """
    Request access to a campaign.
    """
    # Check if campaign exists
    campaign_response = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    # Check if user already has access request
    existing_request = db.table("campaign_influencer_access").select("*").eq("campaign_id", campaign_id).eq("influencer_id", user_id).execute()
    if existing_request.data:
        raise ValueError("Access request already exists")
    
    # Create access request
    request_record = {
        "campaign_id": campaign_id,
        "influencer_id": user_id,
        "request_message": request_data.reason,
        "admin_response": request_data.additional_info,
        "request_status": "pending",
        "requested_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("campaign_influencer_access").insert(request_record).execute()
    if not response.data:
        raise Exception("Failed to create access request")
    
    return {"message": "Access request submitted successfully"}

def create_referral_link(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID, 
    link_data: ReferralLinkCreate
) -> ReferralLink:
    """
    Create a referral link for a campaign.
    """
    # Check if campaign exists
    campaign_response = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    # Generate unique referral code if not provided
    if not link_data.referral_code:
        code = secrets.token_urlsafe(8)
        
        # Ensure code is unique
        while True:
            existing_link = db.table("referral_links").select("*").eq("referral_code", code).execute()
            if not existing_link.data:
                break
            code = secrets.token_urlsafe(8)
        
        link_data.referral_code = code
    
    link_record = {
        **link_data.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("referral_links").insert(link_record).execute()
    if not response.data:
        raise Exception("Failed to create referral link")
    
    return ReferralLink.model_validate(response.data[0])

def get_campaign_referral_links(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID
) -> List[ReferralLink]:
    """
    Get referral links for a campaign.
    """
    response = db.table("referral_links").select("*").eq("campaign_id", campaign_id).execute()
    if response.data:
        return [ReferralLink.model_validate(link) for link in response.data]
    return []

def get_referral_links_by_influencer(
    db: Client, 
    influencer_id: UUID
) -> List[ReferralLink]:
    """
    Get referral links for an influencer.
    """
    response = db.table("referral_links").select("*").eq("influencer_id", influencer_id).execute()
    if response.data:
        return [ReferralLink.model_validate(link) for link in response.data]
    return []

def initiate_data_export(db: Client, export_request: DataExportRequest) -> DataExportResponse:
    """
    Initiate a data export for campaigns.
    """
    try:
        export_id = uuid4()
        
        # Calculate estimated completion time (simple heuristic)
        estimated_time = datetime.utcnow() + timedelta(minutes=5)
        
        # For now, process the export immediately (simplified implementation)
        # In production, this would be handled by a background job queue
        export_data = _generate_export_data(db, export_request)
        
        # Create export file
        file_path = f"/tmp/export_{export_id}.{export_request.format.value}"
        record_count = _write_export_file(export_data, file_path, export_request.format.value)
        
        # Store export info in memory/cache for demo purposes
        # In production, this would be stored in a database table
        _export_cache[str(export_id)] = {
            "id": str(export_id),
            "export_type": export_request.export_type.value,
            "format": export_request.format.value,
            "status": DataExportStatus.COMPLETED.value,
            "file_path": file_path,
            "record_count": record_count,
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        return DataExportResponse(
            success=True,
            message="Data export completed successfully",
            export_id=export_id,
            estimated_completion_time=estimated_time,
            download_url=f"/api/campaigns/export-data/download?export_id={export_id}"
        )
    
    except Exception as e:
        return DataExportResponse(
            success=False,
            message=f"Failed to initiate data export: {str(e)}",
            export_id=None
        )


def _generate_export_data(db: Client, export_request: DataExportRequest) -> List[dict]:
    """
    Generate the actual export data based on the request type.
    """
    data = []
    
    if export_request.export_type == ExportType.CAMPAIGN_DATA:
        # Export campaign data
        query = db.table("discord_guild_campaigns").select("*")
        
        if export_request.campaign_ids:
            query = query.in_("id", [str(cid) for cid in export_request.campaign_ids])
        
        if export_request.guild_ids:
            query = query.in_("guild_id", export_request.guild_ids)
        
        if export_request.date_range_start:
            query = query.gte("created_at", export_request.date_range_start.isoformat())
        
        if export_request.date_range_end:
            query = query.lte("created_at", export_request.date_range_end.isoformat())
        
        response = query.execute()
        data = response.data or []
    
    elif export_request.export_type == ExportType.USER_DATA:
        # Export user data (with PII considerations)
        try:
            query = db.table("users").select("*")
            
            if export_request.date_range_start:
                query = query.gte("created_at", export_request.date_range_start.isoformat())
            
            if export_request.date_range_end:
                query = query.lte("created_at", export_request.date_range_end.isoformat())
            
            response = query.execute()
            raw_data = response.data or []
        except:
            # If users table doesn't exist, try access_requests
            try:
                query = db.table("access_requests").select("*")
                
                if export_request.date_range_start:
                    query = query.gte("created_at", export_request.date_range_start.isoformat())
                
                if export_request.date_range_end:
                    query = query.lte("created_at", export_request.date_range_end.isoformat())
                
                response = query.execute()
                raw_data = response.data or []
            except:
                raw_data = []
        
        # Remove PII if not requested
        if not export_request.include_pii:
            for user in raw_data:
                user.pop("email", None)
                user.pop("full_name", None)
        
        data = raw_data
    
    elif export_request.export_type == ExportType.ANALYTICS_DATA:
        # Export analytics data
        query = db.table("referral_analytics").select("*")
        
        if export_request.campaign_ids:
            query = query.in_("campaign_id", [str(cid) for cid in export_request.campaign_ids])
        
        if export_request.date_range_start:
            query = query.gte("created_at", export_request.date_range_start.isoformat())
        
        if export_request.date_range_end:
            query = query.lte("created_at", export_request.date_range_end.isoformat())
        
        response = query.execute()
        data = response.data or []
    
    elif export_request.export_type == ExportType.REFERRAL_DATA:
        # Export referral data
        query = db.table("referral_links").select("*")
        
        if export_request.campaign_ids:
            query = query.in_("campaign_id", [str(cid) for cid in export_request.campaign_ids])
        
        if export_request.date_range_start:
            query = query.gte("created_at", export_request.date_range_start.isoformat())
        
        if export_request.date_range_end:
            query = query.lte("created_at", export_request.date_range_end.isoformat())
        
        response = query.execute()
        data = response.data or []
    
    elif export_request.export_type == ExportType.ONBOARDING_DATA:
        # Export onboarding data
        query = db.table("discord_referral_interactions").select("*")
        
        if export_request.guild_ids:
            query = query.in_("guild_id", export_request.guild_ids)
        
        if export_request.date_range_start:
            query = query.gte("created_at", export_request.date_range_start.isoformat())
        
        if export_request.date_range_end:
            query = query.lte("created_at", export_request.date_range_end.isoformat())
        
        response = query.execute()
        data = response.data or []
    
    return data

def _write_export_file(data: List[dict], file_path: str, format: str) -> int:
    """
    Write export data to file in the specified format.
    """
    record_count = len(data)
    
    if format == "json":
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    elif format == "csv":
        if data:
            with open(file_path, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
        else:
            # Create empty CSV
            with open(file_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["No data available"])
    
    elif format == "excel":
        # For Excel, we'll use CSV for now (would need pandas/openpyxl for true Excel)
        if data:
            with open(file_path, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
        else:
            with open(file_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["No data available"])
    
    return record_count

def get_export_status(db: Client, export_id: UUID) -> Optional[DataExport]:
    """
    Get the status of a data export.
    """
    try:
        export_data = _export_cache.get(str(export_id))
        
        if export_data:
            return DataExport.model_validate(export_data)
        
        return None
    
    except Exception:
        return None
