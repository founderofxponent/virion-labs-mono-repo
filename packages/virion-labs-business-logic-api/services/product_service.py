from typing import Dict, Any, List, Optional
from core.strapi_client import strapi_client
from schemas.strapi import Product, StrapiProductCreate, StrapiProductUpdate


class ProductService:
    async def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Product]:
        return await strapi_client.get_products(filters)

    async def create(self, payload: Dict[str, Any]) -> Product:
        create_payload = StrapiProductCreate(**payload)
        return await strapi_client.create_product(create_payload)

    async def update(self, document_id: str, payload: Dict[str, Any]) -> Product:
        update_payload = StrapiProductUpdate(**payload)
        return await strapi_client.update_product(document_id, update_payload)


product_service = ProductService()

