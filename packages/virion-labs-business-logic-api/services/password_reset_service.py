import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr

from core.strapi_client import strapi_client
from services.email_service import email_service, Email, TemplateEmail
from core.config import settings

class PasswordResetToken(BaseModel):
    email: EmailStr
    token: str
    expires_at: datetime

# In-memory store for reset tokens. In a production environment, use a database or Redis.
_reset_tokens: dict[str, PasswordResetToken] = {}

class PasswordResetService:
    """Service for handling password reset logic."""

    async def create_reset_token(self, email: EmailStr) -> str:
        """Generates a secure password reset token."""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)
        
        _reset_tokens[token] = PasswordResetToken(email=email, token=token, expires_at=expires_at)
        
        return token

    def get_email_by_token(self, token: str) -> Optional[EmailStr]:
        """Retrieves the email associated with a reset token."""
        token_data = _reset_tokens.get(token)
        if not token_data or token_data.expires_at < datetime.now(timezone.utc):
            return None
        return token_data.email

    async def send_password_reset_email(self, email: EmailStr):
        """Initiates the password reset process for a user."""
        # Ensure user exists
        users = await strapi_client.get_users({"filters[email][$eq]": email})
        if not users:
            # Do not reveal that the user does not exist
            return

        token = await self.create_reset_token(email)
        reset_link = f"{settings.FRONTEND_URL}/password-reset?token={token}"

        # Try to use template first, fall back to hardcoded email if template not found
        try:
            template_email_data = TemplateEmail(
                to=email,
                template_id="password-reset",
                variables={
                    "reset_link": reset_link,
                    "expires_minutes": str(settings.PASSWORD_RESET_EXPIRE_MINUTES)
                }
            )
            await email_service.send_template_email(template_email_data)
        except Exception as template_error:
            # Fall back to hardcoded email if template system fails
            email_data = Email(
                to=email,
                subject="Reset Your Password",
                html=f"""
                <h1>Password Reset Request</h1>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="{reset_link}">{reset_link}</a>
                <p>This link will expire in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.</p>
                """
            )
            await email_service.send_email(email_data)

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Resets the user's password using a valid token."""
        email = self.get_email_by_token(token)
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

        # In Strapi, password reset is handled by a specific endpoint
        # that requires the reset token and new password.
        success = await strapi_client.reset_password(token, new_password)

        if success:
            # Invalidate the token after use
            if token in _reset_tokens:
                del _reset_tokens[token]
            return True
        
        return False

password_reset_service = PasswordResetService()
