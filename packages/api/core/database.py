from supabase import create_client, Client
from .config import settings

# This single client instance can be used by both sync and async code.
# It can be imported directly by middleware or provided via dependency injection.
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def get_supabase_client():
    """Dependency function to get the supabase client."""
    yield supabase_client

def get_db():
    """Alias for get_supabase_client for backward compatibility."""
    yield supabase_client 