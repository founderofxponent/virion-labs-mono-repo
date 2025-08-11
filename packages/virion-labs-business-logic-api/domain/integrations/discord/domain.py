from typing import List, Dict, Any
from datetime import datetime, timezone

class DiscordDomain:
    """Domain logic for Discord integrations."""

    def filter_campaigns_for_channel(self, campaigns: List[Dict[str, Any]], channel_id: str, join_campaigns_channel_id: str) -> List[Dict[str, Any]]:
        """
        Filters campaigns based on the channel context.
        - If in the designated 'join-campaigns' channel, show only public campaigns.
        - If in any other channel, show only campaigns specific to that channel.
        - Only show active campaigns that are within their valid date range.
        """
        is_join_campaigns_channel = (channel_id == join_campaigns_channel_id)
        
        print(f"🔍 FILTER DEBUG: is_join_campaigns_channel={is_join_campaigns_channel}, channel_id={channel_id}, join_campaigns_channel_id={join_campaigns_channel_id}")
        print(f"🔍 FILTER DEBUG: Total campaigns to filter: {len(campaigns)}")
        
        # Log each campaign's details before filtering
        for i, campaign in enumerate(campaigns):
            campaign_channel_id = getattr(campaign, "channel_id", None)
            campaign_name = getattr(campaign, "name", "Unknown")
            campaign_id = getattr(campaign, "id", "Unknown")
            is_active = getattr(campaign, "is_active", None)
            start_date = getattr(campaign, "start_date", None)
            end_date = getattr(campaign, "end_date", None)
            print(f"🔍 Campaign {i+1}: id={campaign_id}, name='{campaign_name}', channel_id='{campaign_channel_id}', is_active={is_active}, start_date={start_date}, end_date={end_date}")

        # First filter by channel context
        if is_join_campaigns_channel:
            # Show public campaigns (no channel_id)
            filtered_campaigns = [c for c in campaigns if not getattr(c, "channel_id", None)]
            print(f"🔍 FILTER DEBUG: Join campaigns channel - looking for campaigns with no channel_id")
        else:
            # Show campaigns specific to this channel
            filtered_campaigns = [c for c in campaigns if getattr(c, "channel_id", None) == channel_id]
            print(f"🔍 FILTER DEBUG: Specific channel - looking for campaigns with channel_id='{channel_id}'")
        
        print(f"🔍 FILTER DEBUG: After channel filtering: {len(filtered_campaigns)} campaigns remain")
        for i, campaign in enumerate(filtered_campaigns):
            campaign_name = getattr(campaign, "name", "Unknown")
            campaign_id = getattr(campaign, "id", "Unknown")
            print(f"🔍 Channel-filtered Campaign {i+1}: id={campaign_id}, name='{campaign_name}'")
        
        # Then filter to show only active campaigns
        active_campaigns = []
        current_time = datetime.now(timezone.utc)
        print(f"🔍 FILTER DEBUG: Current time for date filtering: {current_time}")
        
        for campaign in filtered_campaigns:
            try:
                campaign_name = getattr(campaign, "name", "Unknown")
                campaign_id = getattr(campaign, "id", "Unknown")
                
                # Check if campaign is marked as active
                is_active = getattr(campaign, "is_active", True)
                print(f"🔍 ACTIVE CHECK: Campaign {campaign_id} '{campaign_name}' - is_active={is_active}")
                if not is_active:
                    print(f"❌ FILTERED OUT: Campaign {campaign_id} '{campaign_name}' - not active")
                    continue
                    
                # Check if campaign is within its date range
                start_date_str = getattr(campaign, "start_date", None)
                end_date_str = getattr(campaign, "end_date", None)
                
                # Parse date strings to datetime objects for comparison
                start_date = None
                if start_date_str:
                    try:
                        # Handle both string dates and datetime objects
                        if isinstance(start_date_str, str):
                            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                        elif hasattr(start_date_str, 'replace'):  # datetime object
                            start_date = start_date_str.replace(tzinfo=timezone.utc) if start_date_str.tzinfo is None else start_date_str
                    except (ValueError, AttributeError, TypeError) as e:
                        print(f"Error parsing start_date '{start_date_str}': {e}")
                        pass  # Invalid date format, treat as None
                
                end_date = None
                if end_date_str:
                    try:
                        # Handle both string dates and datetime objects
                        if isinstance(end_date_str, str):
                            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                        elif hasattr(end_date_str, 'replace'):  # datetime object
                            end_date = end_date_str.replace(tzinfo=timezone.utc) if end_date_str.tzinfo is None else end_date_str
                    except (ValueError, AttributeError, TypeError) as e:
                        print(f"Error parsing end_date '{end_date_str}': {e}")
                        pass  # Invalid date format, treat as None
                
                # If start_date is set and current time is before start, skip
                if start_date and current_time < start_date:
                    print(f"❌ FILTERED OUT: Campaign {campaign_id} '{campaign_name}' - current time {current_time} is before start_date {start_date}")
                    continue
                    
                # If end_date is set and current time is after end, skip
                if end_date and current_time > end_date:
                    print(f"❌ FILTERED OUT: Campaign {campaign_id} '{campaign_name}' - current time {current_time} is after end_date {end_date}")
                    continue
                
                print(f"✅ PASSED ALL FILTERS: Campaign {campaign_id} '{campaign_name}' - adding to active campaigns")
                active_campaigns.append(campaign)
                
            except Exception as e:
                print(f"Error processing campaign {getattr(campaign, 'id', 'unknown')}: {e}")
                print(f"Campaign type: {type(campaign)}")
                print(f"Campaign attributes: {dir(campaign) if hasattr(campaign, '__dict__') else 'No __dict__'}")
                continue
        
        return active_campaigns

    def has_verified_role(self, user_roles: List[str], verified_role_id: str) -> bool:
        """
        Checks if the user has the verified role.
        """
        if not verified_role_id:
            # If no role is configured, access is implicitly granted.
            return True
        return verified_role_id in user_roles