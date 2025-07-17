"""
Refactored MCP Server with modular plugin-based architecture.
Leaner, more maintainable, and easily extensible.
"""

import asyncio
import logging
from fastmcp import FastMCP

from core.config import AppConfig
from core.api_client import APIClient
from core.plugin import registry
from functions.base import set_api_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VirionLabsMCPServer:
    """Main MCP server class with dependency injection."""
    
    def __init__(self, config: AppConfig):
        self.config = config
        self.api_client = APIClient(config.api)
        self.mcp = FastMCP("virion_labs_mcp_server")
        
        # Set the global API client for functions to use
        set_api_client(self.api_client)
        
        # Auto-discover and register plugins
        registry.auto_discover_plugins()
        
        # Register the universal tool
        self._register_universal_tool()
        
        logger.info("MCP Server initialized with API-based architecture")
    
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
    
    
    async def run(self):
        """Run the MCP server."""
        # Test API connection
        try:
            # Simple health check to test API connection
            await self.api_client._make_request("GET", "/status/health")
            logger.info("API connection successful")
        except Exception as e:
            logger.error(f"API connection failed: {e}")
            raise RuntimeError("API connection failed")
        
        logger.info(f"Starting server on {self.config.server.transport}:{self.config.server.port}")
        logger.info(f"Registered {len(registry.functions)} functions from {len(registry.plugins)} plugins")
        
        if self.config.server.transport == "stdio":
            await self.mcp.run_async(transport="stdio")
        else:
            await self.mcp.run_async(
                transport="http",
                host=self.config.server.host,
                port=self.config.server.port,
                path=self.config.server.path
            )
    
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