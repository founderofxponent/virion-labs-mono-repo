"use client"

import { useState } from "react"
import { Copy, ExternalLink, QrCode, Search, Plus, Edit, Trash2, MoreHorizontal, Power, PowerOff, RefreshCw, Download, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { ReferralLinkForm } from "@/components/referral-link-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useReferralLinkManager } from "@/hooks/use-referral-link-manager"
import { useTrackingStats } from "@/hooks/use-tracking-stats"
import { useInfluencerMetricsApi } from "@/hooks/use-influencer-metrics-api"
import { type ReferralLink } from "@/schemas/referral"
import { useToast } from "@/hooks/use-toast"
import { ReferralLinkSuccessModal } from "./referral-link-success-modal"
import { QRCodeSVG } from "qrcode.react"

export function LinksPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const {
    links,
    loading: linksLoading,
    error: linksError,
    refetch: refetchLinks,
    addLink,
    updateLink,
    deleteLink
  } = useReferralLinkManager()
  
  const {
    metrics,
    loading: metricsLoading,
    error: metricsError
  } = useInfluencerMetricsApi()
  
  const {
    refreshStats,
    loading: trackingLoading
  } = useTrackingStats()
  
  const loading = linksLoading || metricsLoading
  const error = linksError || metricsError

  const [showLinkForm, setShowLinkForm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdLink, setCreatedLink] = useState<ReferralLink | null>(null)
  const [editingLink, setEditingLink] = useState<ReferralLink | null>(null)
  const [deletingLink, setDeletingLink] = useState<ReferralLink | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCampaign, setFilterCampaign] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Filter and sort links based on current filters
  const filteredLinks = (links || []).filter(link => {
    const matchesSearch = !searchQuery || 
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.platform.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPlatform = filterPlatform === "all" || 
      link.platform.toLowerCase() === filterPlatform.toLowerCase()
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && link.is_active) ||
      (filterStatus === "inactive" && !link.is_active)
    
    const matchesCampaign = filterCampaign === "all" ||
      (filterCampaign === "no-campaign" && !link.campaign_name) ||
      link.campaign_name === filterCampaign
    
    return matchesSearch && matchesPlatform && matchesStatus && matchesCampaign
  }).sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      case "most-clicks":
        return b.clicks - a.clicks
      case "most-conversions":
        return b.conversions - a.conversions
      case "highest-rate":
        return (b.conversion_rate || 0) - (a.conversion_rate || 0)
      default: // newest
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    }
  })
  
  const uniqueCampaigns = Array.from(new Set(
    (links || []).map(link => link.campaign_name).filter(Boolean)
  )) as string[]

  const analytics = {
    totalLinks: links?.length || 0,
    activeLinks: links?.filter(link => link.is_active).length || 0,
    totalClicks: links?.reduce((sum, link) => sum + link.clicks, 0) || 0,
    totalConversions: links?.reduce((sum, link) => sum + link.conversions, 0) || 0,
    averageConversionRate: links?.length ? 
      (links.reduce((sum, link) => sum + (link.conversion_rate || 0), 0) / links.length) : 0,
  }

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Success",
        description: "Link copied to clipboard!"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

  const handleDeleteLink = async (link: ReferralLink) => {
    try {
      await deleteLink(String(link.id))
      toast({
        title: "Success",
        description: "Link deleted successfully!"
      })
      setDeletingLink(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive"
      })
    }
  }

  const handleToggleStatus = async (link: ReferralLink) => {
    try {
      const result = await updateLink(String(link.id), { is_active: !link.is_active })
      if (result.error) {
        throw new Error(result.error)
      }
      toast({
        title: "Success",
        description: `Link ${link.is_active ? 'deactivated' : 'activated'} successfully!`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update link status",
        variant: "destructive"
      })
    }
  }

  const handleLinkCreated = (link: any) => { // TODO: Use correct type
    setCreatedLink(link)
    setShowLinkForm(false)
    setShowSuccessModal(true)
    toast({
      title: "Success",
      description: "Referral link created successfully!"
    })
    refetchLinks()
  }

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setCreatedLink(null)
    setShowLinkForm(true)
    refetchLinks()
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    setCreatedLink(null)
    refetchLinks()
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
            <p className="text-muted-foreground">Manage and track all your referral links</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
            <p className="text-muted-foreground">Manage and track all your referral links</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-500">Error loading links: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
          <p className="text-muted-foreground">Manage and track all your referral links</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            try {
              await refresh()
              toast({
                title: "Success",
                description: "Links refreshed successfully!"
              })
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to refresh links. Please try again.",
                variant: "destructive"
              })
            }
          }} title="Refresh data">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Referral Link</DialogTitle>
                <DialogDescription>Create a new referral link for your content</DialogDescription>
              </DialogHeader>
              <ReferralLinkForm 
                onSuccess={handleLinkCreated}
                onCancel={() => setShowLinkForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Links
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Total Links</h4>
                    <p className="text-sm text-muted-foreground">
                      The total number of referral links you've created. This includes both active and inactive links.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLinks}</div>
            <p className="text-xs text-muted-foreground">{analytics.activeLinks} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Clicks
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Total Clicks</h4>
                    <p className="text-sm text-muted-foreground">
                      The total number of times people have clicked on your referral links. Each click represents someone visiting your content through your referral link.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Conversions
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Total Conversions</h4>
                    <p className="text-sm text-muted-foreground">
                      The total number of successful conversions from your referral links. A conversion happens when someone clicks your link and completes a desired action (like signing up or making a purchase).
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analytics.averageConversionRate.toFixed(1)}% avg rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Avg Conversion Rate
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Average Conversion Rate</h4>
                    <p className="text-sm text-muted-foreground">
                      The percentage of clicks that result in conversions, averaged across all your links. This helps you understand how effective your referral links are at driving action.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formula: (Total Conversions ÷ Total Clicks) × 100
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Click to conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCampaign} onValueChange={setFilterCampaign}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="no-campaign">No Campaign</SelectItem>
              {uniqueCampaigns.map((campaign) => (
                <SelectItem key={campaign} value={campaign}>
                  {campaign}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-clicks">Most Clicks</SelectItem>
              <SelectItem value="most-conversions">Most Conversions</SelectItem>
              <SelectItem value="highest-rate">Highest Rate</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>
      </div>

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterPlatform !== "all" || filterStatus !== "all" || filterCampaign !== "all"
                  ? "No links found matching your criteria"
                  : "No referral links yet. Create your first link to get started!"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => (
            <LinkCard 
              key={link.id} 
              link={link} 
              onCopy={handleCopyLink}
              onEdit={setEditingLink}
              onDelete={setDeletingLink}
              onToggleStatus={handleToggleStatus}
              formatDate={formatDate}
              trackingLoading={trackingLoading}
            />
          ))}
        </div>
      )}

      {/* Edit Link Dialog */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Referral Link</DialogTitle>
            <DialogDescription>Update your referral link details</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <ReferralLinkForm 
              link={editingLink as any} // TODO: Fix type
              onSuccess={() => setEditingLink(null)}
              onCancel={() => setEditingLink(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLink} onOpenChange={(open) => !open && setDeletingLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Referral Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLink?.title}"? This action cannot be undone and will remove all associated analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLink && handleDeleteLink(deletingLink)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Modal */}
      <ReferralLinkSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        link={createdLink as any} // TODO: Fix type
        campaignName={createdLink?.campaign_name}
        onCreateAnother={handleCreateAnother}
        createdFrom="links"
      />
    </div>
  )
}

