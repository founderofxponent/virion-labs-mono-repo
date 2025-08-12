from typing import Dict, Any, List, Optional
from core.strapi_client import strapi_client
from core.auth import StrapiUser as User
from fastapi import HTTPException
from schemas.strapi import Product, StrapiProductCreate, StrapiProductUpdate


class ProductService:
    async def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Product]:
        return await strapi_client.get_products(filters)

    async def create(self, payload: Dict[str, Any], current_user: Optional[User] = None) -> Product:
        if current_user and getattr(current_user, 'role', {}).get('name') not in ['Client', 'Platform Administrator', 'admin']:
            raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions to create products.")
        create_payload = StrapiProductCreate(**payload)
        return await strapi_client.create_product(create_payload)

    async def update(self, document_id: str, payload: Dict[str, Any], current_user: Optional[User] = None) -> Product:
        if current_user and getattr(current_user, 'role', {}).get('name') not in ['Client', 'Platform Administrator', 'admin']:
            raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions to update products.")
        update_payload = StrapiProductUpdate(**payload)
        return await strapi_client.update_product(document_id, update_payload)

    async def delete(self, document_id: str, current_user: Optional[User] = None) -> Dict[str, Any]:
        if current_user and getattr(current_user, 'role', {}).get('name') not in ['Client', 'Platform Administrator', 'admin']:
            raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions to delete products.")
        return await strapi_client.delete_product(document_id)


product_service = ProductService()

