# Unified schema package - single source of truth
# 
# Usage:
# - schemas.db.* for database table schemas (auto-generated)
# - schemas.api.* for business logic schemas (manually maintained)

# Re-export commonly used schemas for convenience
from .db.clients import Client, ClientCreate, ClientUpdate
from .db.discord_guild_campaigns import DiscordGuildCampaign, DiscordGuildCampaignCreate, DiscordGuildCampaignUpdate
from .db.referral_links import ReferralLink, ReferralLinkCreate, ReferralLinkUpdate
from .db.access_requests import AccessRequest, AccessRequestCreate, AccessRequestUpdate
from .db.campaign_templates import CampaignTemplate, CampaignTemplateCreate, CampaignTemplateUpdate

from .api.auth import UserSignup, UserLogin, UserProfile, AuthResponse
from .api.analytics import AnalyticsTrackRequest, GuildAnalyticsResponse
from .api.campaign import DataExportRequest, DataExportResponse