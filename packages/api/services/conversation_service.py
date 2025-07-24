
import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from supabase import Client
from core.database import get_supabase_client
from fastapi import Depends
import logging

logger = logging.getLogger(__name__)

class ConversationThread(BaseModel):
    id: uuid.UUID
    campaign_id: Optional[uuid.UUID]
    user_id: str
    channel_id: str
    thread_id: str
    status: str

class ConversationMessage(BaseModel):
    id: uuid.UUID
    thread_id: uuid.UUID
    message_id: str
    author_id: str
    content: str
    is_bot_message: bool

class OnboardingSummary(BaseModel):
    id: uuid.UUID
    thread_id: uuid.UUID
    summary: str
    extracted_data: Dict[str, Any]

class ConversationService:
    def __init__(self, supabase: Client = Depends(get_supabase_client)):
        self.supabase = supabase

    def start_thread(
        self, user_id: str, channel_id: str, thread_id: str, campaign_id: Optional[uuid.UUID] = None
    ) -> ConversationThread:
        try:
            result = self.supabase.table("discord_message_threads").insert({
                "user_id": user_id,
                "channel_id": channel_id,
                "thread_id": thread_id,
                "campaign_id": str(campaign_id) if campaign_id else None,
            }).execute()
            
            if not result.data:
                raise Exception("Failed to start conversation thread.")

            return ConversationThread(**result.data[0])
        except Exception as e:
            logger.error(f"Error starting conversation thread: {e}")
            raise

    def add_message(
        self, thread_id: uuid.UUID, message_id: str, author_id: str, content: str, is_bot_message: bool
    ) -> ConversationMessage:
        try:
            result = self.supabase.table("discord_messages").insert({
                "thread_id": str(thread_id),
                "message_id": message_id,
                "author_id": author_id,
                "content": content,
                "is_bot_message": is_bot_message,
            }).execute()
            
            if not result.data:
                raise Exception("Failed to add message to conversation.")

            return ConversationMessage(**result.data[0])
        except Exception as e:
            logger.error(f"Error adding message to conversation: {e}")
            raise

    def get_thread_messages(self, thread_id: uuid.UUID) -> List[ConversationMessage]:
        try:
            result = self.supabase.table("discord_messages").select("*").eq("thread_id", str(thread_id)).order("created_at").execute()
            return [ConversationMessage(**msg) for msg in result.data]
        except Exception as e:
            logger.error(f"Error getting thread messages: {e}")
            raise

    def queue_summarization(self, thread_id: uuid.UUID):
        # This is a placeholder for a real async task queue (e.g., Celery, ARQ)
        # For now, we'll just log it.
        logger.info(f"Queuing summarization for thread_id: {thread_id}")
        # In a real implementation, you would add a task to a message broker here.
        # For demonstration, we can directly call a (potentially long-running) summarization function.
        # await self.summarize_and_store(thread_id)
        pass

    def get_summary(self, thread_id: uuid.UUID) -> Optional[OnboardingSummary]:
        try:
            result = self.supabase.table("onboarding_summaries").select("*").eq("thread_id", str(thread_id)).limit(1).execute()
            if not result.data:
                return None
            return OnboardingSummary(**result.data[0])
        except Exception as e:
            logger.error(f"Error getting onboarding summary: {e}")
            raise 