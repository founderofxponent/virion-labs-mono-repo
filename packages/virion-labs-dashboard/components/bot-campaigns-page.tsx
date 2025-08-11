"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CampaignWizard } from "@/components/campaign-wizard/CampaignWizard"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { useDiscordIdResolver } from "@/hooks/use-discord-id-resolver"
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile } = useAuth()
  const { toast } = useToast()
  const { clients } = useClients()
  const { resolveCampaignDiscordNames } = useDiscordIdResolver()
  const [filterClient, setFilterClient] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const roleName = typeof profile?.role === 'string' ? profile.role : profile?.role?.name

  // Wizard dialog state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(undefined)


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
    archiveCampaign,
    refresh
  } = useBotCampaignsAPI(filters)

  // Auto-open create wizard via query param
  useEffect(() => {
    const c = searchParams?.get('create')
    if (c && ['1', 'true', 'yes', 'open'].includes(c.toLowerCase())) {
      setWizardMode('create')
      setSelectedCampaignId(undefined)
      setWizardOpen(true)
    }
  }, [searchParams])

  const openCreateWizard = () => {
    setWizardMode('create')
    setSelectedCampaignId(undefined)
    setWizardOpen(true)
    if (pathname) router.replace(`${pathname}?create=1`)
  }

  const closeWizardAndCleanUrl = () => {
    setWizardOpen(false)
    if (!pathname) return
    const params = new URLSearchParams(Array.from((searchParams || new URLSearchParams()).entries()))
    if (params.has('create')) {
      params.delete('create')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    }
  }

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

  

  const handlePreviewLandingPage = (campaignId: string) => {
    window.open(`/admin/campaigns/preview?campaignId=${campaignId}`, '_blank')
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
      if (roleName !== "platform administrator" && roleName !== "admin") {
        toast({
          title: "Access Denied",
          description: "You do not have permission to export data.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Exporting Data",
        description: `Your CSV export for "${campaignName}" is being generated. This may take a moment...`,
      });

      const response = await api.post('/api/v1/analytics/export/onboarding-data', {
        select_mode: 'single',
        campaign_ids: [String(campaignId)],
        file_format: 'csv',
        date_range: 'all',
      });

      if (response.status !== 202) {
        throw new Error(response.data?.detail || response.data?.message || "Failed to start export process");
      }

      const exportResult = response.data;
      const downloadUrl = exportResult.download_url;

      if (!downloadUrl) {
        throw new Error("Export completed, but no download URL was provided.");
      }

      // Open the download URL in a new tab to trigger the download
      window.open(downloadUrl, '_blank');

      toast({
        title: "Success",
        description: "Your download will begin shortly. Check your email for a link as well.",
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export CSV data",
        variant: "destructive",
      });
    }
  };




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
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your Discord bot configurations and campaigns in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateWizard}>
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
            Campaigns ({loading ? (
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
                <Button onClick={openCreateWizard}>
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
                    {/* Content Grid - All columns inline using full width with visual separation */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-x divide-border">
                      {/* Campaign Info - 3 columns */}
                      <div className="lg:col-span-3 space-y-2 pr-4 lg:pr-6">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaign</Label>
                        <div>
                          <h3 className="font-bold text-base leading-tight mb-1">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{campaign.bot_name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const status = getCampaignStatus(campaign)
                              const statusConfig = {
                                active: { variant: "outline" as const, label: "Active", className: "border-green-200 text-green-700 bg-green-50" },
                                archived: { variant: "outline" as const, label: "Archived", className: "border-orange-200 text-orange-700 bg-orange-50" },
                                deleted: { variant: "outline" as const, label: "Deleted", className: "border-red-200 text-red-700 bg-red-50" },
                                inactive: { variant: "outline" as const, label: "Inactive", className: "border-gray-200 text-gray-600 bg-gray-50" }
                              }
                              const config = statusConfig[status]
                              return (
                                <Badge variant={config.variant} className={config.className} size="sm">
                                  {config.label}
                                </Badge>
                              )
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Discord Server Info - 4 columns */}
                      <div className="lg:col-span-4 space-y-2 px-4 lg:px-6">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discord Server</Label>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-muted-foreground mb-1">Server</span>
                            <div className="flex items-center space-x-1">
                              <Server className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-foreground truncate">
                                {(() => {
                                  const { guildName } = resolveCampaignDiscordNames(campaign)
                                  return guildName || campaign.guild_id
                                })()}
                              </span>
                            </div>
                          </div>
                          {campaign.channel_id && (
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs text-muted-foreground mb-1">Channel</span>
                              <div className="flex items-center space-x-1">
                                <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-foreground truncate">
                                  {(() => {
                                    const { channelName } = resolveCampaignDiscordNames(campaign)
                                    return channelName || campaign.channel_id
                                  })()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Client Info - 2 columns */}
                      <div className="lg:col-span-2 space-y-2 px-4 lg:px-6">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</Label>
                        <div>
                          <p className="font-medium text-sm">{campaign.client?.name || 'No client'}</p>
                          {campaign.client?.industry && (
                            <p className="text-xs text-muted-foreground">{campaign.client.industry}</p>
                          )}
                        </div>
                      </div>

                      {/* Performance Metrics - 3 columns */}
                      <div className="lg:col-span-3 space-y-2 pl-4 lg:pl-6">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance</Label>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-1">Started</span>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{campaign.total_starts || 0}</span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-1">Completed</span>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{campaign.total_completions || 0}</span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-1">Rate</span>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{Math.round(campaign.completion_rate || 0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="px-6 py-3 bg-muted/30 border-t flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreviewLandingPage(campaign.documentId || campaign.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setWizardMode('edit')
                      setSelectedCampaignId((campaign as any).documentId || (campaign as any).id)
                      setWizardOpen(true)
                    }}>
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
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/admin/campaigns/${campaign.documentId || campaign.id}/responses`)}>
                                  <Users className="h-4 w-4 mr-2" />
                                  View Responses
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExportCampaignCSV(String(campaign.documentId || campaign.id), campaign.name)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export CSV
                                </DropdownMenuItem>
                              </>
                            )
                          }
                          
                          if (status === 'archived') {
                            return (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/admin/campaigns/${campaign.documentId || campaign.id}/responses`)}>
                                  <Users className="h-4 w-4 mr-2" />
                                  View Responses
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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
                          
                          // Default return for active/inactive campaigns
                          return (
                            <>
                              <DropdownMenuItem onClick={() => router.push(`/admin/campaigns/${campaign.documentId || campaign.id}/responses`)}>
                                <Users className="h-4 w-4 mr-2" />
                                View Responses
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
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
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Campaign Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={(open) => {
        setWizardOpen(open)
        if (!open) closeWizardAndCleanUrl()
      }}>
        <DialogContent className="max-w-5xl w-full p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{wizardMode === 'create' ? 'Create Campaign' : 'Edit Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <CampaignWizard
              mode={wizardMode}
              campaignId={wizardMode === 'edit' ? selectedCampaignId : undefined}
              hideHeader
              afterSaveNavigateTo={null}
              onSaved={() => { refresh(); closeWizardAndCleanUrl(); }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}