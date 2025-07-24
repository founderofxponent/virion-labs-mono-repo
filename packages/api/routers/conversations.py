
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import uuid

from services.conversation_service import (
    ConversationService,
    ConversationThread,
    ConversationMessage,
    OnboardingSummary,
)
from core.auth import get_current_user_id

router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversations"],
)

class StartConversationRequest(BaseModel):
    campaign_id: Optional[uuid.UUID]
    user_id: str
    channel_id: str
    thread_id: str

class AddMessageRequest(BaseModel):
    thread_id: uuid.UUID
    message_id: str
    author_id: str
    content: str
    is_bot_message: bool = False


@router.post("/start", response_model=ConversationThread)
def start_conversation(
    request: StartConversationRequest,
    service: ConversationService = Depends(ConversationService),
):
    """Initiates a new conversation thread."""
    thread = service.start_thread(
        campaign_id=request.campaign_id,
        user_id=request.user_id,
        channel_id=request.channel_id,
        thread_id=request.thread_id,
    )
    return thread

@router.post("/message", response_model=ConversationMessage)
def add_message_to_conversation(
    request: AddMessageRequest,
    service: ConversationService = Depends(ConversationService),
):
    """Adds a message to an existing conversation thread."""
    message = service.add_message(
        thread_id=request.thread_id,
        message_id=request.message_id,
        author_id=request.author_id,
        content=request.content,
        is_bot_message=request.is_bot_message,
    )
    return message

@router.get("/{thread_id}", response_model=List[ConversationMessage])
def get_conversation_thread(
    thread_id: uuid.UUID,
    service: ConversationService = Depends(ConversationService),
):
    """Retrieves all messages from a conversation thread."""
    messages = service.get_thread_messages(thread_id)
    return messages

@router.post("/{thread_id}/summarize", status_code=202)
def summarize_conversation(
    thread_id: uuid.UUID,
    service: ConversationService = Depends(ConversationService),
):
    """Triggers the summarization process for a conversation thread."""
    service.queue_summarization(thread_id)
    return {"message": "Summarization process started."}

@router.get("/summary/{thread_id}", response_model=OnboardingSummary)
def get_conversation_summary(
    thread_id: uuid.UUID,
    service: ConversationService = Depends(ConversationService),
):
    """Retrieves the summary of a conversation."""
    summary = service.get_summary(thread_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found.")
    return summary 