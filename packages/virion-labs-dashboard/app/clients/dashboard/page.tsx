"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Package, 
  Target, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plug
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useBotCampaignsAPI, getCampaignStatus } from "@/hooks/use-bot-campaigns-api"
import { useProductsAPI } from "@/hooks/use-products-api"
import { useMemo } from "react"

export default function ClientDashboard() {
  const { profile } = useAuth()
  const filters = useMemo(() => ({}), [])
  const { campaigns, loading: campaignsLoading } = useBotCampaignsAPI(filters)
  const { products, loading: productsLoading } = useProductsAPI()

  // Calculate statistics
  const activeCampaigns = campaigns.filter(c => getCampaignStatus(c) === 'active').length
  const totalCampaigns = campaigns.length
  const totalProducts = products.length

  // Get recent campaigns (last 3)
  const recentCampaigns = campaigns.slice(0, 3)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'archived':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'deleted':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'archived':
        return 'outline'
      case 'deleted':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your business performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients/campaigns?create=1">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Getting Started - shown when no products and no campaigns */}
      {(totalProducts === 0 && totalCampaigns === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Get started with Virion Labs</CardTitle>
            <CardDescription>
              A quick checklist to launch your first campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/clients/products" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Add your first product
                </Button>
              </Link>
              <Link href="/clients/integrations" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plug className="mr-2 h-4 w-4" />
                  Connect your Discord server
                </Button>
              </Link>
              <Link href="/clients/campaigns?create=1" className="block">
                <Button className="w-full justify-start">
                  <Target className="mr-2 h-4 w-4" />
                  Create your first campaign
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsLoading ? '-' : totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              In your catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignsLoading ? '-' : activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignsLoading ? '-' : totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              From last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Campaigns */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>
                  Your latest campaign activity
                </CardDescription>
              </div>
              <Link href="/clients/campaigns">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Loading campaigns...</p>
              </div>
            ) : recentCampaigns.length > 0 ? (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => {
                  const status = getCampaignStatus(campaign)
                  return (
                    <div key={campaign.documentId || campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Guild: {campaign.guild_id}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(status)}>
                        {status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No campaigns yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first campaign to get started
                </p>
                <Link href="/clients/campaigns?create=1">
                  <Button size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/clients/products" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Button>
            </Link>
            <Link href="/clients/campaigns?create=1" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Campaign
              </Button>
            </Link>
            <Link href="/clients/campaigns" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                View All Campaigns
              </Button>
            </Link>
            <Link href="/clients/integrations" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Setup Integrations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Products Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products Overview</CardTitle>
              <CardDescription>
                Your product catalog at a glance
              </CardDescription>
            </div>
            <Link href="/clients/products">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                Manage products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {products.slice(0, 3).map((product) => (
                <div key={product.documentId || product.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{product.name}</h4>
                    {product.price && (
                      <span className="text-sm font-semibold">${product.price.toFixed(2)}</span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {product.sku && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        SKU: {product.sku}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No products yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add products to your catalog
              </p>
              <Link href="/clients/products">
                <Button size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
