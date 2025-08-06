"""Middleware system for common functionality."""

import logging
import asyncio
import inspect
from typing import Dict, Any, Callable, Union
from functools import wraps
from datetime import datetime

logger = logging.getLogger(__name__)


def error_handler(func: Callable) -> Callable:
    """Middleware for consistent error handling."""
    if inspect.iscoroutinefunction(func):
        @wraps(func)
        async def async_wrapper(params: Dict[str, Any]) -> Dict[str, Any]:
            try:
                result = await func(params)
                return result
            except Exception as e:
                logger.error(f"Error in {func.__name__}: {e}")
                return {"error": f"Error executing {func.__name__}: {str(e)}"}
        return async_wrapper
    else:
        @wraps(func)
        def sync_wrapper(params: Dict[str, Any]) -> Dict[str, Any]:
            try:
                result = func(params)
                return result
            except Exception as e:
                logger.error(f"Error in {func.__name__}: {e}")
                return {"error": f"Error executing {func.__name__}: {str(e)}"}
        return sync_wrapper


def logger_middleware(func: Callable) -> Callable:
    """Middleware for logging function calls."""
    if inspect.iscoroutinefunction(func):
        @wraps(func)
        async def async_wrapper(params: Dict[str, Any]) -> Dict[str, Any]:
            start_time = datetime.now()
            function_name = func.__name__
            
            logger.info(f"Executing {function_name} with params: {params}")
            
            result = await func(params)
            
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"Function {function_name} completed in {duration:.2f}s")
            
            return result
        return async_wrapper
    else:
        @wraps(func)
        def sync_wrapper(params: Dict[str, Any]) -> Dict[str, Any]:
            start_time = datetime.now()
            function_name = func.__name__
            
            logger.info(f"Executing {function_name} with params: {params}")
            
            result = func(params)
            
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"Function {function_name} completed in {duration:.2f}s")
            
            return result
        return sync_wrapper


def validation_middleware(required_params: list = None):
    """Middleware for parameter validation."""
    def decorator(func: Callable) -> Callable:
        if inspect.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(params: Dict[str, Any]) -> Dict[str, Any]:
                if required_params:
                    missing_params = [param for param in required_params if param not in params]
                    if missing_params:
                        return {"error": f"Missing required parameters: {missing_params}"}
                return await func(params)
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(params: Dict[str, Any]) -> Dict[str, Any]:
                if required_params:
                    missing_params = [param for param in required_params if param not in params]
                    if missing_params:
                        return {"error": f"Missing required parameters: {missing_params}"}
                return func(params)
            return sync_wrapper
    return decorator


def apply_middleware(func: Callable, middleware_stack: list = None) -> Callable:
    """Apply middleware stack to a function."""
    if middleware_stack is None:
        middleware_stack = [error_handler, logger_middleware]
    
    # Remember if the original function was async
    original_is_async = inspect.iscoroutinefunction(func)
    
    for middleware in reversed(middleware_stack):
        func = middleware(func)
    
    # Ensure the final function preserves async nature
    if original_is_async and not inspect.iscoroutinefunction(func):
        logger.warning(f"Middleware broke async nature of function {func.__name__}")
    
    return func