from fastapi import APIRouter, HTTPException, Request, Depends, Response
from fastapi.responses import RedirectResponse
from core.strapi_client import strapi_client
from schemas.tracking_schemas import ClickTrackingRequest, ConversionTrackingRequest, TrackingResponse, ReferralStatsResponse
from typing import Optional
import logging
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/click/{referral_code}", response_model=TrackingResponse)
async def track_click(
    referral_code: str,
    request: Request,
    tracking_data: Optional[ClickTrackingRequest] = None
):
    """
    Tracks a click on a referral link by incrementing the clicks count.
    
    This endpoint should be called when a user clicks a referral link.
    It finds the referral link by code and increments the clicks counter.
    """
    try:
        logger.info(f"Tracking click for referral code: {referral_code}")
        
        # Find the referral link by referral_code
        filters = {
            "filters[referral_code][$eq]": referral_code,
            "populate[0]": "campaign",
            "populate[1]": "influencer"
        }
        referral_links = await strapi_client.get_referral_links(filters=filters)
        
        if not referral_links:
            raise HTTPException(
                status_code=404, 
                detail=f"Referral link with code '{referral_code}' not found"
            )
        
        referral_link = referral_links[0]
        
        # Increment clicks count
        current_clicks = referral_link.clicks or 0
        new_clicks = current_clicks + 1
        
        # Update the referral link with new clicks count
        from schemas.strapi import StrapiReferralLinkUpdate
        update_data = StrapiReferralLinkUpdate(clicks=new_clicks)
        
        updated_link = await strapi_client.update_referral_link(
            referral_link.documentId, 
            update_data
        )
        
        logger.info(f"Click tracked successfully. Clicks updated from {current_clicks} to {new_clicks}")
        
        return TrackingResponse(
            success=True,
            message=f"Click tracked successfully for referral code {referral_code}",
            clicks=new_clicks,
            conversions=referral_link.conversions or 0,
            earnings=referral_link.earnings or 0.0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error tracking click for referral code {referral_code}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while tracking click: {str(e)}"
        )


