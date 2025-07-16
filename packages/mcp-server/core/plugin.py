"""Plugin system for modular function loading."""

import logging
import importlib
from typing import Dict, Callable, Any, List
from abc import ABC, abstractmethod
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class FunctionSpec:
    """Function specification for registration."""
    name: str
    func: Callable
    category: str
    description: str
    schema: Dict[str, Any] = None


class PluginBase(ABC):
    """Base class for plugins."""
    
    @property
    @abstractmethod
    def category(self) -> str:
        """Plugin category name."""
        pass
    
    @abstractmethod
    def get_functions(self) -> List[FunctionSpec]:
        """Return list of functions provided by this plugin."""
        pass


class PluginRegistry:
    """Registry for managing plugins and their functions."""
    
    def __init__(self):
        self.plugins: Dict[str, PluginBase] = {}
        self.functions: Dict[str, FunctionSpec] = {}
    
    def register_plugin(self, plugin: PluginBase):
        """Register a plugin."""
        category = plugin.category
        if category in self.plugins:
            logger.warning(f"Plugin category '{category}' already registered, overwriting")
        
        self.plugins[category] = plugin
        
        # Register functions from the plugin
        for func_spec in plugin.get_functions():
            if func_spec.name in self.functions:
                logger.warning(f"Function '{func_spec.name}' already registered, overwriting")
            self.functions[func_spec.name] = func_spec
        
        logger.info(f"Registered plugin: {category} with {len(plugin.get_functions())} functions")
    
    def get_function(self, name: str) -> Callable:
        """Get a function by name."""
        if name not in self.functions:
            raise ValueError(f"Function '{name}' not found")
        return self.functions[name].func
    
    def list_functions(self) -> List[str]:
        """List all registered function names."""
        return list(self.functions.keys())
    
    def get_functions_by_category(self, category: str) -> List[FunctionSpec]:
        """Get all functions for a specific category."""
        return [spec for spec in self.functions.values() if spec.category == category]
    
    def auto_discover_plugins(self, package_name: str = "functions"):
        """Auto-discover and register plugins from a package."""
        plugin_modules = [
            "campaign", "client", "referral", "access", "analytics"
        ]
        
        for module_name in plugin_modules:
            try:
                module = importlib.import_module(f"{package_name}.{module_name}")
                if hasattr(module, 'get_plugin'):
                    plugin = module.get_plugin()
                    self.register_plugin(plugin)
            except ImportError as e:
                logger.warning(f"Could not import plugin module {module_name}: {e}")
            except Exception as e:
                logger.error(f"Error loading plugin {module_name}: {e}")


# Global plugin registry instance
registry = PluginRegistry()