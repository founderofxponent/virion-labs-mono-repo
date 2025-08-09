"use client"

import { useState, useEffect } from 'react'
import { useProductsAPI } from '@/hooks/use-products-api'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Package, Plus, Edit2, Trash2, DollarSign, Hash, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Product, ProductFormData, ProductValidationErrors } from '@/schemas/product'

interface ErrorDisplayProps {
  errors: ProductValidationErrors
}

function ErrorDisplay({ errors }: ErrorDisplayProps) {
  const allErrors = Object.values(errors).flat()
  if (allErrors.length === 0) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1">
          {allErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  errors?: ProductValidationErrors
  loading?: boolean
}

function ProductForm({ initialData, onSubmit, errors, loading }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    sku: initialData?.sku || '',
    price: initialData?.price || ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        sku: initialData.sku || '',
        price: initialData.price || ''
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors && <ErrorDisplay errors={errors} />}
      
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Product Name *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter product name"
          className={errors?.name ? "border-red-500" : ""}
        />
        {errors?.name && <p className="text-sm text-red-500">{errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter product description (optional)"
          rows={3}
          className={errors?.description ? "border-red-500" : ""}
        />
        {errors?.description && <p className="text-sm text-red-500">{errors.description[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            SKU
          </Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => handleInputChange('sku', e.target.value)}
            placeholder="e.g., PROD-001"
            className={errors?.sku ? "border-red-500" : ""}
          />
          {errors?.sku && <p className="text-sm text-red-500">{errors.sku[0]}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0.00"
            className={errors?.price ? "border-red-500" : ""}
          />
          {errors?.price && <p className="text-sm text-red-500">{errors.price[0]}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  )
}

export default function ClientsProductsPage() {
  const { 
    products, 
    loading, 
    error, 
    validationErrors,
    createProductEnhanced, 
    updateProduct, 
    deleteProduct,
    clearValidationErrors,
    clearError
  } = useProductsAPI()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateSubmit = async (formData: ProductFormData) => {
    setIsSubmitting(true)
    clearValidationErrors()
    clearError()

    try {
      const result = await createProductEnhanced(formData)
      if (result.success) {
        toast.success('Product created successfully')
        setIsCreateOpen(false)
      } else {
        // Errors are handled by the hook and displayed in the form
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (formData: ProductFormData) => {
    if (!editingProduct) return
    
    setIsSubmitting(true)
    clearValidationErrors()
    clearError()

    try {
      const result = await updateProduct(editingProduct.documentId || String(editingProduct.id), formData)
      if (result.success) {
        toast.success('Product updated successfully')
        setIsEditOpen(false)
        setEditingProduct(null)
      } else {
        // Errors are handled by the hook and displayed in the form
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    clearValidationErrors()
    clearError()
    setIsEditOpen(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteProduct(product.documentId || String(product.id))
      if (result.success) {
        toast.success('Product deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete product')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleCreateOpen = () => {
    clearValidationErrors()
    clearError()
    setIsCreateOpen(true)
  }

  const handleEditClose = () => {
    setIsEditOpen(false)
    setEditingProduct(null)
    clearValidationErrors()
    clearError()
  }

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '-'
    return `$${price.toFixed(2)}`
  }

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your products, pricing, and inventory
            </p>
          </div>
          <Button onClick={handleCreateOpen} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first product
              </p>
              <Button onClick={handleCreateOpen} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {loading && products.length > 0 && (
                <p className="text-sm text-muted-foreground">Refreshing...</p>
              )}
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.documentId || product.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{product.name}</h4>
                              {product.description && (
                                <p className="text-muted-foreground text-sm mt-1 max-w-md">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="flex items-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-sm">
                            {product.sku && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">SKU:</span>
                                <Badge variant="secondary" className="text-xs">
                                  {product.sku}
                                </Badge>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-medium">
                                {formatPrice(product.price)}
                              </span>
                            </div>

                            {product.client && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Client:</span>
                                <span className="text-sm">{product.client.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Product
            </DialogTitle>
            <DialogDescription>
              Add a new product to your catalog. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreateSubmit}
            errors={validationErrors || undefined}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={handleEditClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Product
            </DialogTitle>
            <DialogDescription>
              Update your product information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              initialData={{
                name: editingProduct.name,
                description: editingProduct.description || '',
                sku: editingProduct.sku || '',
                price: editingProduct.price?.toString() || ''
              }}
              onSubmit={handleEditSubmit}
              errors={validationErrors || undefined}
              loading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
