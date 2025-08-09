"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from "@/components/auth-provider"
import type { Product, CreateProductData, UpdateProductData, ProductValidationErrors, ProductFormData } from "@/schemas/product"

interface ProductListResponse {
  products: Product[]
}

interface APIError {
  detail?: string
  message?: string
  errors?: Record<string, string[]>
}

export function useProductsAPI() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ProductValidationErrors | null>(null)

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/operations`
  const getToken = () => localStorage.getItem('auth_token')

  const handleAPIError = (err: unknown): string => {
    if (err instanceof Error) {
      try {
        const errorData: APIError = JSON.parse(err.message)
        return errorData.detail || errorData.message || err.message
      } catch {
        return err.message
      }
    }
    return 'An unknown error occurred'
  }

  const validateProductData = (data: Partial<ProductFormData>): ProductValidationErrors => {
    const errors: ProductValidationErrors = {}
    
    if (!data.name?.trim()) {
      errors.name = ['Product name is required']
    } else if (data.name.length > 100) {
      errors.name = ['Product name must be less than 100 characters']
    }

    if (data.description && data.description.length > 500) {
      errors.description = ['Description must be less than 500 characters']
    }

    if (data.sku && (data.sku.length > 50 || !/^[a-zA-Z0-9-_]+$/.test(data.sku))) {
      errors.sku = ['SKU must be alphanumeric with hyphens/underscores only (max 50 chars)']
    }

    if (data.price !== undefined && data.price !== '') {
      const price = typeof data.price === 'string' ? parseFloat(data.price) : data.price
      if (isNaN(price) || price < 0) {
        errors.price = ['Price must be a positive number']
      }
    }

    return errors
  }

  const fetchProducts = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setValidationErrors(null)

      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(JSON.stringify(errorData))
      }

      const data: ProductListResponse = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Server will infer client from session for Client role

  // Enhanced create product with validation (returns result object)
  const createProductEnhanced = useCallback(async (
    formData: ProductFormData
  ): Promise<{ success: boolean; product?: Product; errors?: ProductValidationErrors }> => {
    try {
      setValidationErrors(null)
      
      // Validate form data
      const validationErrors = validateProductData(formData)
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors(validationErrors)
        return { success: false, errors: validationErrors }
      }

      const token = getToken()
      if (!token) throw new Error("Authentication token not found.")

      const payload: CreateProductData = { 
        name: formData.name,
        // client omitted; server resolves when role === Client
        description: formData.description || undefined,
        sku: formData.sku || undefined,
        price: formData.price ? (typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price) : undefined
      }

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(JSON.stringify(errorData))
      }

      const created = await response.json()
      await fetchProducts()
      return { success: true, product: created }
    } catch (err) {
      const error = handleAPIError(err)
      setError(error)
      return { success: false, errors: { general: [error] } }
    }
  }, [fetchProducts, validateProductData])

  // Original simple create product (for backward compatibility)
  const createProduct = useCallback(async (
    name: string, 
    opts?: Partial<Pick<Product, 'description' | 'sku' | 'price'>>
  ): Promise<Product> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const payload: CreateProductData = { name, ...opts }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to create product')
    }

    const created = await response.json()
    const mapped: Product = { id: created.id, documentId: created.documentId, name: created.name }
    await fetchProducts()
    return mapped
  }, [fetchProducts])

  useEffect(() => {
    if (user) fetchProducts()
  }, [user, fetchProducts])

  const updateProduct = useCallback(async (
    productIdOrDocId: string,
    formData: Partial<ProductFormData>
  ): Promise<{ success: boolean; product?: Product; errors?: ProductValidationErrors }> => {
    try {
      setValidationErrors(null)
      
      // Validate form data
      const validationErrors = validateProductData(formData)
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors(validationErrors)
        return { success: false, errors: validationErrors }
      }

      const token = getToken()
      if (!token) throw new Error("Authentication token not found.")

      const updates: UpdateProductData = {}
      if (formData.name !== undefined) updates.name = formData.name
      if (formData.description !== undefined) updates.description = formData.description
      if (formData.sku !== undefined) updates.sku = formData.sku
      if (formData.price !== undefined && formData.price !== '') {
        updates.price = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price
      }

      const response = await fetch(`${API_BASE_URL}/products/${productIdOrDocId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(JSON.stringify(errorData))
      }

      const updated = await response.json()
      await fetchProducts()
      return { success: true, product: updated }
    } catch (err) {
      const error = handleAPIError(err)
      setError(error)
      return { success: false, errors: { general: [error] } }
    }
  }, [fetchProducts, validateProductData])

  const deleteProduct = useCallback(async (productIdOrDocId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = getToken()
      if (!token) throw new Error("Authentication token not found.")

      const response = await fetch(`${API_BASE_URL}/products/${productIdOrDocId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(JSON.stringify(errorData))
      }
      
      await fetchProducts()
      return { success: true }
    } catch (err) {
      const error = handleAPIError(err)
      setError(error)
      return { success: false, error }
    }
  }, [fetchProducts])

  const clearValidationErrors = useCallback(() => {
    setValidationErrors(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { 
    products, 
    loading, 
    error, 
    validationErrors,
    refresh: fetchProducts, 
    createProduct,
    createProductEnhanced,
    updateProduct, 
    deleteProduct,
    clearValidationErrors,
    clearError,
    validateProductData
  }
}
