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
from starlette.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from starlette.requests import Request
import os
import mcp.types as types
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager

from core.config import AppConfig
from core.api_client import APIClient
from core.plugin import registry
from functions.base import set_api_client
from auth import SimpleOAuthProvider, TokenVerifier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VirionLabsMCPServer:
    """Main MCP server class with dependency injection."""
    
    def __init__(self, config: AppConfig):
        self.config = config
        self.api_client = APIClient(config.api)
        
        # Initialize both FastMCP (for stdio) and low-level server (for streamable HTTP)
        self.mcp = FastMCP("virion_labs_mcp_server")
        self.lowlevel_server = Server("virion_labs_mcp_server")
        
        # Set the global API client for functions to use
        set_api_client(self.api_client)
        
        # Auto-discover and register plugins
        registry.auto_discover_plugins()
        
        # Initialize authentication
        server_url = os.getenv("SERVER_URL", f"https://virion-labs-mcp-server-1089869749234.us-central1.run.app")
        self.auth_provider = SimpleOAuthProvider(server_url)
        self.token_verifier = TokenVerifier(
            f"{server_url}/oauth/introspect",
            f"{server_url}/mcp/"
        )
        
        # Register tools on both servers
        self._register_universal_tool()
        self._register_lowlevel_tools()
        
        logger.info("MCP Server initialized with API-based architecture and OAuth authentication")
    
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
                if function_name not in registry.functions:
                    available_functions = registry.list_functions()
                    return {
                        "error": f"Unknown function '{function_name}'. Available: {available_functions}"
                    }
                
                func = registry.get_function(function_name)
                params = parameters or {}
                
                # Check if function is async
                import inspect
                if inspect.iscoroutinefunction(func):
                    result = await func(params)
                else:
                    # For sync functions, run them in the event loop
                    result = await asyncio.get_event_loop().run_in_executor(None, func, params)
                
                return result
                
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
            try:
                functions_info = {}
                for name, func_spec in registry.functions.items():
                    functions_info[name] = {
                        "description": func_spec.description,
                        "category": func_spec.category
                    }
                
                return {
                    "functions": functions_info,
                    "total_count": len(registry.functions)
                }
                
            except Exception as e:
                logger.error(f"Error listing functions: {e}")
                return {"error": f"Error listing functions: {str(e)}"}
        
        @self.mcp.tool()
        def get_function_details(function_name: str) -> dict:
            """
            Gets detailed information about a specific function including parameters.
            
            Args:
                function_name: Name of the function to get details for
                
            Returns:
                Dictionary containing function details, parameters, and usage information
            """
            try:
                if function_name not in registry.functions:
                    available_functions = registry.list_functions()
                    return {
                        "error": f"Function '{function_name}' not found. Available functions: {available_functions}"
                    }
                
                func_spec = registry.functions[function_name]
                
                # Use JSON schema as primary source of truth
                schema = func_spec.schema if func_spec.schema else {"type": "object", "properties": {}}
                
                # Extract parameter information from schema
                parameters_info = {}
                required_params = schema.get("required", [])
                properties = schema.get("properties", {})
                
                for param_name, param_schema in properties.items():
                    param_info = {
                        "type": param_schema.get("type", "unknown"),
                        "description": param_schema.get("description", ""),
                        "required": param_name in required_params
                    }
                    
                    # Add additional schema constraints
                    if "enum" in param_schema:
                        param_info["enum"] = param_schema["enum"]
                    if "format" in param_schema:
                        param_info["format"] = param_schema["format"]
                    if "pattern" in param_schema:
                        param_info["pattern"] = param_schema["pattern"]
                    if "items" in param_schema:
                        param_info["items"] = param_schema["items"]
                    if "properties" in param_schema:
                        param_info["properties"] = param_schema["properties"]
                    if "default" in param_schema:
                        param_info["default"] = param_schema["default"]
                    
                    parameters_info[param_name] = param_info
                
                # Get docstring for additional context
                import inspect
                docstring = inspect.getdoc(func_spec.func) or "No documentation available"
                
                return {
                    "name": func_spec.name,
                    "description": func_spec.description,
                    "category": func_spec.category,
                    "parameters": parameters_info,
                    "schema": schema,
                    "docstring": docstring,
                    "usage_notes": [
                        "Pass parameters as a dictionary matching the schema structure",
                        "All required parameters must be provided",
                        "Optional parameters can be omitted or set to null",
                        "Follow the specified types and formats exactly"
                    ]
                }
                
            except Exception as e:
                logger.error(f"Error getting function details: {e}")
                return {"error": f"Error getting function details: {str(e)}"}
    
    def _register_lowlevel_tools(self):
        """Register tools for the low-level server (streamable HTTP)."""
        
        @self.lowlevel_server.call_tool()
        async def call_tool(name: str, arguments: dict | None = None) -> list[types.TextContent]:
            """Handle tool calls for streamable HTTP."""
            try:
                if name == "execute_function":
                    function_name = arguments.get("function_name") if arguments else None
                    parameters = arguments.get("parameters") if arguments else None
                    
                    if not function_name:
                        return [types.TextContent(
                            type="text",
                            text='{"error": "function_name is required"}'
                        )]
                    
                    if function_name not in registry.functions:
                        available_functions = registry.list_functions()
                        return [types.TextContent(
                            type="text",
                            text=f'{{"error": "Unknown function \'{function_name}\'. Available: {available_functions}"}}'
                        )]
                    
                    func = registry.get_function(function_name)
                    params = parameters or {}
                    
                    import inspect
                    if inspect.iscoroutinefunction(func):
                        result = await func(params)
                    else:
                        result = await asyncio.get_event_loop().run_in_executor(None, func, params)
                    
                    import json
                    return [types.TextContent(type="text", text=json.dumps(result))]
                
                elif name == "list_functions":
                    functions_info = {}
                    for func_name, func_spec in registry.functions.items():
                        functions_info[func_name] = {
                            "description": func_spec.description,
                            "category": func_spec.category
                        }
                    
                    result = {
                        "functions": functions_info,
                        "total_count": len(registry.functions)
                    }
                    import json
                    return [types.TextContent(type="text", text=json.dumps(result))]
                
                elif name == "get_function_details":
                    function_name = arguments.get("function_name") if arguments else None
                    
                    if not function_name:
                        return [types.TextContent(
                            type="text",
                            text='{"error": "function_name is required"}'
                        )]
                    
                    if function_name not in registry.functions:
                        available_functions = registry.list_functions()
                        return [types.TextContent(
                            type="text",
                            text=f'{{"error": "Function \'{function_name}\' not found. Available functions: {available_functions}"}}'
                        )]
                    
                    func_spec = registry.functions[function_name]
                    schema = func_spec.schema if func_spec.schema else {"type": "object", "properties": {}}
                    
                    parameters_info = {}
                    required_params = schema.get("required", [])
                    properties = schema.get("properties", {})
                    
                    for param_name, param_schema in properties.items():
                        param_info = {
                            "type": param_schema.get("type", "unknown"),
                            "description": param_schema.get("description", ""),
                            "required": param_name in required_params
                        }
                        
                        for key in ["enum", "format", "pattern", "items", "properties", "default"]:
                            if key in param_schema:
                                param_info[key] = param_schema[key]
                        
                        parameters_info[param_name] = param_info
                    
                    import inspect
                    docstring = inspect.getdoc(func_spec.func) or "No documentation available"
                    
                    result = {
                        "name": func_spec.name,
                        "description": func_spec.description,
                        "category": func_spec.category,
                        "parameters": parameters_info,
                        "schema": schema,
                        "docstring": docstring,
                        "usage_notes": [
                            "Pass parameters as a dictionary matching the schema structure",
                            "All required parameters must be provided",
                            "Optional parameters can be omitted or set to null",
                            "Follow the specified types and formats exactly"
                        ]
                    }
                    import json
                    return [types.TextContent(type="text", text=json.dumps(result))]
                
                else:
                    return [types.TextContent(
                        type="text",
                        text=f'{{"error": "Unknown tool: {name}"}}'
                    )]
                    
            except Exception as e:
                logger.error(f"Error in tool call {name}: {e}")
                import json
                return [types.TextContent(
                    type="text",
                    text=json.dumps({"error": f"Error in tool call {name}: {str(e)}"})
                )]
        
        @self.lowlevel_server.list_tools()
        async def list_tools() -> list[types.Tool]:
            """List available tools for streamable HTTP."""
            return [
                types.Tool(
                    name="execute_function",
                    description="Universal tool that executes functions from registered plugins",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "function_name": {
                                "type": "string",
                                "description": "Name of the function to execute"
                            },
                            "parameters": {
                                "type": "object",
                                "description": "Function parameters",
                                "additionalProperties": True
                            }
                        },
                        "required": ["function_name"]
                    }
                ),
                types.Tool(
                    name="list_functions",
                    description="Lists all available functions with their descriptions and required parameters",
                    inputSchema={
                        "type": "object",
                        "properties": {}
                    }
                ),
                types.Tool(
                    name="get_function_details",
                    description="Gets detailed information about a specific function including parameters",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "function_name": {
                                "type": "string",
                                "description": "Name of the function to get details for"
                            }
                        },
                        "required": ["function_name"]
                    }
                )
            ]
    
    async def run(self):
        """Run the MCP server."""
        # Test API connection (allow failure for Cloud Run deployment)
        try:
            # Simple health check to test API connection
            await self.api_client._make_request("GET", "/status/health")
            logger.info("API connection successful")
        except Exception as e:
            logger.warning(f"API connection failed during startup: {e}")
            logger.info("Continuing startup - API connection will be retried on first request")
        
        logger.info(f"Starting server on {self.config.server.transport}:{self.config.server.port}")
        logger.info(f"Registered {len(registry.functions)} functions from {len(registry.plugins)} plugins")
        
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
        """Run the server using Streamable HTTP protocol."""
        
        # Create session manager
        session_manager = StreamableHTTPSessionManager(
            app=self.lowlevel_server,
            event_store=None,
            json_response=self.config.server.json_response,
            stateless=True
        )
        
        # Authentication middleware for MCP endpoints
        class AuthMiddleware(BaseHTTPMiddleware):
            def __init__(self, app, token_verifier):
                super().__init__(app)
                self.token_verifier = token_verifier
            
            async def dispatch(self, request: Request, call_next):
                # Skip auth for OAuth endpoints and well-known config
                if request.url.path.startswith('/oauth/') or request.url.path == '/.well-known/oauth-authorization-server':
                    return await call_next(request)
                
                # Skip auth for non-MCP endpoints
                if not request.url.path.startswith('/mcp/'):
                    return await call_next(request)
                
                # Check for Authorization header
                auth_header = request.headers.get("Authorization")
                if not auth_header or not auth_header.startswith("Bearer "):
                    response = JSONResponse({"error": "unauthorized"}, status_code=401)
                    response.headers["WWW-Authenticate"] = f'Bearer realm="{self.token_verifier.audience}", error="invalid_request", error_description="Authorization header required"'
                    return response
                
                token = auth_header[7:]  # Remove "Bearer " prefix
                access_token = await self.token_verifier.verify_token(token)
                
                if not access_token:
                    response = JSONResponse({"error": "invalid_token"}, status_code=401)
                    response.headers["WWW-Authenticate"] = f'Bearer realm="{self.token_verifier.audience}", error="invalid_token", error_description="The access token is invalid"'
                    return response
                
                # Add user info to request state
                request.state.user = access_token
                return await call_next(request)
        
        # Create lifespan context manager
        @asynccontextmanager
        async def lifespan(_app):
            async with session_manager.run():
                logger.info("Starting MCP Streamable HTTP server...")
                yield
                logger.info("Shutting down MCP Streamable HTTP server...")
        
        # Create ASGI app for handling MCP requests
        async def mcp_app(scope, receive, send):
            # Normalize the path to remove the /mcp prefix for the session manager
            if scope["type"] == "http":
                # Clone scope and modify path
                new_scope = dict(scope)
                path = scope.get("path", "/")
                if path.startswith("/mcp"):
                    new_scope["path"] = path[4:] or "/"  # Remove /mcp prefix
                await session_manager.handle_request(new_scope, receive, send)
            else:
                # Handle WebSocket connections if needed
                await session_manager.handle_websocket(scope, receive, send)
        
        # OAuth endpoint handlers
        async def wellknown_oauth(request):
            response = await self.auth_provider.get_wellknown_config()
            # Add protocol version header per MCP spec
            response.headers["X-MCP-Protocol-Version"] = "2025-01-01"
            return response
        
        async def wellknown_oauth_protected_resource(request):
            """OAuth 2.0 Protected Resource Metadata as required by MCP spec."""
            server_url = self.auth_provider.server_url
            return JSONResponse({
                "resource": f"{server_url}/mcp/",
                "authorization_servers": [server_url],
                "scopes_supported": ["mcp:tools", "mcp:resources"],
                "bearer_methods_supported": ["header"],
                "resource_documentation": f"{server_url}/docs"
            })
        
        async def oauth_register(request):
            if request.method == "POST":
                redirect_uris = None
                
                # Debug logging
                logger.info(f"Client registration request - Content-Type: {request.headers.get('content-type')}")
                
                # Try to get redirect_uris from JSON body first
                try:
                    if request.headers.get("content-type", "").startswith("application/json"):
                        body = await request.json()
                        logger.info(f"JSON body received: {body}")
                        redirect_uris = body.get("redirect_uris")
                        logger.info(f"redirect_uris from JSON: {redirect_uris} (type: {type(redirect_uris)})")
                except Exception as e:
                    logger.error(f"Error parsing JSON body: {e}")
                
                # Fall back to form data
                if not redirect_uris:
                    try:
                        form = await request.form()
                        logger.info(f"Form data: {dict(form)}")
                        redirect_uris_form = form.get("redirect_uris")
                        logger.info(f"redirect_uris from form: {redirect_uris_form}")
                        if redirect_uris_form:
                            # Convert string to array for consistency
                            redirect_uris = [redirect_uris_form] if isinstance(redirect_uris_form, str) else redirect_uris_form
                    except Exception as e:
                        logger.error(f"Error parsing form data: {e}")
                
                # Validate redirect_uris
                if not redirect_uris:
                    logger.error("No redirect_uris found in request")
                    return JSONResponse({"error": "invalid_request", "error_description": "redirect_uris is required"}, status_code=400)
                
                if not isinstance(redirect_uris, list):
                    logger.error(f"redirect_uris must be an array, got {type(redirect_uris)}")
                    return JSONResponse({"error": "invalid_request", "error_description": "redirect_uris must be an array"}, status_code=400)
                
                if len(redirect_uris) == 0:
                    logger.error("redirect_uris array is empty")
                    return JSONResponse({"error": "invalid_request", "error_description": "redirect_uris array cannot be empty"}, status_code=400)
                
                logger.info(f"Using redirect_uris: {redirect_uris}")
                client_info = await self.auth_provider.register_client(redirect_uris)
                logger.info(f"Client registered successfully: {client_info['client_id']}")
                return JSONResponse(client_info)
                    
            return JSONResponse({"error": "invalid_request", "error_description": "Only POST method is supported"}, status_code=405)
        
        async def oauth_authorize(request):
            return await self.auth_provider.authorize(request)
        
        async def login_callback(request):
            return await self.auth_provider.login_callback(request)
        
        async def oauth_callback(request):
            return await self.auth_provider.callback(request)
        
        async def oauth_token(request):
            return await self.auth_provider.exchange_token(request)
        
        async def oauth_introspect(request):
            return await self.auth_provider.introspect_token(request)
        
        # Create Starlette ASGI application
        starlette_app = Starlette(
            debug=True,
            routes=[
                Route("/.well-known/oauth-authorization-server", wellknown_oauth, methods=["GET"]),
                Route("/.well-known/oauth-protected-resource", wellknown_oauth_protected_resource, methods=["GET"]),
                Route("/.well-known/oauth-protected-resource/mcp", wellknown_oauth_protected_resource, methods=["GET"]),
                Route("/oauth/register", oauth_register, methods=["POST"]),
                Route("/oauth/authorize", oauth_authorize, methods=["GET"]),
                Route("/login/callback", login_callback, methods=["POST"]),
                Route("/oauth/callback", oauth_callback, methods=["GET"]),
                Route("/oauth/token", oauth_token, methods=["POST"]),
                Route("/oauth/introspect", oauth_introspect, methods=["POST"]),
                Mount("/mcp", app=mcp_app, name="mcp")
            ],
            lifespan=lifespan
        )
        
        # Add authentication middleware
        starlette_app.add_middleware(AuthMiddleware, token_verifier=self.token_verifier)
        
        # Add CORS middleware for browser-based MCP clients
        starlette_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Configure uvicorn
        uvicorn_config = uvicorn.Config(
            starlette_app,
            host=self.config.server.host,
            port=self.config.server.port,
            log_level=self.config.server.log_level.lower(),
            access_log=False
        )
        
        # Run the server
        server = uvicorn.Server(uvicorn_config)
        await server.serve()
    
    async def cleanup(self):
        """Cleanup resources."""
        await self.api_client.close()
        await self.token_verifier.close()


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