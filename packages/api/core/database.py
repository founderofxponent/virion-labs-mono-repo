from supabase import create_client, Client
from .config import settings

supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

def get_db():
    """Get database client for dependency injection."""
    yield supabase_client 