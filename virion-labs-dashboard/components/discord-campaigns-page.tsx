'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useDiscordCampaigns } from '@/hooks/use-discord-campaigns'
import { useClients } from '@/hooks/use-clients'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { 
  Bot, 
  Settings, 
  Activity, 
  Play, 
  Square, 
  RotateCcw, 
  Heart,
  Plus,
  Server,
  Users,
  Zap,
  Palette,
  Code,
  Globe,
  Edit,
  Trash2,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Pause,
  Target,
  TrendingUp,
  Calendar,
  Hash
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DiscordCampaignsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { clients } = useClients()
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [filterClient, setFilterClient] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    campaigns,
    templates,
    loading,
    error,
    createCampaign,
    createCampaignFromTemplate,
    updateCampaign,
    deleteCampaign,
    pauseCampaign,
    resumeCampaign,
    getCampaignStats,
    getCampaignTypeLabel,
    getCampaignTypeColor,
    formatDate: formatCampaignDate,
    fetchCampaigns,
    fetchTemplates
  } = useDiscordCampaigns()

  const [createForm, setCreateForm] = useState({
    client_id: '',
    guild_id: '',
    channel_id: '',
    campaign_name: '',
    campaign_type: 'referral_onboarding' as const,
    template_id: '',
    referral_link_id: '',
    influencer_id: '',
    webhook_url: '',
    welcome_message: '',
    campaign_start_date: '',
    campaign_end_date: '',
    // Bot configuration
    bot_name: '',
    bot_personality: 'helpful',
    bot_response_style: 'friendly',
    brand_color: '#6366f1'
  })

  const [editForm, setEditForm] = useState({
    campaign_name: '',
    welcome_message: '',
    is_active: true,
    bot_name: '',
    brand_color: '#6366f1'
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const stats = getCampaignStats()

  const handleCreateCampaign = async () => {
    if (!createForm.client_id || !createForm.guild_id || !createForm.campaign_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const result = createForm.template_id 
      ? await createCampaignFromTemplate(createForm.template_id, createForm)
      : await createCampaign(createForm)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Campaign created successfully!",
      })
      setShowCreateDialog(false)
      setCreateForm({
        client_id: '',
        guild_id: '',
        channel_id: '',
        campaign_name: '',
        campaign_type: 'referral_onboarding',
        template_id: '',
        referral_link_id: '',
        influencer_id: '',
        webhook_url: '',
        welcome_message: '',
        campaign_start_date: '',
        campaign_end_date: '',
        bot_name: '',
        bot_personality: 'helpful',
        bot_response_style: 'friendly',
        brand_color: '#6366f1'
      })
    }
  }

  const handleEditCampaign = async () => {
    if (!editingCampaign) return

    const result = await updateCampaign(editingCampaign.id, editForm)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Campaign updated successfully!",
      })
      setShowEditDialog(false)
      setEditingCampaign(null)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    const result = await deleteCampaign(campaignId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Campaign deleted successfully!",
      })
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    const result = await pauseCampaign(campaignId)
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Campaign paused successfully!",
      })
    }
  }

  const handleResumeCampaign = async (campaignId: string) => {
    const result = await resumeCampaign(campaignId)
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Campaign resumed successfully!",
      })
    }
  }

  const openEditDialog = (campaign: any) => {
    setEditingCampaign(campaign)
    setEditForm({
      campaign_name: campaign.campaign_name,
      welcome_message: campaign.welcome_message || '',
      is_active: campaign.is_active,
      bot_name: campaign.bot_name,
      brand_color: campaign.brand_color
    })
    setShowEditDialog(true)
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filterClient !== 'all' && campaign.client_id !== filterClient) return false
    if (filterType !== 'all' && campaign.campaign_type !== filterType) return false
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && !campaign.is_active) return false
      if (filterStatus === 'paused' && campaign.is_active) return false
    }
    if (searchQuery && !campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !campaign.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discord Campaigns</h1>
          <p className="text-muted-foreground">Manage Discord bot campaigns with client-specific behavior and referral tracking</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCampaigns} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInteractions}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {stats.avgInteractionsPerCampaign.toFixed(1)} per campaign
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalConversions} total conversions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Onboarding Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.onboardingRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOnboardings} successful onboardings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Latest campaign activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCampaignTypeColor(campaign.campaign_type) }}
                      />
                      <div>
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.clients?.name} • {getCampaignTypeLabel(campaign.campaign_type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={campaign.is_active ? "default" : "secondary"}>
                        {campaign.is_active ? "Active" : "Paused"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {campaign.total_interactions} interactions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by client" />
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
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="referral_onboarding">Referral Onboarding</SelectItem>
                    <SelectItem value="product_promotion">Product Promotion</SelectItem>
                    <SelectItem value="community_engagement">Community Engagement</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
              <CardDescription>Manage your Discord bot campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading campaigns...</div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No campaigns found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Interactions</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Guild: {campaign.guild_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.clients?.name}</p>
                            <p className="text-sm text-muted-foreground">{campaign.clients?.industry}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: getCampaignTypeColor(campaign.campaign_type),
                              color: getCampaignTypeColor(campaign.campaign_type)
                            }}
                          >
                            {getCampaignTypeLabel(campaign.campaign_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={campaign.is_active ? "default" : "secondary"}>
                            {campaign.is_active ? "Active" : "Paused"}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.total_interactions}</TableCell>
                        <TableCell>
                          <div>
                            <p>{campaign.referral_conversions}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.total_interactions > 0 
                                ? ((campaign.referral_conversions / campaign.total_interactions) * 100).toFixed(1)
                                : 0}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCampaignDate(campaign.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
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
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="text-destructive"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Campaign Type Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaigns by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.campaignsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCampaignTypeColor(type) }}
                        />
                        <span>{getCampaignTypeLabel(type)}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaigns by Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.campaignsByClient).map(([client, count]) => (
                    <div key={client} className="flex items-center justify-between">
                      <span>{client}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new Discord bot campaign with specific behavior and tracking
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={createForm.client_id} onValueChange={(value) => setCreateForm({ ...createForm, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-type">Campaign Type *</Label>
                <Select value={createForm.campaign_type} onValueChange={(value: any) => setCreateForm({ ...createForm, campaign_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral_onboarding">Referral Onboarding</SelectItem>
                    <SelectItem value="product_promotion">Product Promotion</SelectItem>
                    <SelectItem value="community_engagement">Community Engagement</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                placeholder="e.g., Gaming Community Welcome"
                value={createForm.campaign_name}
                onChange={(e) => setCreateForm({ ...createForm, campaign_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guild-id">Discord Server ID *</Label>
                <Input
                  id="guild-id"
                  placeholder="e.g., 1234567890123456789"
                  value={createForm.guild_id}
                  onChange={(e) => setCreateForm({ ...createForm, guild_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-id">Channel ID (Optional)</Label>
                <Input
                  id="channel-id"
                  placeholder="e.g., 9876543210987654321"
                  value={createForm.channel_id}
                  onChange={(e) => setCreateForm({ ...createForm, channel_id: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template (Optional)</Label>
              <Select value={createForm.template_id || 'none'} onValueChange={(value) => setCreateForm({ ...createForm, template_id: value === 'none' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template for quick setup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Template</SelectItem>
                  {templates
                    .filter(t => t.campaign_type === createForm.campaign_type)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-message">Welcome Message</Label>
              <Textarea
                id="welcome-message"
                placeholder="Welcome message for new users"
                value={createForm.welcome_message}
                onChange={(e) => setCreateForm({ ...createForm, welcome_message: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Bot Name</Label>
                <Input
                  id="bot-name"
                  placeholder="e.g., Welcome Bot"
                  value={createForm.bot_name}
                  onChange={(e) => setCreateForm({ ...createForm, bot_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-color">Brand Color</Label>
                <Input
                  id="brand-color"
                  type="color"
                  value={createForm.brand_color}
                  onChange={(e) => setCreateForm({ ...createForm, brand_color: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update campaign settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-name">Campaign Name</Label>
              <Input
                id="edit-campaign-name"
                value={editForm.campaign_name}
                onChange={(e) => setEditForm({ ...editForm, campaign_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-welcome-message">Welcome Message</Label>
              <Textarea
                id="edit-welcome-message"
                value={editForm.welcome_message}
                onChange={(e) => setEditForm({ ...editForm, welcome_message: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bot-name">Bot Name</Label>
                <Input
                  id="edit-bot-name"
                  value={editForm.bot_name}
                  onChange={(e) => setEditForm({ ...editForm, bot_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-brand-color">Brand Color</Label>
                <Input
                  id="edit-brand-color"
                  type="color"
                  value={editForm.brand_color}
                  onChange={(e) => setEditForm({ ...editForm, brand_color: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              <Label htmlFor="edit-is-active">Campaign Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCampaign}>
              Update Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 