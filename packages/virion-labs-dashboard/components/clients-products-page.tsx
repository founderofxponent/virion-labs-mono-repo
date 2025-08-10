"use client"

import { useState, useEffect } from 'react'
import { useProductsAPI } from '@/hooks/use-products-api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Package, Plus, Edit2, Trash2, DollarSign, Hash, FileText, Filter, Search, ArrowUpDown, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'sku'>('name')

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
    return `${price.toFixed(2)}`
  }

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query)
    )
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'price':
        return (a.price || 0) - (b.price || 0)
      case 'sku':
        return (a.sku || '').localeCompare(b.sku || '')
      default:
        return 0
    }
  })

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-2">
            Manage your product catalog and pricing
          </p>
        </div>
        <Button onClick={handleCreateOpen} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.length > 0
                ? formatPrice(
                    products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
                  )
                : '-'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With SKU</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.sku).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Label htmlFor="sort" className="sr-only">Sort by</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            {loading && products.length > 0 ? 'Refreshing...' : `Showing ${sortedProducts.length} of ${products.length} products`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first product"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateOpen} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((product) => (
                <Card key={product.documentId || product.id} className="relative group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg line-clamp-1">{product.name}</h4>
                        {product.sku && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            SKU: {product.sku}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Product actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      {product.client && (
                        <span className="text-xs text-muted-foreground">
                          {product.client.name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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

// Removed duplicate, misplaced block that was outside the component
