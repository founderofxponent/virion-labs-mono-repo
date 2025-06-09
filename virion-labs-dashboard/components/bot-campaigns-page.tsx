"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useAuth } from "@/components/auth-provider"
import { useBotCampaigns } from "@/hooks/use-bot-campaigns"
import { useClients } from "@/hooks/use-clients"
import { CampaignCreationWizard } from "@/components/campaign-creation-wizard"
import { getCampaignTemplate } from "@/lib/campaign-templates"
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
  const { profile } = useAuth()
  const { toast } = useToast()
  const { clients } = useClients()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [filterClient, setFilterClient] = useState("all")
  const [filterTemplate, setFilterTemplate] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

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

  // Remove old create form - now handled by CampaignCreationWizard

  const [editForm, setEditForm] = useState({
    id: "",
    client_id: "",
    guild_id: "",
    channel_id: "",
    campaign_name: "",
    campaign_template: "custom",
    prefix: "!",
    description: "",
    bot_name: "Virion Bot",
    bot_personality: "helpful",
    bot_response_style: "friendly",
    brand_color: "#6366f1",
    brand_logo_url: "",
    welcome_message: "",
    webhook_url: "",
    referral_link_id: "",
    influencer_id: "",
    referral_tracking_enabled: true,
    auto_role_assignment: false,
    target_role_id: "",
    moderation_enabled: true,
    rate_limit_per_user: 5,
    campaign_start_date: "",
    campaign_end_date: "",
    is_active: true,
    metadata: {}
  })

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

  const handleUpdateCampaign = async () => {
    if (!editForm.id) return

    try {
      await updateCampaign(editForm.id, editForm)
      toast({
        title: "Success",
        description: "Bot campaign updated successfully"
      })
      setShowEditDialog(false)
      setEditingCampaign(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update campaign",
        variant: "destructive"
      })
    }
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

  const openEditDialog = (campaign: any) => {
    setEditingCampaign(campaign)
    
    // Map database template values back to our new template IDs
    const reverseTemplateMapping: Record<string, string> = {
      'referral_campaign': 'referral_onboarding',
      'standard': 'product_promotion',
      'advanced': 'community_engagement',
      'support_campaign': 'vip_support',
      'custom': 'custom'
    }
    
    const mappedTemplate = reverseTemplateMapping[campaign.template] || campaign.type || 'custom'
    
    setEditForm({
      id: campaign.id,
      client_id: campaign.client_id,
      guild_id: campaign.guild_id,
      channel_id: campaign.channel_id || "",
      campaign_name: campaign.name,
      campaign_template: mappedTemplate,
      prefix: campaign.prefix || "!",
      description: campaign.description || "",
      bot_name: campaign.display_name || "Bot",
      bot_personality: campaign.bot_personality || "helpful",
      bot_response_style: campaign.bot_response_style || "friendly",
      brand_color: campaign.brand_color || "#6366f1",
      brand_logo_url: campaign.brand_logo_url || "",
      welcome_message: campaign.welcome_message || "",
      webhook_url: campaign.webhook_url || "",
      referral_link_id: campaign.referral_link_id || "",
      influencer_id: campaign.influencer_id || "",
      referral_tracking_enabled: campaign.referral_tracking_enabled || false,
      auto_role_assignment: campaign.auto_role_assignment || false,
      target_role_id: campaign.target_role_id || "",
      moderation_enabled: campaign.moderation_enabled || true,
      rate_limit_per_user: campaign.rate_limit_per_user || 5,
      campaign_start_date: campaign.campaign_start_date || "",
      campaign_end_date: campaign.campaign_end_date || "",
      is_active: campaign.is_active || true,
      metadata: campaign.metadata || {}
    })
    setShowEditDialog(true)
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
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>

        {/* Campaign Creation Wizard */}
        <CampaignCreationWizard
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCampaignCreated}
          clients={clients}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter(c => c.is_active).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.total_interactions || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + (c.total_interactions || 0), 0) / campaigns.length).toFixed(1) : '0'} per campaign
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const totalInteractions = campaigns.reduce((sum, c) => sum + (c.total_interactions || 0), 0)
                const totalConversions = campaigns.reduce((sum, c) => sum + (c.referral_conversions || 0), 0)
                return totalInteractions > 0 ? ((totalConversions / totalInteractions) * 100).toFixed(1) : '0'
              })()}%
            </div>
            <p className="text-xs text-muted-foreground">
              {campaigns.reduce((sum, c) => sum + (c.referral_conversions || 0), 0)} total conversions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const totalInteractions = campaigns.reduce((sum, c) => sum + (c.total_interactions || 0), 0)
                const totalOnboardings = campaigns.reduce((sum, c) => sum + (c.successful_onboardings || 0), 0)
                return totalInteractions > 0 ? ((totalOnboardings / totalInteractions) * 100).toFixed(1) : '0'
              })()}%
            </div>
            <p className="text-xs text-muted-foreground">
              {campaigns.reduce((sum, c) => sum + (c.successful_onboardings || 0), 0)} successful onboardings
            </p>
          </CardContent>
        </Card>
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
                  <SelectItem value="all">All Templates</SelectItem>
                  <SelectItem value="referral_campaign">Referral Campaign</SelectItem>
                  <SelectItem value="support_campaign">Support Campaign</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
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
                <Button onClick={() => setShowCreateDialog(true)}>
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
                                <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bot Campaign</DialogTitle>
            <DialogDescription>
              Update your bot campaign configuration
            </DialogDescription>
          </DialogHeader>

          {/* Template Preview */}
          {editForm.campaign_template && editForm.campaign_template !== 'custom' && (
            <Card className="bg-muted/50 mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg text-white ${
                    editForm.campaign_template === 'referral_onboarding' ? 'bg-blue-500' :
                    editForm.campaign_template === 'product_promotion' ? 'bg-green-500' :
                    editForm.campaign_template === 'community_engagement' ? 'bg-purple-500' :
                    editForm.campaign_template === 'vip_support' ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {getCampaignTemplate(editForm.campaign_template)?.name || editForm.campaign_template}
                    </CardTitle>
                    <CardDescription>
                      {getCampaignTemplate(editForm.campaign_template)?.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
          
          {/* Configuration Form - Matching Create Wizard Step 2 */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="edit_campaign_template">Campaign Template</Label>
              <Select
                value={editForm.campaign_template}
                onValueChange={(value) => {
                  const template = getCampaignTemplate(value)
                  if (template) {
                    setEditForm(prev => ({
                      ...prev,
                      campaign_template: value,
                      // Always populate template fields when template changes
                      prefix: template.bot_config.prefix,
                      description: template.bot_config.description,
                      bot_name: template.bot_config.bot_name,
                      bot_personality: template.bot_config.bot_personality,
                      bot_response_style: template.bot_config.bot_response_style,
                      brand_color: template.bot_config.brand_color,
                      welcome_message: template.bot_config.welcome_message,
                      referral_tracking_enabled: template.bot_config.features.referral_tracking,
                      auto_role_assignment: template.bot_config.features.auto_role,
                      moderation_enabled: template.bot_config.features.moderation,
                    }))
                  } else {
                    setEditForm(prev => ({ ...prev, campaign_template: value }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral_onboarding">Referral Onboarding</SelectItem>
                  <SelectItem value="product_promotion">Product Promotion</SelectItem>
                  <SelectItem value="community_engagement">Community Engagement</SelectItem>
                  <SelectItem value="vip_support">VIP Support</SelectItem>
                  <SelectItem value="custom">Custom Configuration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Configuration Form */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Settings</h3>
                
                <div>
                  <Label htmlFor="edit_campaign_name">Campaign Name *</Label>
                  <Input
                    id="edit_campaign_name"
                    value={editForm.campaign_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_guild_id">Discord Server ID *</Label>
                  <Input
                    id="edit_guild_id"
                    value={editForm.guild_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, guild_id: e.target.value }))}
                    placeholder="123456789012345678"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_channel_id">Private Channel ID (Optional)</Label>
                  <Input
                    id="edit_channel_id"
                    value={editForm.channel_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, channel_id: e.target.value }))}
                    placeholder="123456789012345678"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Discord channel where only referral users can interact with the bot
                  </p>
                </div>
              </div>

              {/* Right Column - Bot Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Bot Configuration
                </h3>

                <div>
                  <Label htmlFor="edit_bot_name">Bot Display Name</Label>
                  <Input
                    id="edit_bot_name"
                    value={editForm.bot_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bot_name: e.target.value }))}
                    placeholder="Bot Display Name"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_prefix">Bot Prefix</Label>
                  <Input
                    id="edit_prefix"
                    value={editForm.prefix}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prefix: e.target.value }))}
                    placeholder="!"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_brand_color">Brand Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="edit_brand_color"
                      value={editForm.brand_color}
                      onChange={(e) => setEditForm(prev => ({ ...prev, brand_color: e.target.value }))}
                      placeholder="#6366f1"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: editForm.brand_color }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit_personality">Bot Personality</Label>
                  <Select
                    value={editForm.bot_personality}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, bot_personality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select personality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="helpful">Helpful</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit_response_style">Bot Response Style</Label>
                  <Select
                    value={editForm.bot_response_style}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, bot_response_style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select response style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
              
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this bot campaign does..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit_welcome_message">Welcome Message</Label>
                <Textarea
                  id="edit_welcome_message"
                  value={editForm.welcome_message}
                  onChange={(e) => setEditForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Welcome message for new members..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_webhook_url">Webhook URL (Optional)</Label>
                  <Input
                    id="edit_webhook_url"
                    value={editForm.webhook_url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://your-api.com/webhook"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_rate_limit">Rate Limit (per user)</Label>
                  <Input
                    type="number"
                    id="edit_rate_limit"
                    value={editForm.rate_limit_per_user}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rate_limit_per_user: parseInt(e.target.value) }))}
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h4 className="text-md font-medium mb-3">Bot Features</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit_referral_tracking">Referral Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable tracking of referral codes and conversions
                      </p>
                    </div>
                    <Switch
                      id="edit_referral_tracking"
                      checked={editForm.referral_tracking_enabled}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, referral_tracking_enabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit_auto_role">Auto Role Assignment</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign roles to verified members
                      </p>
                    </div>
                    <Switch
                      id="edit_auto_role"
                      checked={editForm.auto_role_assignment}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, auto_role_assignment: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit_moderation">Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automatic moderation and spam protection
                      </p>
                    </div>
                    <Switch
                      id="edit_moderation"
                      checked={editForm.moderation_enabled}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, moderation_enabled: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCampaign}>
              Update Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 