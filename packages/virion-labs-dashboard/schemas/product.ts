export interface Media {
  id: number
  url: string
  name: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  formats?: Record<string, any>
  hash: string
  ext: string
}

export interface ProductClient {
  id: number
  documentId?: string
  name: string
  contact_email?: string
  industry?: string
  client_status?: 'active' | 'inactive'
  website?: string
  primary_contact?: string
}

export interface Product {
  id: number
  documentId?: string
  name: string
  description?: string
  sku?: string
  price?: number
  images?: Media[]
  client?: ProductClient
  createdAt?: string
  updatedAt?: string
}

export type CreateProductData = {
  name: string
  client?: number // Server resolves for authenticated clients
  description?: string
  sku?: string
  price?: number
}

export type UpdateProductData = Partial<{
  name: string
  description: string
  sku: string
  price: number
  client: number
}>

export interface ProductFormData {
  name: string
  description: string
  sku: string
  price: string | number
}

export interface ProductValidationErrors {
  name?: string[]
  description?: string[]
  sku?: string[]
  price?: string[]
  general?: string[]
}
