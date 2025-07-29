from typing import List, Dict, Any

class DiscordDomain:
    """Domain logic for Discord integrations."""

    def filter_campaigns_for_channel(self, campaigns: List[Dict[str, Any]], channel_id: str, join_campaigns_channel_id: str) -> List[Dict[str, Any]]:
        """
        Filters campaigns based on the channel context.
        - If in the designated 'join-campaigns' channel, show only public campaigns.
        - If in any other channel, show only campaigns specific to that channel.
        """
        is_join_campaigns_channel = (channel_id == join_campaigns_channel_id)

        if is_join_campaigns_channel:
            # Show public campaigns (no channel_id)
            return [c for c in campaigns if not c.get("channel_id")]
        else:
            # Show campaigns specific to this channel
            return [c for c in campaigns if c.get("channel_id") == channel_id]

    def has_verified_role(self, user_roles: List[str], verified_role_id: str) -> bool:
        """
        Checks if the user has the verified role.
        """
        if not verified_role_id:
            # If no role is configured, access is implicitly granted.
            return True
        return verified_role_id in user_roles