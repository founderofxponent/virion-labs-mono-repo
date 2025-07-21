"""
Dynamic function registry that discovers and executes API endpoints
from the main API's OpenAPI schema.
"""
import logging
import pydantic
from typing import Dict, Any, Optional, Type
from .api_client import APIClient
from datetime import datetime

logger = logging.getLogger(__name__)

class DynamicFunctionRegistry:
    """
    Manages functions discovered from the API's OpenAPI schema.
    """

    def __init__(self, api_client: APIClient):
        self._api_client = api_client
        self._registry: Dict[str, Any] = {}
        self._schemas: Dict[str, Any] = {}

    async def initialize(self):
        """
        Fetches the OpenAPI schema and builds the function registry.
        """
        try:
            openapi_schema = await self._api_client.get_openapi_schema()
            self._build_registry(openapi_schema)
        except Exception as e:
            logger.error(f"Failed to initialize dynamic function registry: {e}")
            raise

    def _build_registry(self, openapi_schema: Dict[str, Any]):
        """
        Parses the OpenAPI schema and populates the registry.
        """
        self._schemas = openapi_schema.get("components", {}).get("schemas", {})
        paths = openapi_schema.get("paths", {})

        for path, path_item in paths.items():
            for method, operation in path_item.items():
                if operation.get("deprecated"):
                    continue

                # We only support POST, GET, PATCH, DELETE for now
                if method.upper() not in ["POST", "GET", "PATCH", "DELETE", "PUT"]:
                    continue

                function_name = self._generate_function_name(operation, method, path)
                
                # Extract path parameters
                path_params = {
                    param["name"]: param["schema"]
                    for param in operation.get("parameters", [])
                    if param["in"] == "path"
                }

                self._registry[function_name] = {
                    "path": path,
                    "method": method.upper(),
                    "operation": operation,
                    "path_params": path_params,
                    "request_body_schema": self._extract_request_body_schema(operation),
                }
        logger.info(f"Built registry with {len(self._registry)} functions.")

    def _generate_function_name(self, operation: Dict[str, Any], method: str, path: str) -> str:
        """
        Generates a descriptive function name from the operation details.
        e.g., "api.users.get_user_by_id"
        """
        if operation.get("operationId"):
            # Format: get_user_api_users__user_id__get -> api.users.get_user
            op_id = operation["operationId"]
            # Example: handle_access_request_api_admin_access_requests_post -> admin.handle_access_request
            clean_op_id = op_id.replace("_api", "").replace("_", ".")
            parts = clean_op_id.split('.')
            if len(parts) > 2:
                # Reassemble a more readable name
                action = parts[0]
                tag = parts[1] if parts[1] not in ['api', 'models'] else parts[2]
                return f"{tag}.{action}"


        tags = operation.get("tags", ["default"])
        # Fallback to path-based naming
        # e.g., /api/users/{user_id} -> api.users.get_by_id
        clean_path = path.replace("/api/", "").replace("/", ".").replace("{", "_").replace("}", "_")
        return f"{tags[0].lower()}.{method.lower()}{clean_path}"


    def _extract_request_body_schema(self, operation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extracts the JSON schema for the request body.
        """
        request_body = operation.get("requestBody")
        if not request_body:
            return None

        content = request_body.get("content", {})
        json_content = content.get("application/json", {})
        schema_ref = json_content.get("schema", {}).get("$ref")

        if not schema_ref:
            return json_content.get("schema") # Return inline schema if present

        schema_name = schema_ref.split("/")[-1]
        return self._schemas.get(schema_name)

    def list_functions(self) -> Dict[str, Any]:
        """
        Lists all available functions with their descriptions.
        """
        return {
            "functions": {
                name: {
                    "description": details["operation"].get("summary") or details["operation"].get("description", "No description available."),
                    "category": details["operation"].get("tags", ["default"])[0]
                }
                for name, details in self._registry.items()
            },
            "total_count": len(self._registry)
        }

    def get_function_details(self, function_name: str) -> Dict[str, Any]:
        """
        Gets detailed information about a specific function.
        """
        if function_name not in self._registry:
            raise ValueError(f"Function '{function_name}' not found.")
        
        details = self._registry[function_name]
        return {
            "name": function_name,
            "description": details["operation"].get("summary"),
            "request_body_schema": details.get("request_body_schema"),
            "path_parameters": details.get("path_params"),
            "path": details.get("path"),
            "method": details.get("method"),
        }

    async def execute_function(self, function_name: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes a function by validating parameters and making an API call.
        """
        if function_name not in self._registry:
            available = ", ".join(self._registry.keys())
            raise ValueError(f"Function '{function_name}' not found. Available functions: {available}")

        function_details = self._registry[function_name]
        body_schema = function_details.get("request_body_schema")
        path_params_schema = function_details.get("path_params")
        
        body_data = None
        query_params = None
        
        # 1. Validate and prepare body data
        if body_schema:
            try:
                # Create a dynamic Pydantic model from the schema for validation
                model_name = body_schema.get("title", "DynamicModel")
                DynamicModel = self.create_pydantic_model_from_schema(model_name, body_schema)
                
                # Filter only the parameters relevant for the body
                body_params = {k: v for k, v in (parameters or {}).items() if k in DynamicModel.model_fields}
                model_instance = DynamicModel(**body_params)
                body_data = model_instance.model_dump()
            except pydantic.ValidationError as e:
                logger.error(f"Body parameter validation failed for {function_name}: {e}")
                raise ValueError(f"Invalid body parameters for {function_name}: {e}")
            except Exception as e:
                logger.error(f"An unexpected error occurred during body validation for {function_name}: {e}")
                raise

        # 2. Prepare path and query parameters
        path = function_details["path"]
        method = function_details["method"]

        # Substitute path parameters
        if path_params_schema and parameters:
            for param_name, param_value in parameters.items():
                if param_name in path_params_schema:
                    path = path.replace(f"{{{param_name}}}", str(param_value))

        # Separate query parameters for GET requests
        if method == "GET" and parameters:
            query_params = {k: v for k, v in parameters.items() if k not in (path_params_schema or {})}


        return await self._api_client._make_request(
            method=method,
            endpoint=path,
            data=body_data,
            params=query_params,
        )

    def create_pydantic_model_from_schema(self, model_name: str, schema: Dict[str, Any]) -> Type[pydantic.BaseModel]:
        """
        Dynamically creates a Pydantic model from a JSON schema definition.
        """
        fields = {}
        for prop_name, prop_details in schema.get("properties", {}).items():
            field_type = self._get_python_type(prop_details)
            # Handle required fields vs. optional
            if prop_name in schema.get("required", []):
                fields[prop_name] = (field_type, ...)
            else:
                fields[prop_name] = (Optional[field_type], None)
        
        return pydantic.create_model(model_name, **fields)

    def _get_python_type(self, prop_details: Dict[str, Any]) -> Type:
        """
        Maps JSON schema types to Python types.
        """
        type_mapping = {
            "string": str,
            "number": float,
            "integer": int,
            "boolean": bool,
            "array": list,
            "object": dict,
        }
        json_type = prop_details.get("type")

        if "uuid" in prop_details.get("format", ""):
            return pydantic.UUID4

        if "date-time" in prop_details.get("format", ""):
            return datetime

        return type_mapping.get(json_type, Any)

    def count(self) -> int:
        return len(self._registry) 