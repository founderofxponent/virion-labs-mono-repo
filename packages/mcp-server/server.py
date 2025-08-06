"""
Refactored MCP Server with modular plugin-based architecture.
Leaner, more maintainable, and easily extensible.
"""

import asyncio
import logging
from fastmcp import FastMCP

# Streamable HTTP imports
import uvicorn
from starlette.applications import Starlette
from starlette.routing import Mount, Route
from starlette.responses import JSONResponse, RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import contextvars
from starlette.requests import Request
import os
import mcp.types as types
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager

from core.config import AppConfig
from core.api_client import APIClient
from core.plugin import registry
from functions.base import set_api_client
from core.dynamic_functions import DynamicFunctionRegistry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global context variable for the token
token_context = contextvars.ContextVar("token_context", default=None)

# Debug environment variables
print(f"MCP DEBUG: OAUTH_REDIRECT_URI = {os.getenv('OAUTH_REDIRECT_URI')}")
print(f"MCP DEBUG: SITE_URL = {os.getenv('SITE_URL')}")
print(f"MCP DEBUG: API_BASE_URL = {os.getenv('API_BASE_URL')}")


class VirionLabsMCPServer:
    """Main MCP server class with dependency injection."""
    
    def __init__(self, config: AppConfig):
        self.config = config
        self.api_client = APIClient(config.api)
        self.function_registry = DynamicFunctionRegistry(self.api_client)
        
        # Initialize both FastMCP (for stdio) and low-level server (for streamable HTTP)
        self.mcp = FastMCP("virion_labs_mcp_server")
        self.lowlevel_server = Server("virion_labs_mcp_server")
        
        # Set the global API client for functions to use
        set_api_client(self.api_client)
        
        # Auto-discover and register plugins (OLD WAY - to be replaced)
        # registry.auto_discover_plugins()
        
        # Register tools on both servers
        self._register_universal_tool()
        self._register_lowlevel_tools()
        
        logger.info("MCP Server initialized with API-based architecture")
    
    def _list_functions_impl(self) -> dict:
        """Implementation for listing available functions."""
        try:
            return self.function_registry.list_functions()
        except Exception as e:
            logger.error(f"Error listing functions: {e}")
            return {"error": f"Error listing functions: {str(e)}"}

    def _get_function_details_impl(self, function_name: str) -> dict:
        """Implementation for getting detailed function information."""
        try:
            return self.function_registry.get_function_details(function_name)
        except Exception as e:
            logger.error(f"Error getting function details for {function_name}: {e}")
            return {"error": f"Error getting function details for {function_name}: {str(e)}"}
    
    def _register_universal_tool(self):
        """Register the universal tool that dispatches to plugins."""
        
        @self.mcp.tool()
        async def execute_function(function_name: str, parameters: dict = None) -> dict:
            """
            Universal tool that executes functions from registered plugins.
            
            Args:
                function_name: Name of the function to execute
                parameters: Function parameters
                
            Returns:
                Function execution result
            """
            try:
                # DYNAMIC DISPATCH LOGIC
                return await self.function_registry.execute_function(function_name, parameters)

            except Exception as e:
                logger.error(f"Error executing function {function_name}: {e}")
                return {"error": f"Error executing function {function_name}: {str(e)}"}
        
        @self.mcp.tool()
        def list_functions() -> dict:
            """
            Lists all available functions with their descriptions and required parameters.
            
            Returns:
                Dictionary containing all available functions with metadata
            """
            return self._list_functions_impl()
        
        @self.mcp.tool()
        def get_function_details(function_name: str) -> dict:
            """
            Gets detailed information about a specific function including parameters.
            
            Args:
                function_name: Name of the function to get details for
                
            Returns:
                Dictionary containing function details, parameters, and usage information
            """
            return self._get_function_details_impl(function_name)
    
    def _register_lowlevel_tools(self):
        """Register tools for the low-level server (streamable HTTP)."""
        
        @self.lowlevel_server.call_tool()
        async def call_tool(name: str, arguments: dict | None = None) -> list[types.TextContent]:
            """Handle tool calls for streamable HTTP."""
            try:
                # Get token from context var, set by AuthMiddleware
                token = token_context.get()

                if name == "execute_function":
                    function_name = arguments.get("function_name") if arguments else None
                    parameters = arguments.get("parameters") if arguments else None
                    
                    if not function_name:
                        return [types.TextContent(
                            type="text",
                            text='{"error": "function_name is required"}'
                        )]
                    
                    # DYNAMIC DISPATCH LOGIC
                    result = await self.function_registry.execute_function(
                        function_name, 
                        parameters,
                        token=token
                    )
                    
                    import json
                    return [types.TextContent(type="text", text=json.dumps(result))]
                
                elif name == "list_functions":
                    result = self._list_functions_impl()
                    import json
                    return [types.TextContent(type="text", text=json.dumps(result))]
                
                elif name == "get_function_details":
                    function_name = arguments.get("function_name") if arguments else None
                    
                    if not function_name:
                        return [types.TextContent(
                            type="text",
                            text='{"error": "function_name is required"}'
                        )]
                    
                    # Detailed logic is in the universal tool, just call it
                    details = self._get_function_details_impl(function_name)
                    import json
                    return [types.TextContent(
                        type="text",
                        text=json.dumps(details)
                    )]
                
                else:
                    return [types.TextContent(
                        type="text",
                        text=f'{{"error": "Tool \'{name}\' not supported for streamable HTTP"}}'
                    )]
            except Exception as e:
                logger.error(f"Error calling tool {name}: {e}")
                return [types.TextContent(
                    type="text",
                    text=f'{{"error": "Error calling tool: {e}"}}'
                )]

        @self.lowlevel_server.list_tools()
        async def list_tools() -> list[types.Tool]:
            """List tools for streamable HTTP."""
            # Define tools that are compatible with streamable HTTP
            return [
                types.Tool(
                    name="execute_function",
                    description="Executes a function from registered plugins.",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "function_name": {"type": "string", "description": "Name of the function"},
                            "parameters": {"type": "object", "description": "Function parameters"}
                        },
                        "required": ["function_name"]
                    }
                ),
                types.Tool(
                    name="list_functions",
                    description="Lists all available functions.",
                    inputSchema={"type": "object"}
                ),
                types.Tool(
                    name="get_function_details",
                    description="Gets details for a specific function.",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "function_name": {"type": "string", "description": "Name of the function"}
                        },
                        "required": ["function_name"]
                    }
                )
            ]

    async def _initialize_registry(self):
        """Fetches the OpenAPI schema and initializes the function registry."""
        try:
            await self.function_registry.initialize()
            logger.info(f"Successfully initialized dynamic function registry with {self.function_registry.count()} functions.")
        except Exception as e:
            logger.error(f"FATAL: Could not initialize dynamic function registry: {e}")
            logger.warning("MCP server will start with no functions available.")

    async def run(self):
        """Run the MCP server."""
        # Initialize the dynamic function registry first
        await self._initialize_registry()

        # Test API connection (allow failure for Cloud Run deployment)
        try:
            # Simple health check to test API connection
            await self.api_client._make_request("GET", "/status/health")
            logger.info("API connection successful")
        except Exception as e:
            logger.warning(f"API connection failed during startup: {e}")
            logger.info("Continuing startup - API connection will be retried on first request")
        
        logger.info(f"Starting server on {self.config.server.transport}:{self.config.server.port}")
        # logger.info(f"Registered {len(registry.functions)} functions from {len(registry.plugins)} plugins")
        
        if self.config.server.transport == "stdio":
            await self.mcp.run_async(transport="stdio")
        elif self.config.server.transport == "streamable-http":
            await self._run_streamable_http()
        else:
            # Default to FastMCP HTTP for backward compatibility
            await self.mcp.run_async(
                transport="http",
                host=self.config.server.host,
                port=self.config.server.port,
                path=self.config.server.path
            )

    async def _run_streamable_http(self):
        """Run the streamable HTTP server with Starlette."""

        # Create session manager for streamable HTTP
        session_manager = StreamableHTTPSessionManager(
            app=self.lowlevel_server,
            event_store=None,
            json_response=False,
            stateless=True
        )

        @asynccontextmanager
        async def lifespan(_app):
            # Initialize session manager
            async with session_manager.run():
                logger.info("StreamableHTTP session manager started!")
                yield
            # Cleanup tasks can go here
            await self.cleanup()

        async def mcp_app(scope, receive, send):
            # Handle MCP requests using the session manager
            await session_manager.handle_request(scope, receive, send)

        async def oauth_protected_resource_metadata(request):
            """OAuth 2.0 Protected Resource Metadata per RFC 9728."""
            # Use the request's base URL for Cloud Run deployment
            base_url = str(request.base_url).rstrip('/')
            # Ensure HTTPS for Cloud Run
            if base_url.startswith('http://') and 'run.app' in base_url:
                base_url = base_url.replace('http://', 'https://')
            server_url = f"{base_url}/mcp/"
            return JSONResponse({
                "resource": server_url,
                "authorization_servers": [self.config.api.base_url],
                "scopes_supported": ["mcp"],
                "bearer_methods_supported": ["header"],
                "resource_documentation": f"{base_url}/docs"
            })

        async def redirect_to_metadata(request: Request):
            return RedirectResponse(url="/.well-known/oauth-protected-resource")

        class AuthMiddleware(BaseHTTPMiddleware):
            def __init__(self, app, api_client):
                super().__init__(app)
                self.api_client = api_client

            async def dispatch(self, request, call_next):
                # Log all request headers for debugging
                logger.info(f"Request headers: {request.headers}")

                # Skip auth for metadata endpoints
                if request.url.path in [
                    "/.well-known/oauth-protected-resource",
                    "/.well-known/oauth-authorization-server",
                    "/.well-known/oauth-protected-resource/mcp",
                    "/.well-known/oauth-authorization-server/mcp",
                ]:
                    return await call_next(request)

                # Check for Authorization header or x-api-key header
                auth_header = request.headers.get("Authorization")
                api_key = request.headers.get("x-api-key")
                
                token = None
                auth_method = None
                
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header[7:]
                    auth_method = "bearer"
                elif api_key:
                    # Check if this is service-to-service authentication with MCP_API_TOKEN
                    if api_key == self.api_client.config.mcp_api_token:
                        token = api_key
                        auth_method = "service"
                    else:
                        token = api_key
                        auth_method = "api_key"
                else:
                    return JSONResponse(
                        status_code=401,
                        content={"error": "unauthorized", "error_description": "Access token required"},
                        headers={
                            "WWW-Authenticate": f'Bearer realm="{self.api_client.config.base_url}", '
                                              f'authorization_uri="{self.api_client.config.base_url}/api/oauth/authorize", '
                                              f'resource="{request.base_url}"'
                        }
                    )
                
                # Log authentication method and token
                logger.info(f"Using {auth_method} authentication: {token[:10]}...")
                
                try:
                    # Handle different authentication methods
                    if auth_method == "service":
                        # Service-to-service authentication - skip user validation
                        logger.info("Service-to-service authentication validated")
                        request.state.user = {"service": True, "email": "service@mcp-server"}
                        request.state.token = token
                        token_context.set(token)
                    else:
                        # User token validation for bearer and api_key methods
                        auth_api_url = f"{self.api_client.config.base_url}/api/auth/me"
                        
                        # Use appropriate header format based on auth method
                        if auth_method == "bearer":
                            headers = {"Authorization": f"Bearer {token}"}
                        else:  # api_key
                            headers = {"x-api-key": token}
                        
                        logger.info(f"Attempting to validate {auth_method} token with Business Logic API at: {auth_api_url}")

                        import httpx
                        async with httpx.AsyncClient() as client:
                            response = await client.get(auth_api_url, headers=headers)
                        
                        response.raise_for_status() # Raises exception for 4xx/5xx responses
                        
                        user_data = response.json()
                        logger.info(f"Token validated successfully for user: {user_data.get('email')}")

                        # Store user info and token in request state
                        request.state.user = user_data
                        request.state.token = token
                        
                        # Set token in context var for access in tool calls
                        token_context.set(token)
                        
                except httpx.HTTPStatusError as e:
                    logger.warning(f"Token validation failed. API returned status {e.response.status_code}")
                    return JSONResponse(
                        status_code=401,
                        content={"error": "invalid_token", "error_description": "The access token is invalid or expired"},
                        headers={
                            "WWW-Authenticate": f'Bearer realm="{self.api_client.config.base_url}", '
                                              f'error="invalid_token"'
                        }
                    )
                except Exception as e:
                    logger.error(f"An unexpected error occurred during token validation: {e}")
                    return JSONResponse(
                        status_code=500,
                        content={"error": "server_error", "error_description": "Could not process token validation"},
                    )
                
                response = await call_next(request)
                # Log all response headers for debugging
                logger.info(f"Response headers: {response.headers}")

                # Ensure redirects use HTTPS in Cloud Run
                if response.status_code == 307 and "location" in response.headers:
                    location = response.headers["location"]
                    if location.startswith("http://") and "run.app" in location:
                        response.headers["location"] = location.replace("http://", "https://")
                        logger.info(f"Rewrote redirect location to HTTPS: {response.headers['location']}")

                return response

        routes = [
            # Mount the MCP application with a trailing slash to enforce consistent URL handling.
            # Starlette will automatically redirect requests to /mcp to /mcp/.
            Mount("/mcp/", app=mcp_app),
            Route("/.well-known/oauth-protected-resource", oauth_protected_resource_metadata, methods=["GET"]),
            Route("/.well-known/oauth-protected-resource/mcp", redirect_to_metadata, methods=["GET"]),
        ]
        
        app = Starlette(routes=routes, lifespan=lifespan)
        
        # Add auth middleware
        app.add_middleware(AuthMiddleware, api_client=self.api_client)
        
        # Add CORS middleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        config = uvicorn.Config(
            app, 
            host=self.config.server.host,
            port=self.config.server.port,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()
    
    async def cleanup(self):
        """Cleanup resources."""
        await self.api_client.close()
    
async def main():
    """Main entry point."""
    server = None
    try:
        config = AppConfig.from_env()
        server = VirionLabsMCPServer(config)
        await server.run()
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        raise
    finally:
        if server:
            await server.cleanup()

if __name__ == "__main__":
    asyncio.run(main()) 