"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useAuth } from "@/components/auth-provider"
import { useBotCampaigns } from "@/hooks/use-bot-campaigns"
import { useClients } from "@/hooks/use-clients"
import { type CampaignTemplate } from "@/lib/campaign-templates"
import { LandingPageConfig } from "@/components/landing-page-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { formatDate, cn } from "@/lib/utils"
import { 
  Bot, 
  Settings, 
  Activity, 
  Play, 
  Square, 
  Plus,
  Server,
  Users,
  Zap,
  Palette,
  Code,
  Edit,
  Trash2,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Pause,
  Target,
  TrendingUp,
  Hash,
  MessageSquare,
  Archive,
  Eye,
  Filter,
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
  const [filterTemplate, setFilterTemplate] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // Load templates from API
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true)
        const response = await fetch('/api/campaign-templates')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || [])
        }
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setTemplatesLoading(false)
      }
    }
    
    loadTemplates()
  }, [])

  const filters = {
    ...(filterClient !== "all" && { client_id: filterClient }),
    ...(filterStatus === "active" && { is_active: true }),
    ...(filterStatus === "inactive" && { is_active: false }),
    ...(filterTemplate !== "all" && { template: filterTemplate }),
    include_archived: filterStatus === "all",
    only_archived: filterStatus === "archived"
  }

  const {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    archiveCampaign,
    activateCampaign,
    refresh
  } = useBotCampaigns(filters)

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      campaign.name.toLowerCase().includes(query) ||
      campaign.client_name.toLowerCase().includes(query) ||
      campaign.guild_id.toLowerCase().includes(query) ||
      campaign.type.toLowerCase().includes(query) ||
      campaign.template.toLowerCase().includes(query)
    )
  })

  const handleCampaignCreated = (campaign: any) => {
    toast({
      title: "Success",
      description: "Bot campaign created successfully"
    })
    refresh() // Refresh the campaigns list
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return
    }

    try {
      await deleteCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign deleted successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign",
        variant: "destructive"
      })
    }
  }

  const handleArchiveCampaign = async (campaignId: string) => {
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

  const handleActivateCampaign = async (campaignId: string) => {
    try {
      await activateCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign activated successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate campaign",
        variant: "destructive"
      })
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await archiveCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign paused successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to pause campaign",
        variant: "destructive"
      })
    }
  }

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      await activateCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign resumed successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resume campaign",
        variant: "destructive"
      })
    }
  }

  const handleRestoreCampaign = async (campaignId: string) => {
    try {
      await activateCampaign(campaignId)
      toast({
        title: "Success",
        description: "Campaign restored successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore campaign",
        variant: "destructive"
      })
    }
  }

  const handlePreviewLandingPage = (campaign: any) => {
    // Open landing page preview in a new window
    const previewUrl = `/api/referral/preview/${campaign.id}`
    window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
  }

  const handleExportCampaignCSV = async (campaignId: string, campaignName: string) => {
    try {
      // Only admin users can export data
      if (profile?.role !== "admin") {
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
        } catch (jsonError) {
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

  const openOnboardingDialog = (campaign: any) => {
    // TODO: Implement onboarding fields dialog
    toast({
      title: "Coming Soon",
      description: "Onboarding fields management will be available soon"
    })
  }

  const getTemplateColor = (template: string) => {
    switch (template) {
      case 'referral_campaign': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'support_campaign': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'standard': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'custom': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bot className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading bot campaigns...</p>
          </div>
        </div>
      </div>
    )
  }

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
        {/* Create Campaign Button */}
        <Button onClick={() => router.push('/bot-campaigns/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
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
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-filter" className="text-sm font-medium">Template</Label>
              <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All templates" />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                                            <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                  ) : (
                    <>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
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
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Campaigns ({filteredCampaigns.length})</CardTitle>
          <CardDescription>
            Manage your Discord bot campaigns and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterClient !== "all" || filterTemplate !== "all" || filterStatus !== "all"
                  ? "No campaigns match your current filters."
                  : "Get started by creating your first bot campaign."}
              </p>
              {!searchQuery && filterClient === "all" && filterTemplate === "all" && filterStatus === "all" && (
                <Button onClick={() => router.push('/bot-campaigns/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Discord Server</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Metrics</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: campaign.brand_color }}
                            >
                              <Bot className="h-5 w-5" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {campaign.display_name} • v{campaign.configuration_version}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">{campaign.client_name}</div>
                        {campaign.client_industry && (
                          <div className="text-sm text-muted-foreground">
                            {campaign.client_industry}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{campaign.guild_id}</span>
                        </div>
                        {campaign.channel_id && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs text-muted-foreground">
                              {campaign.channel_id}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getTemplateColor(campaign.template)}>
                          {campaign.template.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getCampaignTypeColor(campaign.type)}>
                          {campaign.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={campaign.is_active ? "default" : "secondary"}>
                            {campaign.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {campaign.last_activity_at && (
                            <div className="text-xs text-muted-foreground">
                              Last seen: {formatDate(campaign.last_activity_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {campaign.total_interactions || 0} interactions
                          </div>
                          <div className="flex items-center text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {campaign.successful_onboardings || 0} onboarded
                          </div>
                          <div className="flex items-center text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {campaign.referral_conversions || 0} referrals
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(campaign.updated_at)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created {formatDate(campaign.created_at)}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreviewLandingPage(campaign)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview Landing Page
                            </DropdownMenuItem>
                            
                            {!filterStatus || filterStatus !== "archived" ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/bot-campaigns/${campaign.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openOnboardingDialog(campaign)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Onboarding Fields
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportCampaignCSV(campaign.id, campaign.name)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export CSV
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => campaign.is_active 
                                    ? handlePauseCampaign(campaign.id) 
                                    : handleResumeCampaign(campaign.id)
                                  }
                                >
                                  {campaign.is_active ? (
                                    <>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Resume
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleArchiveCampaign(campaign.id)}
                                  className="text-orange-600"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleExportCampaignCSV(campaign.id, campaign.name)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export CSV
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRestoreCampaign(campaign.id)}
                                  className="text-green-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 