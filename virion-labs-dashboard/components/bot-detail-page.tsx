"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Trash2, 
  Bot, 
  Server, 
  Users, 
  Activity, 
  MessageSquare, 
  Clock,
  ExternalLink,
  Copy,
  Power,
  Settings,
  Shield,
  Zap,
  Play,
  Square,
  RotateCcw
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useBots } from "@/hooks/use-bots"
import { useClients } from "@/hooks/use-clients"
import { useToast } from "@/hooks/use-toast"
import { type BotUpdate, type BotStatus, type BotTemplate } from "@/lib/supabase"

interface BotDetailPageProps {
  botId: string
  initialEditMode?: boolean
}

export function BotDetailPage({ botId, initialEditMode = false }: BotDetailPageProps) {
  const router = useRouter()
  const { getBotById, updateBot, deleteBot, controlBot, formatDate, formatLastOnline, getStatusVariant } = useBots()
  const { clients } = useClients()
  const { toast } = useToast()
  
  const [bot, setBot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(initialEditMode)
  const [isSaving, setSaving] = useState(false)
  const [isControlling, setIsControlling] = useState(false)
  
  // Form state for editing
  const [formData, setFormData] = useState<Partial<BotUpdate>>({})

  useEffect(() => {
    loadBot()
  }, [botId])

  useEffect(() => {
    if (bot && !formData.name) {
      setFormData({
        name: bot.name,
        client_id: bot.client_id,
        discord_bot_id: bot.discord_bot_id,
        discord_token: bot.discord_token,
        status: bot.status,
        template: bot.template,
        prefix: bot.prefix,
        description: bot.description,
        auto_deploy: bot.auto_deploy,
        webhook_url: bot.webhook_url,
        avatar_url: bot.avatar_url,
        invite_url: bot.invite_url,
        servers: bot.servers,
        users: bot.users,
        commands_used: bot.commands_used,
        uptime_percentage: bot.uptime_percentage
      })
    }
  }, [bot])

  const loadBot = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await getBotById(botId)
      
      if (error) throw new Error(error)
      if (!data) throw new Error('Bot not found')
      
      setBot(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.client_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      const { data, error } = await updateBot(botId, formData)
      
      if (error) throw new Error(error)
      
      setBot(data)
      setIsEditMode(false)
      
      toast({
        title: "Success",
        description: "Bot updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleControl = async (action: 'start' | 'stop' | 'restart') => {
    try {
      setIsControlling(true)
      
      const { data, error } = await controlBot(botId, action)
      
      if (error) throw new Error(error)
      
      setBot(data)
      
      toast({
        title: "Success",
        description: `Bot ${action} completed successfully`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive"
      })
    } finally {
      setIsControlling(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await deleteBot(botId)
      
      if (error) throw new Error(error)
      
      toast({
        title: "Success",
        description: "Bot deleted successfully",
      })
      
      router.push('/bots')
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading bot...</p>
        </div>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Error: {error || 'Bot not found'}</p>
          <Button onClick={() => router.push('/bots')} className="mt-2">
            Back to Bots
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/bots')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              {bot.avatar_url ? (
                <img src={bot.avatar_url} alt={bot.name} className="h-10 w-10 rounded-full" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{bot.name}</h1>
              <p className="text-muted-foreground">{bot.client?.name} • {bot.template} template</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Bot</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{bot.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Bot
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Status and Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant={getStatusVariant(bot.status) as any} className="text-sm">
            {bot.status}
          </Badge>
          {bot.invite_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={bot.invite_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-3 w-3" />
                Invite Bot
              </a>
            </Button>
          )}
          {bot.discord_bot_id && (
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(bot.discord_bot_id)}>
              <Copy className="mr-2 h-3 w-3" />
              Copy Bot ID
            </Button>
          )}
        </div>
        
        {/* Bot Control Buttons */}
        <div className="flex gap-2">
          {bot.status === 'Offline' ? (
            <Button 
              size="sm" 
              onClick={() => handleControl('start')} 
              disabled={isControlling}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-3 w-3" />
              {isControlling ? 'Starting...' : 'Start'}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleControl('stop')} 
              disabled={isControlling}
            >
              <Square className="mr-2 h-3 w-3" />
              {isControlling ? 'Stopping...' : 'Stop'}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleControl('restart')} 
            disabled={isControlling}
          >
            <RotateCcw className="mr-2 h-3 w-3" />
            {isControlling ? 'Restarting...' : 'Restart'}
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Bot Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as BotStatus }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select value={formData.template} onValueChange={(value) => setFormData(prev => ({ ...prev, template: value as BotTemplate }))}>
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
              </>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium">Client</Label>
                  <p className="text-sm text-muted-foreground">{bot.client?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Template</Label>
                  <p className="text-sm text-muted-foreground">{bot.template}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(bot.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(bot.updated_at)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Discord Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Discord Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="discord_bot_id">Discord Application ID</Label>
                  <Input
                    id="discord_bot_id"
                    value={formData.discord_bot_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, discord_bot_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord_token">Discord Bot Token</Label>
                  <Input
                    id="discord_token"
                    type="password"
                    value={formData.discord_token || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, discord_token: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prefix">Command Prefix</Label>
                  <Input
                    id="prefix"
                    value={formData.prefix || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto_deploy"
                    checked={formData.auto_deploy || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_deploy: checked }))}
                  />
                  <Label htmlFor="auto_deploy">Auto-deploy updates</Label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium">Application ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{bot.discord_bot_id || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Command Prefix</Label>
                  <p className="text-sm text-muted-foreground">{bot.prefix || '!'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Auto-deploy</Label>
                  <p className="text-sm text-muted-foreground">{bot.auto_deploy ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Online</Label>
                  <p className="text-sm text-muted-foreground">{formatLastOnline(bot.last_online)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Description and URLs */}
        <Card>
          <CardHeader>
            <CardTitle>Description & URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite_url">Invite URL</Label>
                  <Input
                    id="invite_url"
                    value={formData.invite_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, invite_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    value={formData.webhook_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{bot.description || 'No description provided'}</p>
                </div>
                {bot.invite_url && (
                  <div>
                    <Label className="text-sm font-medium">Invite URL</Label>
                    <a href={bot.invite_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {bot.invite_url}
                    </a>
                  </div>
                )}
                {bot.webhook_url && (
                  <div>
                    <Label className="text-sm font-medium">Webhook URL</Label>
                    <p className="text-sm text-muted-foreground font-mono">{bot.webhook_url}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servers">Servers</Label>
                    <Input
                      id="servers"
                      type="number"
                      value={formData.servers || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, servers: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="users">Users</Label>
                    <Input
                      id="users"
                      type="number"
                      value={formData.users || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, users: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commands_used">Commands Used</Label>
                    <Input
                      id="commands_used"
                      type="number"
                      value={formData.commands_used || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, commands_used: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uptime_percentage">Uptime %</Label>
                    <Input
                      id="uptime_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.uptime_percentage || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, uptime_percentage: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                    <Server className="h-5 w-5" />
                    {bot.servers || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Servers</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                    <Users className="h-5 w-5" />
                    {bot.users || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                    <MessageSquare className="h-5 w-5" />
                    {bot.commands_used || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Commands</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                    <Zap className="h-5 w-5" />
                    {bot.uptime_percentage?.toFixed(1) || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 