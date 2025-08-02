from core.strapi_client import strapi_client
import logging
from typing import Dict, Any, List, Literal, Optional
from schemas.analytics_schemas import OnboardingExportRequest, OnboardingExportResponse, CampaignExportStats, InfluencerMetricsResponse, InfluencerLinkMetrics
from core.auth import StrapiUser
from fastapi import HTTPException, status
from core.config import settings
from datetime import datetime, timedelta, timezone
import os
import uuid
import json
import csv
import io

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service layer for analytics operations."""

    async def get_comprehensive_dashboard(self, current_user) -> Dict[str, Any]:
        """
        Provides a comprehensive overview of platform analytics, tailored to the user's role.
        """
        # Fetch all campaigns and clients
        all_campaigns = await strapi_client.get_campaigns()
        all_clients = await strapi_client.get_clients()

        # Calculate overview metrics
        total_campaigns = len(all_campaigns)
        active_campaigns = len([c for c in all_campaigns if c.is_active])
        total_clients = len(all_clients)
        active_clients = len([c for c in all_clients if c.client_status == 'active'])

        # Calculate onboarding metrics
        total_starts = 0
        total_completions = 0
        for campaign in all_campaigns:
            funnel_analytics = await self.get_onboarding_funnel_analytics(campaign.id)
            total_starts += funnel_analytics['total_starts']
            total_completions += funnel_analytics['total_completions']

        if total_starts > 0:
            overall_completion_rate = (total_completions / total_starts) * 100
        else:
            overall_completion_rate = 0

        overview = {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_onboarding_starts": total_starts,
            "total_onboarding_completions": total_completions,
            "overall_completion_rate": round(overall_completion_rate, 2),
            "total_clients": total_clients,
            "active_clients": active_clients,
        }

        # Format campaign analytics
        campaigns_analytics = []
        for campaign in all_campaigns:
            funnel_analytics = await self.get_onboarding_funnel_analytics(campaign.id)
            campaigns_analytics.append({
                "id": campaign.id,
                "name": campaign.name,
                "total_starts": funnel_analytics['total_starts'],
                "total_completions": funnel_analytics['total_completions'],
                "completion_rate": funnel_analytics['completion_rate'],
                "client_name": campaign.client.name if campaign.client else "N/A",
            })

        return {
            "overview": overview,
            "campaigns": campaigns_analytics
        }

    async def get_onboarding_funnel_analytics(self, campaign_id: str) -> Dict[str, Any]:
        """
        Calculates the onboarding funnel analytics for a specific campaign.
        """
        try:
            logger.info(f"Calculating onboarding funnel analytics for campaign {campaign_id}")

            # 1. Get total starts
            start_filters = {"filters[campaign][id][$eq]": campaign_id}
            onboarding_starts = await strapi_client.get_onboarding_starts(start_filters)
            total_starts = len(onboarding_starts)

            # 2. Get total completions
            completion_filters = {"filters[campaign][id][$eq]": campaign_id}
            onboarding_completions = await strapi_client.get_onboarding_completions(completion_filters)
            total_completions = len(onboarding_completions)

            # 3. Calculate completion rate
            if total_starts > 0:
                completion_rate = (total_completions / total_starts) * 100
            else:
                completion_rate = 0

            analytics_data = {
                "total_starts": total_starts,
                "total_completions": total_completions,
                "completion_rate": round(completion_rate, 2)
            }
            
            logger.info(f"Onboarding funnel analytics for campaign {campaign_id}: {analytics_data}")
            return analytics_data

        except Exception as e:
            logger.error(f"Failed to calculate onboarding funnel analytics for campaign {campaign_id}: {e}")
            # Return zeroed data on error to avoid breaking the caller
            return {
                "total_starts": 0,
                "total_completions": 0,
                "completion_rate": 0
            }

    async def get_performance_over_time(self, timeframe_days: int) -> Dict[str, Any]:
        """
        Calculates the performance metrics over a given time frame, grouped by day.
        """
        from datetime import datetime, timedelta, timezone

        try:
            logger.info(f"Calculating performance over time for the last {timeframe_days} days")

            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=timeframe_days)

            # 1. Fetch all starts and completions within the timeframe
            start_filters = {"filters[started_at][$gte]": start_date.isoformat()}
            onboarding_starts = await strapi_client.get_onboarding_starts(start_filters)

            completion_filters = {"filters[completed_at][$gte]": start_date.isoformat()}
            onboarding_completions = await strapi_client.get_onboarding_completions(completion_filters)

            # 2. Group data by day
            daily_data = {}
            for i in range(timeframe_days + 1):
                date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                daily_data[date] = {"starts": 0, "completions": 0}

            for start in onboarding_starts:
                if start.started_at:
                    date = start.started_at.strftime('%Y-%m-%d')
                    if date in daily_data:
                        daily_data[date]["starts"] += 1
            
            for completion in onboarding_completions:
                if completion.completed_at:
                    date = completion.completed_at.strftime('%Y-%m-%d')
                    if date in daily_data:
                        daily_data[date]["completions"] += 1
            
            # 3. Format for the response
            daily_metrics = [
                {
                    "date": date,
                    "users_started": data["starts"],
                    "users_completed": data["completions"]
                }
                for date, data in daily_data.items()
            ]

            return {
                "timeframe": f"{timeframe_days}d",
                "daily_metrics": daily_metrics
            }

        except Exception as e:
            logger.error(f"Failed to calculate performance over time: {e}")
            return {
                "timeframe": f"{timeframe_days}d",
                "daily_metrics": []
            }

    async def get_influencer_metrics(self, user_id: int) -> Dict[str, Any]:
        """
        Calculates the performance metrics for a specific influencer.
        """
        try:
            logger.info(f"Calculating influencer metrics for user {user_id}")

            # 1. Fetch all referral links for the user
            link_filters = {"filters[influencer][id][$eq]": user_id}
            referral_links = await strapi_client.get_referral_links(link_filters)

            # 2. Aggregate the metrics
            total_links = len(referral_links)
            active_links = len([link for link in referral_links if link.get('is_active')])
            total_clicks = sum(link.get('clicks', 0) for link in referral_links)
            total_conversions = sum(link.get('conversions', 0) for link in referral_links)
            total_earnings = sum(link.get('earnings', 0) for link in referral_links)

            if total_clicks > 0:
                overall_conversion_rate = (total_conversions / total_clicks) * 100
            else:
                overall_conversion_rate = 0

            # 3. Format for the response
            metrics = {
                "total_links": total_links,
                "active_links": active_links,
                "total_clicks": total_clicks,
                "total_conversions": total_conversions,
                "total_earnings": total_earnings,
                "overall_conversion_rate": round(overall_conversion_rate, 2),
                "links": [
                    {
                        "id": link.get('id'),
                        "title": link.get('title'),
                        "platform": link.get('platform'),
                        "clicks": link.get('clicks', 0),
                        "conversions": link.get('conversions', 0),
                        "earnings": link.get('earnings', 0),
                        "conversion_rate": link.get('conversion_rate', 0),
                        "referral_url": link.get('referral_url'),
                        "original_url": link.get('original_url'),
                        "thumbnail_url": link.get('thumbnail_url'),
                        "is_active": link.get('is_active'),
                        "created_at": link.get('createdAt'),
                        "expires_at": link.get('expires_at'),
                        "description": link.get('description'),
                        "referral_code": link.get('referral_code'),
                        "campaign_context": {
                            "campaign_name": link.get('campaign', {}).get('name') if link.get('campaign') else None,
                            "client_name": link.get('campaign', {}).get('client', {}).get('name') if link.get('campaign') and link.get('campaign').get('client') else None
                        }
                    }
                    for link in referral_links
                ]
            }

            return metrics

        except Exception as e:
            logger.error(f"Failed to calculate influencer metrics for user {user_id}: {e}")
            return {
                "total_links": 0,
                "active_links": 0,
                "total_clicks": 0,
                "total_conversions": 0,
                "total_earnings": 0,
                "overall_conversion_rate": 0,
                "links": []
            }

    async def get_performance_report(self, current_user, timeframe: str) -> Dict[str, Any]:
        """
        Provides a daily breakdown of key performance metrics.
        """
        timeframe_days = int(timeframe.replace('d', ''))
        return await self.get_performance_over_time(timeframe_days)

    async def get_influencer_specific_metrics(self, current_user) -> InfluencerMetricsResponse:
        """
        Provides key metrics for a specific influencer.
        """
        metrics_data = await self.get_influencer_metrics(current_user.id)
        
        # Convert to properly typed response
        links = [
            InfluencerLinkMetrics(
                id=link.get('id'),
                title=link.get('title', ''),
                platform=link.get('platform', ''),
                clicks=link.get('clicks', 0),
                conversions=link.get('conversions', 0),
                earnings=link.get('earnings', 0.0),
                conversion_rate=link.get('conversion_rate', 0.0),
                referral_url=link.get('referral_url', ''),
                original_url=link.get('original_url', ''),
                thumbnail_url=link.get('thumbnail_url'),
                is_active=link.get('is_active', True),
                created_at=link.get('created_at', ''),
                expires_at=link.get('expires_at'),
                description=link.get('description'),
                referral_code=link.get('referral_code', ''),
                campaign_context=link.get('campaign_context')
            )
            for link in metrics_data.get('links', [])
        ]
        
        return InfluencerMetricsResponse(
            total_links=metrics_data.get('total_links', 0),
            active_links=metrics_data.get('active_links', 0),
            total_clicks=metrics_data.get('total_clicks', 0),
            total_conversions=metrics_data.get('total_conversions', 0),
            total_earnings=metrics_data.get('total_earnings', 0.0),
            overall_conversion_rate=metrics_data.get('overall_conversion_rate', 0.0),
            links=links
        )

    async def get_roi_analytics(self) -> Dict[str, Any]:
        """
        Calculates the ROI for all campaigns.
        """
        try:
            logger.info("Calculating ROI analytics for all campaigns")

            # 1. Fetch all campaigns
            all_campaigns = await strapi_client.get_campaigns()

            # 2. Aggregate the metrics
            total_investment = sum(getattr(campaign, 'total_investment', 0) for campaign in all_campaigns)
            total_return = sum(
                getattr(campaign, 'successful_onboardings', 0) * getattr(campaign, 'value_per_conversion', 0)
                for campaign in all_campaigns
            )

            if total_investment > 0:
                roi_percentage = ((total_return - total_investment) / total_investment) * 100
            else:
                roi_percentage = 0

            # 3. Format for the response
            analytics_data = {
                "total_investment": total_investment,
                "total_return": total_return,
                "roi_percentage": round(roi_percentage, 2),
                "campaigns_roi": [
                    {
                        "campaign_id": campaign.id,
                        "name": getattr(campaign, 'name', ''),
                        "investment": getattr(campaign, 'total_investment', 0),
                        "return": getattr(campaign, 'successful_onboardings', 0) * getattr(campaign, 'value_per_conversion', 0),
                        "roi":
                            ((getattr(campaign, 'successful_onboardings', 0) * getattr(campaign, 'value_per_conversion', 0) - getattr(campaign, 'total_investment', 0)) / getattr(campaign, 'total_investment', 0)) * 100
                            if getattr(campaign, 'total_investment', 0) > 0 else 0
                    }
                    for campaign in all_campaigns
                ]
            }

            return analytics_data

        except Exception as e:
            logger.error(f"Failed to calculate ROI analytics: {e}")
            return {
                "total_investment": 0,
                "total_return": 0,
                "roi_percentage": 0,
                "campaigns_roi": []
            }

    async def export_onboarding_data(
        self,
        request: OnboardingExportRequest,
        current_user: StrapiUser
    ) -> OnboardingExportResponse:
        """
        Generates a file containing campaign onboarding data and returns a secure
        download link.
        """
        # Authorization check (simplified for this example)
        if current_user.role['name'] not in ["Platform Administrator", "client"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

        # Fetch data
        responses = await self._fetch_onboarding_responses(request.campaign_ids, request.date_range)

        # Process data and generate file
        file_content, content_type = self._generate_export_file(responses, request.file_format)

        # Store file and get download URL
        filename, file_path = self._store_export_file(file_content, request.file_format)
        
        # For this example, we'll return a direct path. In a real app, this would be a secure, expiring URL.
        download_url = f"{settings.API_URL}/exports/{filename}" # This needs a static file route in the main app

        # Create summary
        campaigns_summary = self._create_export_summary(responses)

        # Send email notification
        try:
            email_data = Email(
                to=current_user.email,
                subject="Your Data Export is Ready",
                html=f"""
                <h1>Your Export is Ready</h1>
                <p>Your requested data export is complete and ready for download.</p>
                <p>You can download your file here: <a href="{download_url}">{download_url}</a></p>
                <p>This link will expire in 1 hour.</p>
                """
            )
            await email_service.send_email(email_data)
        except Exception as e:
            logger.error(f"Failed to send data export email to {current_user.email}: {e}")

        return OnboardingExportResponse(
            download_url=download_url,
            filename=filename,
            content_type=content_type,
            size_bytes=len(file_content),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            campaigns_summary=campaigns_summary
        )

    async def _fetch_onboarding_responses(self, campaign_ids: Optional[List[str]], date_range: str) -> List[Dict[str, Any]]:
        """Fetches and enriches onboarding responses from Strapi."""
        filters = {"populate": ["campaign", "campaign.client"]}

        if campaign_ids:
            filters["filters[campaign][documentId][$in]"] = campaign_ids

        # The date_range filter is not supported by the current schema.
        # if date_range != "all":
        #     days = int(date_range)
        #     start_date = datetime.now(timezone.utc) - timedelta(days=days)
        #     filters["filters[created_at][$gte]"] = start_date.isoformat()

        return await strapi_client.get_onboarding_responses(filters)

    def _generate_export_file(self, data: List[Dict[str, Any]], file_format: Literal["csv", "json"]) -> (bytes, str):
        """Generates the export file content."""
        if file_format == "json":
            # Convert Pydantic models to dicts for JSON serialization
            data_dicts = [item.model_dump() for item in data]
            content = json.dumps(data_dicts, indent=2).encode('utf-8')
            return content, "application/json"
        
        # Default to CSV
        output = io.StringIO()
        if not data:
            output.write("No data found for the selected criteria.")
            return output.getvalue().encode('utf-8'), "text/csv"

        # Dynamically create headers from all possible keys
        headers = sorted(list(set(key for item in data for key in item.model_dump().keys())))
        
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows([item.model_dump() for item in data])
        
        return output.getvalue().encode('utf-8'), "text/csv"

    def _store_export_file(self, content: bytes, file_format: str) -> (str, str):
        """Stores the file and returns the filename and path."""
        export_dir = "temp_exports"
        os.makedirs(export_dir, exist_ok=True)
        
        filename = f"export-{uuid.uuid4()}.{file_format}"
        file_path = os.path.join(export_dir, filename)
        
        with open(file_path, "wb") as f:
            f.write(content)
            
        return filename, file_path

    def _create_export_summary(self, responses: List[Dict[str, Any]]) -> List[CampaignExportStats]:
        """Creates a summary of the exported data."""
        summary_map = {}
        for res in responses:
            campaign = res.get("campaign", {})
            if not campaign:
                continue
            
            campaign_id = campaign.get("documentId")
            if campaign_id not in summary_map:
                summary_map[campaign_id] = {
                    "campaign_id": campaign_id,
                    "campaign_name": campaign.get("name", "Unknown"),
                    "total_responses": 0,
                    "completed_responses": 0 # Assuming 'is_completed' field exists
                }
            
            summary_map[campaign_id]["total_responses"] += 1
            if res.get("is_completed"): # This field needs to be added to Strapi
                summary_map[campaign_id]["completed_responses"] += 1
                
        return [CampaignExportStats(**stats) for stats in summary_map.values()]

analytics_service = AnalyticsService()