from supabase import create_client, Client
from .config import settings

supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

def get_db() -> Client:
    return supabase_client 