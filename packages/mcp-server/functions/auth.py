"""Authentication functions."""

import asyncio
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware
from server import token_context


async def signup_user(params: dict) -> dict:
    """Registers a new user account."""
    try:
        data = {
            "email": params["email"],
            "password": params["password"],
            "full_name": params.get("full_name"),
            "username": params.get("username")
        }
        
        token = token_context.get()
        result = await api_client._make_request("POST", "/api/auth/signup", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error during user signup: {e}")
        return {"error": str(e)}


async def login_user(params: dict) -> dict:
    """Authenticates a user and returns access token."""
    try:
        data = {
            "email": params["email"],
            "password": params["password"]
        }
        
        token = token_context.get()
        result = await api_client._make_request("POST", "/api/auth/login", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error during user login: {e}")
        return {"error": str(e)}


async def logout_user(_params: dict) -> dict:
    """Logs out the current user."""
    try:
        token = token_context.get()
        result = await api_client._make_request("POST", "/api/auth/logout", token=token)
        return result
    except Exception as e:
        logger.error(f"Error during user logout: {e}")
        return {"error": str(e)}


async def send_confirmation_email(params: dict) -> dict:
    """Sends email confirmation to user."""
    try:
        data = {
            "email": params["email"]
        }
        
        token = token_context.get()
        result = await api_client._make_request("POST", "/api/auth/send-confirmation", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error sending confirmation email: {e}")
        return {"error": str(e)}


async def confirm_email(params: dict) -> dict:
    """Confirms user email with confirmation token."""
    try:
        data = {
            "token": params["token"],
            "email": params.get("email")
        }
        
        token = token_context.get()
        result = await api_client._make_request("POST", "/api/auth/confirm", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error confirming email: {e}")
        return {"error": str(e)}


async def google_login(_params: dict) -> dict:
    """Initiates Google OAuth2 login flow."""
    try:
        # This function is now primarily a placeholder
        # The actual login flow is handled by the API and frontend
        return {
            "message": "Google login flow is managed by the frontend. Please use the site UI to log in.",
            "login_url": "/api/auth/google/login" # Provide the endpoint for clarity
        }
    except Exception as e:
        logger.error(f"Error getting Google login URL: {e}")
        return {"error": str(e)}


async def get_current_user(_params: dict) -> dict:
    """Gets current authenticated user information."""
    try:
        token = token_context.get()
        result = await api_client._make_request("GET", "/api/auth/user", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        return {"error": str(e)}


async def delete_user_account(_params: dict) -> dict:
    """Deletes the current user account."""
    try:
        token = token_context.get()
        result = await api_client.delete_user(token=token)
        return result
    except Exception as e:
        logger.error(f"Error deleting user account: {e}")
        return {"error": str(e)}


class AuthPlugin(PluginBase):
    """Plugin for authentication functions."""
    
    @property
    def category(self) -> str:
        return "auth"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="signup_user",
                func=apply_middleware(signup_user, [
                    validation_middleware(["email", "password"])
                ]),
                category=self.category,
                description="Registers a new user account",
                schema={
                    "type": "object",
                    "properties": {
                        "email": {"type": "string", "format": "email", "description": "User email address"},
                        "password": {"type": "string", "minLength": 8, "description": "User password"},
                        "full_name": {"type": "string", "description": "User full name"},
                        "username": {"type": "string", "description": "Username"}
                    },
                    "required": ["email", "password"]
                }
            ),
            FunctionSpec(
                name="login_user",
                func=apply_middleware(login_user, [
                    validation_middleware(["email", "password"])
                ]),
                category=self.category,
                description="Authenticates a user and returns access token",
                schema={
                    "type": "object",
                    "properties": {
                        "email": {"type": "string", "format": "email", "description": "User email address"},
                        "password": {"type": "string", "description": "User password"}
                    },
                    "required": ["email", "password"]
                }
            ),
            FunctionSpec(
                name="logout_user",
                func=apply_middleware(logout_user),
                category=self.category,
                description="Logs out the current user",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="send_confirmation_email",
                func=apply_middleware(send_confirmation_email, [
                    validation_middleware(["email"])
                ]),
                category=self.category,
                description="Sends email confirmation to user",
                schema={
                    "type": "object",
                    "properties": {
                        "email": {"type": "string", "format": "email", "description": "User email address"}
                    },
                    "required": ["email"]
                }
            ),
            FunctionSpec(
                name="confirm_email",
                func=apply_middleware(confirm_email, [
                    validation_middleware(["token"])
                ]),
                category=self.category,
                description="Confirms user email with confirmation token",
                schema={
                    "type": "object",
                    "properties": {
                        "token": {"type": "string", "description": "Email confirmation token"},
                        "email": {"type": "string", "format": "email", "description": "Optional user email"}
                    },
                    "required": ["token"]
                }
            ),
            FunctionSpec(
                name="google_login",
                func=apply_middleware(google_login),
                category=self.category,
                description="Initiates Google OAuth2 login flow",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="get_current_user",
                func=apply_middleware(get_current_user),
                category=self.category,
                description="Gets current authenticated user information",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="delete_user_account",
                func=apply_middleware(delete_user_account),
                category=self.category,
                description="Deletes the current user account",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            )
        ]


def get_plugin() -> AuthPlugin:
    """Get the authentication plugin instance."""
    return AuthPlugin()