interface LinkCardProps {
  link: ReferralLink
  onCopy: (url: string) => void
  onEdit: (link: ReferralLink) => void
  onDelete: (link: ReferralLink) => void
  onToggleStatus: (link: ReferralLink) => void
  formatDate: (date: string) => string
  trackingLoading: boolean
}

function LinkCard({ link, onCopy, onEdit, onDelete, onToggleStatus, formatDate, trackingLoading }: LinkCardProps) {
  const { toast } = useToast()
  
  const handleDownloadQR = () => {
    try {
      const svg = document.getElementById('qr-code-svg-' + link.id)
      if (!svg) {
        toast({
          title: "Error",
          description: "QR code not found. Please try again.",
          variant: "destructive"
        })
        return
      }

      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const downloadLink = document.createElement('a')
          downloadLink.download = 'qr-code-' + (link.referral_code || 'referral') + '.png'
          downloadLink.href = canvas.toDataURL()
          downloadLink.click()
          toast({
            title: "Success",
            description: "QR code downloaded successfully!"
          })
        }
      }
      
      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to generate QR code download. Please try again.",
          variant: "destructive"
        })
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Left Column - QR Code/Thumbnail */}
          <div className="flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:bg-muted/80 transition-colors">
                  {link.thumbnail_url ? (
                    <img 
                      src={link.thumbnail_url} 
                      alt={link.title} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                      }}
                    />
                  ) : (
                    <QRCodeSVG
                      value={link.referral_url}
                      size={76}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="L"
                      includeMargin={false}
                      className="w-full h-full p-1"
                    />
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-medium">QR Code for {link.title}</h4>
                    <p className="text-sm text-muted-foreground">Scan to open referral link</p>
                  </div>
                  <div className="flex flex-col items-center space-y-4 p-4 bg-muted/30 rounded-lg">
                    <QRCodeSVG
                      id={'qr-code-svg-' + link.id}
                      value={link.referral_url}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                      includeMargin={true}
                      className="border rounded-md"
                    />
                    <Button onClick={handleDownloadQR} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right Column - All Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{link.title}</h3>
                <Badge variant={link.is_active ? "default" : "secondary"} className="text-xs">
                  {link.is_active ? "Active" : "Inactive"}
                </Badge>
                {link.campaign_name && (
                  <Badge variant="outline" className="text-blue-700 border-blue-200 text-xs">
                    Campaign
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(link)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleStatus(link)}>
                    {link.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={async () => {
                      try {
                        await refreshStats(link.referral_code)
                        // Refresh the links to get updated data
                        refetchLinks()
                        toast({
                          title: "Success",
                          description: "Link stats refreshed successfully!"
                        })
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to refresh stats. Please try again.",
                          variant: "destructive"
                        })
                      }
                    }}
                    disabled={trackingLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${trackingLoading ? 'animate-spin' : ''}`} />
                    Refresh Stats
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(link)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Meta Information Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="font-medium">{link.platform}</span>
              <span>•</span>
              <span>{formatDate(link.created_at || new Date().toISOString())}</span>
              {link.campaign_name && (
                <>
                  <span>•</span>
                  <span className="text-blue-700 font-medium">{link.campaign_name}</span>
                </>
              )}
              {link.expires_at && (
                <>
                  <span>•</span>
                  <span>Expires {formatDate(link.expires_at)}</span>
                </>
              )}
            </div>

            {/* Description */}
            {link.description && (
              <p className="text-xs text-muted-foreground">{link.description}</p>
            )}

            {/* Performance Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3 relative">
                <div className="text-xl font-bold text-blue-600">{link.clicks.toLocaleString()}</div>
                <div className="text-xs font-medium text-blue-900 flex items-center justify-center gap-1">
                  Clicks
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent">
                        <Info className="h-2.5 w-2.5 text-blue-700/60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" side="top">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Clicks</h4>
                        <p className="text-xs text-muted-foreground">
                          Number of times people have clicked on this specific referral link. Each click represents a visitor accessing your content.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3 relative">
                <div className="text-xl font-bold text-blue-600">{link.conversions.toLocaleString()}</div>
                <div className="text-xs font-medium text-blue-900 flex items-center justify-center gap-1">
                  Converts
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent">
                        <Info className="h-2.5 w-2.5 text-blue-700/60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" side="top">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Conversions</h4>
                        <p className="text-xs text-muted-foreground">
                          Number of successful conversions from this link. A conversion occurs when someone clicks your link and completes the desired action (signup, purchase, etc.).
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3 relative">
                <div className="text-xl font-bold text-blue-600">{(link.conversion_rate || 0).toFixed(1)}%</div>
                <div className="text-xs font-medium text-blue-900 flex items-center justify-center gap-1">
                  Rate
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent">
                        <Info className="h-2.5 w-2.5 text-blue-700/60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" side="top">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Conversion Rate</h4>
                        <p className="text-xs text-muted-foreground">
                          Percentage of clicks that resulted in conversions for this link. Higher rates indicate more effective content and targeting.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formula: (Conversions ÷ Clicks) × 100
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* URL and Action Section */}
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex gap-2">
                  <Input 
                    value={link.referral_url} 
                    readOnly 
                    className="text-xs font-mono bg-white border-gray-200 focus:ring-0 flex-1 h-8" 
                    placeholder="Referral Link"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCopy(link.referral_url)}
                    className="flex-shrink-0 px-2 h-8"
                    title="Copy link"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(link.original_url, '_blank')}
                  className="whitespace-nowrap h-8 px-3 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Original
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
