"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from "@/components/auth-provider"
import type { Product, CreateProductData } from "@/schemas/product"

interface ProductListResponse {
  products: Array<Pick<Product, 'id' | 'documentId' | 'name'>>
}

export function useProductsAPI() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/operations`
  const getToken = () => localStorage.getItem('auth_token')

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

      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch products')
      }

      const data: ProductListResponse = await response.json()
      const normalized: Product[] = (data.products || []).map(p => ({
        id: p.id,
        documentId: p.documentId,
        name: p.name,
      }))
      setProducts(normalized)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const resolveClientId = useCallback(async (): Promise<number> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const res = await fetch(`${API_BASE_URL}/client/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.detail || 'Failed to resolve client')
    }
    const data = await res.json()
    const first = (data.clients || [])[0]
    if (!first) throw new Error('No client found for current user')
    // Prefer numeric id if provided, else try parsing documentId
    return typeof first.id === 'number' ? first.id : parseInt(String(first.id || first.documentId), 10)
  }, [])

  const createProduct = useCallback(async (name: string): Promise<Product> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const clientId = await resolveClientId()
    const payload: CreateProductData = { name, client: clientId }

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
  }, [resolveClientId, fetchProducts])

  useEffect(() => {
    if (user) fetchProducts()
  }, [user, fetchProducts])

  return { products, loading, error, refresh: fetchProducts, createProduct }
}
