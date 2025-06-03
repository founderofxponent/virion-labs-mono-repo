'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useBotConfigurations, useDiscordActivities, useVirionBot } from '@/hooks/use-adaptive-bot'
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
  ExternalLink
} from 'lucide-react'
import { BotConfiguration } from '@/lib/adaptive-bot-service'
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

export function AdaptiveBotPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { clients } = useClients()
  const [activeTab, setActiveTab] = useState('overview')
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<BotConfiguration | null>(null)
  const [filterClient, setFilterClient] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { configurations, loading: configsLoading, createConfiguration, updateConfiguration, deleteConfiguration, refreshConfigurations } = useBotConfigurations()
  const { activities, loading: activitiesLoading, createActivity, refreshActivities } = useDiscordActivities()
  const { bot, loading: botLoading, updateBot, controlBot, refreshBot } = useVirionBot()

  const [configForm, setConfigForm] = useState<{
    client_id: string
    guild_id: string
    display_name: string
    template: 'standard' | 'advanced' | 'custom'
    prefix: string
    description: string
    brand_color: string
    welcome_message: string
    features: Record<string, any>
  }>({
    client_id: '',
    guild_id: '',
    display_name: '',
    template: 'standard',
    prefix: '!',
    description: '',
    brand_color: '#7289DA',
    welcome_message: '',
    features: {}
  })

  const [activityForm, setActivityForm] = useState<{
    client_id: string
    activity_name: string
    activity_type: 'embedded_app' | 'activity' | 'mini_game'
    guild_id: string
    activity_config: Record<string, any>
  }>({
    client_id: '',
    activity_name: '',
    activity_type: 'embedded_app',
    guild_id: '',
    activity_config: {}
  })

  const [editForm, setEditForm] = useState({
    display_name: '',
    template: 'standard' as 'standard' | 'advanced' | 'custom',
    prefix: '!',
    description: '',
    brand_color: '#7289DA',
    welcome_message: '',
    features: {} as Record<string, any>,
    custom_commands: [] as any[],
    response_templates: {} as Record<string, any>,
    embed_footer: '',
    webhook_url: '',
    api_endpoints: {} as Record<string, any>,
    external_integrations: {} as Record<string, any>
  })

  const handleCreateConfiguration = async () => {
    if (!configForm.client_id || !configForm.display_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const { success, error } = await createConfiguration(configForm)
    
    if (success) {
      toast({
        title: "Success",
        description: "Bot configuration created successfully!",
      })
      setShowConfigDialog(false)
      setConfigForm({
        client_id: '',
        guild_id: '',
        display_name: '',
        template: 'standard',
        prefix: '!',
        description: '',
        brand_color: '#7289DA',
        welcome_message: '',
        features: {}
      })
    } else {
      toast({
        title: "Error",
        description: error || "Failed to create configuration",
        variant: "destructive"
      })
    }
  }

  const handleEditConfiguration = (config: BotConfiguration) => {
    setEditingConfig(config)
    setEditForm({
      display_name: config.display_name,
      template: config.template,
      prefix: config.prefix,
      description: config.description || '',
      brand_color: config.brand_color,
      welcome_message: config.welcome_message || '',
      features: config.features || {},
      custom_commands: config.custom_commands || [],
      response_templates: config.response_templates || {},
      embed_footer: config.embed_footer || '',
      webhook_url: config.webhook_url || '',
      api_endpoints: config.api_endpoints || {},
      external_integrations: config.external_integrations || {}
    })
    setShowEditDialog(true)
  }

  const handleUpdateConfiguration = async () => {
    if (!editingConfig || !editForm.display_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const { success, error } = await updateConfiguration(editingConfig.id, {
      display_name: editForm.display_name,
      template: editForm.template,
      prefix: editForm.prefix,
      description: editForm.description,
      brand_color: editForm.brand_color,
      welcome_message: editForm.welcome_message,
      features: editForm.features,
      custom_commands: editForm.custom_commands,
      response_templates: editForm.response_templates,
      embed_footer: editForm.embed_footer,
      webhook_url: editForm.webhook_url,
      api_endpoints: editForm.api_endpoints,
      external_integrations: editForm.external_integrations
    })
    
    if (success) {
      toast({
        title: "Success",
        description: "Bot configuration updated successfully!",
      })
      setShowEditDialog(false)
      setEditingConfig(null)
    } else {
      toast({
        title: "Error",
        description: error || "Failed to update configuration",
        variant: "destructive"
      })
    }
  }

  const handleDeleteConfiguration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return
    }

    const { success, error } = await deleteConfiguration(id)
    if (success) {
      toast({
        title: "Success",
        description: "Bot configuration deleted successfully!",
      })
    } else {
      toast({
        title: "Error",
        description: error || "Failed to delete configuration",
        variant: "destructive"
      })
    }
  }

  const handleCreateActivity = async () => {
    if (!activityForm.client_id || !activityForm.activity_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const { success, error } = await createActivity(activityForm)
    
    if (success) {
      toast({
        title: "Success",
        description: "Discord activity created successfully!",
      })
      setShowActivityDialog(false)
      setActivityForm({
        client_id: '',
        activity_name: '',
        activity_type: 'embedded_app',
        guild_id: '',
        activity_config: {}
      })
    } else {
      toast({
        title: "Error",
        description: error || "Failed to create activity",
        variant: "destructive"
      })
    }
  }

  const handleBotControl = async (action: 'start' | 'stop' | 'restart' | 'health_check') => {
    const { success, error } = await controlBot(action)
    
    if (success) {
      toast({
        title: "Success",
        description: `Bot ${action} completed successfully!`,
      })
    } else {
      toast({
        title: "Error",
        description: error || `Failed to ${action} bot`,
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'bg-green-500'
      case 'Offline': return 'bg-gray-500'
      case 'Maintenance': return 'bg-yellow-500'
      case 'Error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Online': return 'default'
      case 'Offline': return 'secondary'
      case 'Maintenance': return 'outline'
      case 'Error': return 'destructive'
      default: return 'secondary'
    }
  }

  // Filter configurations based on client and search query
  const filteredConfigurations = configurations.filter((config) => {
    if (filterClient !== 'all' && config.client_id !== filterClient) {
      return false
    }
    if (searchQuery && !config.display_name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !config.client?.name.toLowerCase().includes(searchQuery.toLowerCase())) {
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
          <h1 className="text-2xl font-bold tracking-tight">Adaptive Bot Management</h1>
          <p className="text-muted-foreground">Manage the single Virion Labs bot with client-specific configurations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="settings">Bot Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Bot Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Virion Labs Bot Status
              </CardTitle>
              <CardDescription>
                Central bot instance serving all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {botLoading ? (
                <div className="text-center py-4">Loading bot status...</div>
              ) : bot ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)}`} />
                      <span className="font-medium">{bot.bot_name}</span>
                      <Badge variant={getStatusVariant(bot.status)}>{bot.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBotControl('health_check')}
                        disabled={botLoading}
                      >
                        <Heart className="h-4 w-4" />
                        Health Check
                      </Button>
                      {bot.status === 'Online' ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleBotControl('restart')}
                            disabled={botLoading}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restart
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleBotControl('stop')}
                            disabled={botLoading}
                          >
                            <Square className="h-4 w-4" />
                            Stop
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleBotControl('start')}
                          disabled={botLoading}
                        >
                          <Play className="h-4 w-4" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{bot.total_configurations}</div>
                      <div className="text-sm text-muted-foreground">Configurations</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{bot.total_guilds}</div>
                      <div className="text-sm text-muted-foreground">Servers</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{bot.total_users}</div>
                      <div className="text-sm text-muted-foreground">Users</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{bot.uptime_percentage}%</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                  </div>

                  {bot.last_online && (
                    <div className="text-sm text-muted-foreground">
                      Last online: {formatDate(bot.last_online)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No bot instance found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Bot Configurations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Configurations:</span>
                    <span className="font-medium">{configurations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Configurations:</span>
                    <span className="font-medium">
                      {configurations.filter(c => c.is_active).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Discord Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Activities:</span>
                    <span className="font-medium">{activities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Activities:</span>
                    <span className="font-medium">
                      {activities.filter(a => a.is_active).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configurations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Bot Configurations</h3>
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Bot Configuration</DialogTitle>
                  <DialogDescription>
                    Configure how the Virion Labs bot behaves for a specific client or Discord server
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-id">Client *</Label>
                      <Select 
                        value={configForm.client_id} 
                        onValueChange={(value) => setConfigForm({ ...configForm, client_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.industry})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guild-id">Discord Server ID</Label>
                      <Input
                        id="guild-id"
                        placeholder="Optional: specific Discord server"
                        value={configForm.guild_id}
                        onChange={(e) => setConfigForm({ ...configForm, guild_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name *</Label>
                    <Input
                      id="display-name"
                      placeholder="e.g., TechStartup Referral Bot"
                      value={configForm.display_name}
                      onChange={(e) => setConfigForm({ ...configForm, display_name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template">Template</Label>
                      <Select 
                        value={configForm.template} 
                        onValueChange={(value) => 
                          setConfigForm({ ...configForm, template: value as 'standard' | 'advanced' | 'custom' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Command Prefix</Label>
                      <Input
                        id="prefix"
                        placeholder="!"
                        value={configForm.prefix}
                        onChange={(e) => setConfigForm({ ...configForm, prefix: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this bot configuration does..."
                      value={configForm.description}
                      onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand-color">Brand Color</Label>
                      <Input
                        id="brand-color"
                        type="color"
                        value={configForm.brand_color}
                        onChange={(e) => setConfigForm({ ...configForm, brand_color: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      placeholder="Optional: message sent when bot joins a server"
                      value={configForm.welcome_message}
                      onChange={(e) => setConfigForm({ ...configForm, welcome_message: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateConfiguration}>
                    Create Configuration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Search configurations..."
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
          </div>

          {/* Edit Configuration Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Bot Configuration</DialogTitle>
                <DialogDescription>
                  Update the configuration for this bot instance
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-display-name">Display Name *</Label>
                    <Input
                      id="edit-display-name"
                      placeholder="e.g., TechCorp Bot"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-prefix">Command Prefix *</Label>
                    <Input
                      id="edit-prefix"
                      placeholder="e.g., !"
                      value={editForm.prefix}
                      onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Brief description of this bot configuration"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-template">Template</Label>
                    <Select 
                      value={editForm.template} 
                      onValueChange={(value) => 
                        setEditForm({ ...editForm, template: value as 'standard' | 'advanced' | 'custom' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div className="space-y-2">
                  <Label htmlFor="edit-welcome-message">Welcome Message</Label>
                  <Textarea
                    id="edit-welcome-message"
                    placeholder="Message to send when bot joins a server"
                    value={editForm.welcome_message}
                    onChange={(e) => setEditForm({ ...editForm, welcome_message: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-embed-footer">Embed Footer</Label>
                  <Input
                    id="edit-embed-footer"
                    placeholder="Footer text for bot embeds"
                    value={editForm.embed_footer}
                    onChange={(e) => setEditForm({ ...editForm, embed_footer: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-webhook-url">Webhook URL</Label>
                  <Input
                    id="edit-webhook-url"
                    placeholder="Optional webhook for notifications"
                    value={editForm.webhook_url}
                    onChange={(e) => setEditForm({ ...editForm, webhook_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateConfiguration}>
                  Update Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {configsLoading ? (
            <div className="text-center py-8">Loading configurations...</div>
          ) : filteredConfigurations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                {configurations.length === 0 ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">No configurations yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first bot configuration to customize how the Virion Labs bot behaves for different clients.
                    </p>
                    <Button onClick={() => setShowConfigDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Configuration
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">No matching configurations</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search or filter criteria to find configurations.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery('')
                        setFilterClient('all')
                      }}
                    >
                      Clear Filters
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Showing {filteredConfigurations.length} of {configurations.length} configurations
                </span>
                {(searchQuery || filterClient !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterClient('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Commands</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConfigurations.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: config.brand_color }}
                              />
                              <span className="font-medium">{config.display_name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {config.prefix} • {config.template} template • v{config.configuration_version}
                            </div>
                            {config.description && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">
                                {config.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{config.client?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {config.client?.industry}
                            </div>
                            {config.guild_id && (
                              <div className="text-xs text-muted-foreground font-mono">
                                Guild: {config.guild_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.is_active ? 'default' : 'secondary'}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{config.commands_used}</div>
                          <div className="text-xs text-muted-foreground">commands used</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{config.users_served}</div>
                          <div className="text-xs text-muted-foreground">users served</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {config.last_activity_at ? formatDate(config.last_activity_at) : 'Never'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditConfiguration(config)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Configuration
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  navigator.clipboard.writeText(config.id)
                                  toast({ title: "Copied", description: "Configuration ID copied to clipboard" })
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                              </DropdownMenuItem>
                              {config.guild_id && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    navigator.clipboard.writeText(config.guild_id!)
                                    toast({ title: "Copied", description: "Guild ID copied to clipboard" })
                                  }}
                                >
                                  <Server className="mr-2 h-4 w-4" />
                                  Copy Guild ID
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteConfiguration(config.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Configuration
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Discord Activities</h3>
            <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Discord Activity</DialogTitle>
                  <DialogDescription>
                    Create an embedded app or activity for Discord servers
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="activity-client-id">Client *</Label>
                      <Select 
                        value={activityForm.client_id} 
                        onValueChange={(value) => setActivityForm({ ...activityForm, client_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.industry})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activity-guild-id">Discord Server ID</Label>
                      <Input
                        id="activity-guild-id"
                        placeholder="Optional: specific Discord server"
                        value={activityForm.guild_id}
                        onChange={(e) => setActivityForm({ ...activityForm, guild_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-name">Activity Name *</Label>
                    <Input
                      id="activity-name"
                      placeholder="e.g., Referral Tracker"
                      value={activityForm.activity_name}
                      onChange={(e) => setActivityForm({ ...activityForm, activity_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-type">Activity Type</Label>
                    <Select 
                      value={activityForm.activity_type} 
                      onValueChange={(value) => 
                        setActivityForm({ ...activityForm, activity_type: value as 'embedded_app' | 'activity' | 'mini_game' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="embedded_app">Embedded App</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="mini_game">Mini Game</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateActivity}>
                    Create Activity
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {activitiesLoading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No activities yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create Discord activities and embedded apps to enhance user engagement.
                </p>
                <Button onClick={() => setShowActivityDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Activity
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {activity.activity_name}
                        </CardTitle>
                        <CardDescription>
                          {activity.client?.name} • {activity.activity_type}
                        </CardDescription>
                      </div>
                      <Badge variant={activity.is_active ? 'default' : 'secondary'}>
                        {activity.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Type</div>
                        <div className="text-muted-foreground capitalize">{activity.activity_type.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="font-medium">Guild ID</div>
                        <div className="text-muted-foreground">{activity.guild_id || 'All servers'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Last Used</div>
                        <div className="text-muted-foreground">
                          {activity.last_used_at ? formatDate(activity.last_used_at) : 'Never'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Settings</CardTitle>
              <CardDescription>
                Configure the global Virion Labs bot instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {botLoading ? (
                <div className="text-center py-4">Loading bot settings...</div>
              ) : bot ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bot Name</Label>
                      <div className="text-sm text-muted-foreground">{bot.bot_name}</div>
                    </div>
                    <div>
                      <Label>Deployment Strategy</Label>
                      <div className="text-sm text-muted-foreground capitalize">{bot.deployment_strategy}</div>
                    </div>
                    <div>
                      <Label>Discord Application ID</Label>
                      <div className="text-sm text-muted-foreground font-mono">{bot.discord_application_id}</div>
                    </div>
                    <div>
                      <Label>Server Endpoint</Label>
                      <div className="text-sm text-muted-foreground">{bot.server_endpoint || 'Not configured'}</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Invite Links</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm">Basic Permissions</Label>
                        <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                          https://discord.com/api/oauth2/authorize?client_id={bot.discord_application_id}&permissions=8&scope=bot
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">With Activities</Label>
                        <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                          https://discord.com/api/oauth2/authorize?client_id={bot.discord_application_id}&permissions=8&scope=bot%20applications.commands
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No bot instance configured
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 