"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { toast } from "sonner"

type Product = { documentId: string; name: string }
type Campaign = { documentId: string; name: string }

export default function ClientDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [newProduct, setNewProduct] = useState({ name: "" })

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, camps] = await Promise.all([
          api.get("/api/v1/operations/products"),
          api.get("/api/v1/operations/campaigns"),
        ])
        setProducts((prods.data?.products || []).map((p: any) => ({ documentId: p.documentId || p.id, name: p.name })))
        setCampaigns((camps.data?.campaigns || []).map((c: any) => ({ documentId: c.documentId || c.id, name: c.name })))
      } catch (e: any) {
        toast.error("Failed to load dashboard")
      }
    }
    load()
  }, [])

  const addProduct = async () => {
    try {
      await api.post("/api/v1/operations/products", newProduct)
      toast.success("Product created")
      setNewProduct({ name: "" })
    } catch {
      toast.error("Failed to create product")
    }
  }

  return (
    <ProtectedRoute allowedRoles={["client", "Platform Administrator", "admin"]}>
      <DashboardLayout>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct({ name: e.target.value })} />
                <Button onClick={addProduct} disabled={!newProduct.name}>Add</Button>
              </div>
              <ul className="text-sm list-disc pl-5">
                {products.map((p) => (
                  <li key={p.documentId}>{p.name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm list-disc pl-5">
                {campaigns.map((c) => (
                  <li key={c.documentId}>{c.name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