@router.get("/r/{referral_code}")
async def redirect_and_track(referral_code: str, request: Request):
    """
    Handles referral link redirects with click tracking.
    
    This endpoint:
    1. Finds the referral link by code
    2. Tracks the click (increments counter)
    3. Redirects user to the target URL
    4. Sets a tracking cookie for conversion attribution
    """
    try:
        logger.info(f"Processing referral redirect for code: {referral_code}")
        
        # Find the referral link
        filters = {
            "filters[referral_code][$eq]": referral_code,
            "populate[0]": "campaign",
            "populate[1]": "influencer"
        }
        referral_links = await strapi_client.get_referral_links(filters=filters)
        
        if not referral_links:
            raise HTTPException(
                status_code=404, 
                detail=f"Referral link with code '{referral_code}' not found"
            )
        
        referral_link = referral_links[0]
        
        # Track the click (increment counter)
        current_clicks = referral_link.clicks or 0
        new_clicks = current_clicks + 1
        
        from schemas.strapi import StrapiReferralLinkUpdate
        update_data = StrapiReferralLinkUpdate(clicks=new_clicks)
        
        await strapi_client.update_referral_link(referral_link.documentId, update_data)
        
        logger.info(f"Click tracked and incremented to {new_clicks}")
        
        # Create redirect response to the original target URL
        target_url = referral_link.original_url
        response = RedirectResponse(url=target_url, status_code=302)
        
        # Set tracking cookie for conversion attribution (expires in 30 days)
        response.set_cookie(
            key="virion_referral_code",
            value=referral_code,
            max_age=30 * 24 * 60 * 60,  # 30 days in seconds
            httponly=True,
            secure=True,
            samesite="lax"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing referral redirect for code {referral_code}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/conversion/{referral_code}", response_model=TrackingResponse)
async def track_conversion(
    referral_code: str,
    conversion_data: ConversionTrackingRequest,
    request: Request
):
    """
    Tracks a conversion for a referral link.
    
    This endpoint should be called when a user completes a conversion action
    (e.g., signs up, makes a purchase, completes onboarding).
    """
    try:
        logger.info(f"Tracking conversion for referral code: {referral_code}")
        
        # Find the referral link
        filters = {
            "filters[referral_code][$eq]": referral_code,
            "populate[0]": "campaign",
            "populate[1]": "influencer"
        }
        referral_links = await strapi_client.get_referral_links(filters=filters)
        
        if not referral_links:
            raise HTTPException(
                status_code=404, 
                detail=f"Referral link with code '{referral_code}' not found"
            )
        
        referral_link = referral_links[0]
        
        # Increment conversions and add earnings
        current_conversions = referral_link.conversions or 0
        current_earnings = referral_link.earnings or 0.0
        
        new_conversions = current_conversions + 1
        conversion_value = conversion_data.conversion_value or 0.0
        new_earnings = current_earnings + conversion_value
        
        # Update the referral link
        from schemas.strapi import StrapiReferralLinkUpdate
        update_data = StrapiReferralLinkUpdate(
            conversions=new_conversions,
            earnings=new_earnings,
            last_conversion_at=datetime.now().isoformat()
        )
        
        updated_link = await strapi_client.update_referral_link(
            referral_link.documentId, 
            update_data
        )
        
        logger.info(f"Conversion tracked successfully. Conversions: {current_conversions} -> {new_conversions}, Earnings: {current_earnings} -> {new_earnings}")
        
        return TrackingResponse(
            success=True,
            message=f"Conversion tracked successfully for referral code {referral_code}",
            clicks=referral_link.clicks or 0,
            conversions=new_conversions,
            earnings=new_earnings
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error tracking conversion for referral code {referral_code}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while tracking conversion: {str(e)}"
        )


@router.post("/conversion", response_model=TrackingResponse)
async def track_conversion_with_cookie(
    conversion_data: ConversionTrackingRequest,
    request: Request
):
    """
    Tracks a conversion using the referral code from the user's cookie.
    
    This is useful for tracking conversions when the referral code
    is stored in a cookie from a previous click.
    """
    try:
        # Get referral code from cookie
        referral_code = request.cookies.get("virion_referral_code")
        
        if not referral_code:
            raise HTTPException(
                status_code=400,
                detail="No referral tracking cookie found"
            )
        
        logger.info(f"Tracking conversion from cookie for referral code: {referral_code}")
        
        # Use the main conversion tracking logic
        return await track_conversion(referral_code, conversion_data, request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error tracking conversion from cookie: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/stats/{referral_code}", response_model=ReferralStatsResponse)
async def get_referral_stats(referral_code: str):
    """
    Gets current statistics for a referral link.
    """
    try:
        logger.info(f"Getting stats for referral code: {referral_code}")
        
        # Find the referral link
        filters = {
            "filters[referral_code][$eq]": referral_code,
            "populate[0]": "campaign",
            "populate[1]": "influencer"
        }
        referral_links = await strapi_client.get_referral_links(filters=filters)
        
        if not referral_links:
            raise HTTPException(
                status_code=404, 
                detail=f"Referral link with code '{referral_code}' not found"
            )
        
        referral_link = referral_links[0]
        
        # Calculate conversion rate
        clicks = referral_link.clicks or 0
        conversions = referral_link.conversions or 0
        conversion_rate = (conversions / clicks * 100) if clicks > 0 else 0.0
        
        return ReferralStatsResponse(
            id=referral_link.documentId,
            documentId=referral_link.documentId,
            referral_code=referral_link.referral_code,
            title=referral_link.title,
            platform=referral_link.platform,
            clicks=clicks,
            conversions=conversions,
            earnings=referral_link.earnings or 0.0,
            conversion_rate=conversion_rate,
            referral_url=referral_link.referral_url,
            original_url=referral_link.original_url,
            last_click_at=referral_link.last_click_at,
            last_conversion_at=referral_link.last_conversion_at,
            created_at=referral_link.created_at,
            is_active=referral_link.is_active
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting stats for referral code {referral_code}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/campaign/{referral_code}")
async def get_referral_campaign_data(referral_code: str):
    """
    Gets campaign landing page data for a referral link.
    This is used by the dashboard's /r/[code] page to display landing page content.
    """
    try:
        logger.info(f"Getting campaign data for referral code: {referral_code}")
        
        # Find the referral link
        filters = {
            "filters[referral_code][$eq]": referral_code,
            "populate[0]": "campaign",
            "populate[1]": "influencer"
        }
        referral_links = await strapi_client.get_referral_links(filters=filters)
        
        if not referral_links:
            raise HTTPException(
                status_code=404, 
                detail=f"Referral link with code '{referral_code}' not found"
            )
        
        referral_link = referral_links[0]
        
        # Check if link is active
        if not referral_link.is_active:
            # Return disabled link with status information
            return {
                "link_disabled": True,
                "referral_link": {
                    "id": str(referral_link.documentId),
                    "title": referral_link.title,
                    "description": referral_link.description,
                    "platform": referral_link.platform,
                    "influencer_id": str(referral_link.influencer.id) if referral_link.influencer else None,
                },
                "campaign": {
                    "id": str(referral_link.campaign.id) if referral_link.campaign else None,
                    "campaign_name": referral_link.campaign.name if referral_link.campaign else "Unknown Campaign",
                    "campaign_type": "referral",
                    "brand_color": "#6366f1",  # Default color
                    "clients": {
                        "name": "Client Name",  # This would come from campaign data
                        "industry": "Technology"
                    }
                },
                "influencer": {
                    "full_name": referral_link.influencer.full_name if referral_link.influencer else "Unknown Influencer",
                    "avatar_url": None
                },
                "status": {
                    "reason": "campaign_paused" if referral_link.expires_at and datetime.now() > referral_link.expires_at else "link_disabled",
                    "message": "This referral link is temporarily unavailable.",
                    "can_reactivate": True,
                    "last_change": {
                        "action": "disabled",
                        "timestamp": datetime.now().isoformat(),
                        "reason": "Link inactive"
                    }
                }
            }
        
        # Return active link data for landing page
        return {
            "link_disabled": False,
            "referral_link": {
                "id": str(referral_link.documentId),
                "title": referral_link.title,
                "description": referral_link.description,
                "platform": referral_link.platform,
                "influencer_id": str(referral_link.influencer.id) if referral_link.influencer else None,
            },
            "campaign": {
                "id": str(referral_link.campaign.id) if referral_link.campaign else None,
                "campaign_name": referral_link.campaign.name if referral_link.campaign else "Referral Campaign",
                "campaign_type": "referral",
                "brand_color": "#6366f1",  # This would come from campaign branding
                "clients": {
                    "name": "Client Name",  # This would come from campaign data
                    "industry": "Technology"
                }
            },
            "influencer": {
                "full_name": referral_link.influencer.full_name if referral_link.influencer else "Influencer",
                "avatar_url": None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting campaign data for referral code {referral_code}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )