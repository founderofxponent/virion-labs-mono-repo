"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useBotCampaignsAPI, getCampaignStatus } from "@/hooks/use-bot-campaigns-api"
import { useClients } from "@/hooks/use-clients"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus,
  Server,
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Hash,
  MessageSquare,
  Archive,
  Eye,
  Search,
  Download,
  RotateCcw
} from "lucide-react"



export default function BotCampaignsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const { toast } = useToast()
  const { clients } = useClients()
  const [filterClient, setFilterClient] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const roleName = typeof profile?.role === 'string' ? profile.role : profile?.role?.name


  const filters = useMemo(() => ({
    // Handle status filtering with better UX logic
    ...(filterStatus === "active" && { is_active: true }),
    ...(filterStatus === "inactive" && { is_active: false }),
    // TODO: Implement archived and deleted status filtering
    // The API parameters for archived/deleted campaigns need to be properly implemented
    // include_archived: filterStatus === "archived",
    // only_archived: filterStatus === "archived",
    // include_deleted: filterStatus === "deleted",
    // only_deleted: filterStatus === "deleted"
  }), [filterStatus])

  const {
    campaigns,
    loading,
    deleteCampaign,
    unarchiveCampaign,
    archiveCampaign
  } = useBotCampaignsAPI(filters)

  // Debug logging to help troubleshoot campaigns not showing
  // console.log('🔍 Bot Campaigns Filter Debug:', { filterStatus, filters, campaignCount: campaigns.length, campaigns, loading, error })

  // Filter campaigns based on search query, client filter, and status
  const filteredCampaigns = campaigns.filter(campaign => {
    // Handle inactive status more precisely (not paused, not archived, not deleted, just inactive)
    if (filterStatus === "inactive") {
      const status = getCampaignStatus(campaign)
      if (status !== "inactive") return false
    }
    
    // Filter by client if not "all"
    if (filterClient !== "all") {
      const campaignClientId = campaign.client?.id || campaign.client?.documentId
      // Convert both to strings for comparison since filterClient is a string from Select
      const campaignClientIdStr = String(campaignClientId)
      if (campaignClientIdStr !== filterClient) return false
    }
    
    // Then check search query
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      campaign.name.toLowerCase().includes(query) ||
      (campaign.client?.name && campaign.client.name.toLowerCase().includes(query)) ||
      campaign.guild_id.toLowerCase().includes(query) ||
      (campaign.campaign_type && campaign.campaign_type.toLowerCase().includes(query))
    )
  })


  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm(`Are you sure you want to delete this campaign? This will move it to the deleted items.`)) {
      return
    }

    try {
      await deleteCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign deleted successfully"
      })
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to delete campaign`,
        variant: "destructive"
      })
    }
  }

  const handleArchiveCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to archive this campaign? This will mark it as completed and set an end date.")) {
      return
    }

    try {
      await archiveCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign archived successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive campaign",
        variant: "destructive"
      })
    }
  }

  

  const handleUnarchiveCampaign = async (campaignId: string) => {
    try {
      await unarchiveCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign unarchived successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unarchive campaign",
        variant: "destructive"
      })
    }
  }

  

  const handlePreviewLandingPage = () => {
    // TODO: Implement preview via business logic API
    // For now, show an alert that this feature needs to be implemented
    alert('Landing page preview will be available once the campaign has active referral links. Create a referral link first, then use the /r/{code} URL to preview.')
  }

  const handlePublishToDiscord = async () => {
    try {
      if (campaigns.length === 0) {
        toast({
          title: "No Campaigns",
          description: "No campaigns found to publish to Discord",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/discord/publish-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Use environment variables from server
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Published to Discord",
          description: `Successfully published ${result.campaigns_published?.active || 0} active campaigns to Discord`,
        })
      } else {
        const errorText = await response.text()
        console.error('Failed to publish to Discord:', errorText)
        toast({
          title: "Publish Failed",
          description: "Failed to publish campaigns to Discord. Please try again.",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Error publishing to Discord:', error)
      toast({
        title: "Publish Failed", 
        description: error instanceof Error ? error.message : "Failed to publish campaigns to Discord",
        variant: "destructive"
      })
    }
  }

  const handleExportCampaignCSV = async (campaignId: string, campaignName: string) => {
    try {
      // Only admin users can export data
      if (roleName !== "admin") {
        throw new Error("Access denied. Admin privileges required.")
      }

      const response = await fetch(`/api/bot-campaigns/${campaignId}/export-csv`)
      
      if (!response.ok) {
        // Try to get the error message from the response
        try {
          const errorData = await response.json()
          if (errorData.message) {
            throw new Error(errorData.message)
          } else if (errorData.error) {
            throw new Error(errorData.error)
          }
        } catch {
          // If we can't parse JSON, use a generic error
        }
        throw new Error("Failed to export CSV")
      }

      // Get the CSV content
      const csvContent = await response.text()
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${campaignName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_onboarding_data.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Onboarding data exported successfully!",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export CSV data",
        variant: "destructive"
      })
    }
  }




  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'referral_onboarding': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'product_promotion': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'community_engagement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'support': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const CampaignListSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            {/* Header Row Skeleton */}
            <div className="grid grid-cols-12 gap-4 items-start mb-6">
              {/* Campaign Info - 8 columns */}
              <div className="col-span-12 lg:col-span-8">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - 4 columns */}
              <div className="col-span-12 lg:col-span-4 flex gap-2 justify-end">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-12 gap-6">
              {/* Client - 4 columns */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-4 space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>

              {/* Discord Server - 4 columns */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>

              {/* Performance - 4 columns */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Remove the loading early return - we'll show skeleton in the table instead

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bot Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your Discord bot configurations and campaigns in one place
          </p>
        </div>
        <div className="flex gap-2">
          {/* Publish to Discord Button */}
          <Button 
            variant="outline" 
            onClick={handlePublishToDiscord}
            disabled={campaigns.length === 0}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Publish to Discord
          </Button>
          {/* Create Campaign Button */}
          <Button onClick={() => router.push('/bot-campaigns/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="client-filter" className="text-sm font-medium">Client</Label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  {/* TODO: Implement archived and deleted status options */}
                  {/* <SelectItem value="archived">Archived</SelectItem> */}
                  {/* <SelectItem value="deleted">Deleted</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bot Campaigns ({loading ? (
              <Skeleton className="inline-block h-4 w-6" />
            ) : (
              filteredCampaigns.length
            )})
          </CardTitle>
          <CardDescription>
            Manage your Discord bot campaigns and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CampaignListSkeleton />
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterClient !== "all" || filterStatus !== "all"
                  ? "No campaigns match your current filters."
                  : "Get started by creating your first bot campaign."}
              </p>
              {!searchQuery && filterClient === "all" && filterStatus === "all" && (
                <Button onClick={() => router.push('/bot-campaigns/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.documentId || campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header Row - Fixed Grid */}
                    <div className="grid grid-cols-12 gap-4 items-start mb-6">
                      {/* Campaign Info - 8 columns */}
                      <div className="col-span-12 lg:col-span-8">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg leading-tight mb-1">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{campaign.bot_name}</p>
                          {/* Badges moved under campaign subtitle */}
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getCampaignTypeColor(campaign.campaign_type || '')}>
                              {campaign.campaign_type?.replace('_', ' ')}
                            </Badge>
                            {(() => {
                              const status = getCampaignStatus(campaign)
                              const statusConfig = {
                                active: { variant: "default" as const, label: "Active", color: "text-green-600" },
                                archived: { variant: "outline" as const, label: "Archived", color: "text-orange-600" },
                                deleted: { variant: "destructive" as const, label: "Deleted", color: "text-red-600" },
                                inactive: { variant: "secondary" as const, label: "Inactive", color: "text-gray-600" }
                              }
                              const config = statusConfig[status]
                              return (
                                <Badge variant={config.variant} className={config.color}>
                                  {config.label}
                                </Badge>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons - 4 columns */}
                      <div className="col-span-12 lg:col-span-4 flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={handlePreviewLandingPage}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/bot-campaigns/${campaign.documentId || campaign.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(() => {
                              const status = getCampaignStatus(campaign)
                              
                              if (status === 'deleted') {
                                return (
                                  <DropdownMenuItem onClick={() => handleExportCampaignCSV(String(campaign.documentId || campaign.id), campaign.name)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                  </DropdownMenuItem>
                                )
                              }
                              
                              if (status === 'archived') {
                                return (
                                  <>
                                    <DropdownMenuItem onClick={() => handleExportCampaignCSV(String(campaign.documentId || campaign.id), campaign.name)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Export CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleUnarchiveCampaign(String(campaign.documentId || campaign.id))}>
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Unarchive
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteCampaign(String(campaign.documentId || campaign.id))}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )
                              }
                              
                              // Active or inactive campaigns
                              return (
                                <>
                                  <DropdownMenuItem onClick={() => handleExportCampaignCSV(String(campaign.documentId || campaign.id), campaign.name)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleArchiveCampaign(String(campaign.documentId || campaign.id))}
                                    className="text-orange-600"
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteCampaign(String(campaign.documentId || campaign.id))}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )
                            })()}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Content Grid - Aligned Columns */}
                    <div className="grid grid-cols-12 gap-6">
                      {/* Client Info - 4 columns */}
                      <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</Label>
                          <div>
                            <p className="font-semibold text-sm">{campaign.client?.name || 'No client'}</p>
                            {campaign.client?.industry && (
                              <p className="text-xs text-muted-foreground">{campaign.client.industry}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Discord Server Info - 4 columns */}
                      <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discord Server</Label>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Server className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="font-mono text-xs">{campaign.guild_id}</span>
                            </div>
                            {campaign.channel_id && (
                              <div className="flex items-center space-x-2">
                                <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="font-mono text-xs text-muted-foreground">
                                  {campaign.channel_id}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics - 4 columns */}
                      <div className="col-span-12 sm:col-span-6 lg:col-span-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance</Label>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Started</span>
                              </div>
                              <span className="text-xs font-semibold">{campaign.total_starts || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Completed</span>
                              </div>
                              <span className="text-xs font-semibold">{campaign.total_completions || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Rate</span>
                              </div>
                              <span className="text-xs font-semibold">{Math.round(campaign.completion_rate || 0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}