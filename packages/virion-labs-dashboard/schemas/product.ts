export interface Product {
  id: number
  documentId?: string
  name: string
  description?: string
  sku?: string
  price?: number
  // images and client are omitted in list response but kept for type completeness
  images?: any[]
  client?: any
}

export type CreateProductData = {
  name: string
  client: number // Strapi numeric ID for the client
}

export type UpdateProductData = Partial<{
  name: string
  description: string
  sku: string
  price: number
  client: number
}>
