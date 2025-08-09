"use client"

import { useState } from 'react'
import { useProductsAPI } from '@/hooks/use-products-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function ClientsProductsPage() {
  const { products, loading, error, createProduct } = useProductsAPI()
  const [name, setName] = useState('')

  const handleCreate = async () => {
    try {
      if (!name.trim()) return
      await createProduct(name.trim())
      toast.success('Product created')
      setName('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to create product')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="New product name" value={name} onChange={e => setName(e.target.value)} />
            <Button onClick={handleCreate} disabled={!name.trim()}>Add</Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {products.map(p => (
                <li key={p.documentId || p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
