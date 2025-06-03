"use client"

import { useState } from "react"
import { Bot, Download, Plus, Search, Server, Settings, Eye, Edit, Trash2, Activity, Users, MessageSquare, Clock } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useBots } from "@/hooks/use-bots"
import { useClients } from "@/hooks/use-clients"
import { useToast } from "@/hooks/use-toast"
import { type BotInsert } from "@/lib/supabase"

export function BotsPage() {
  const { profile } = useAuth()
  const { bots, loading, error, addBot, refreshBots, getStats, getStatusVariant, formatLastOnline } = useBots()
  const { clients } = useClients()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterClient, setFilterClient] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [showAddBot, setShowAddBot] = useState(false)
  
  // Form state for adding new bot
  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    template: "standard" as const,
    prefix: "!",
    description: "",
    auto_deploy: false,
    webhook_url: "",
    avatar_url: "",
    discord_application_id: "",
    discord_bot_token: ""
  })

  const filteredBots = bots
    .filter((bot) => {
      if (filterStatus !== "all" && bot.status.toLowerCase() !== filterStatus.toLowerCase()) {
        return false
      }
      if (filterClient !== "all" && bot.client_id !== filterClient) {
        return false
      }
      if (searchQuery && !bot.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      } else if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name)
      } else if (sortBy === "most-servers") {
        return (b.servers || 0) - (a.servers || 0)
      }
      return 0
    })

  const handleAddBot = async () => {
    if (!formData.name || !formData.client_id || !formData.discord_application_id || !formData.discord_bot_token) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setShowAddBot(false) // Close dialog immediately
    
    // Show loading toast
    const loadingToast = toast({
      title: "Creating Bot",
      description: "Creating Discord application and deploying bot...",
      duration: 10000,
    })

    const { error } = await addBot(formData)
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Discord bot created and deployed successfully!",
      })
      setFormData({
        name: "",
        client_id: "",
        template: "standard" as const,
        prefix: "!",
        description: "",
        auto_deploy: false,
        webhook_url: "",
        avatar_url: "",
        discord_application_id: "",
        discord_bot_token: ""
      })
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading bots...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Error loading bots: {error}</p>
          <Button onClick={refreshBots} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discord Bots</h1>
          <p className="text-muted-foreground">Manage all your Discord bots across clients</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddBot} onOpenChange={setShowAddBot}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Discord Bot</DialogTitle>
                <DialogDescription>Deploy a new Discord bot for a client</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot-name">Bot Name *</Label>
                    <Input 
                      id="bot-name" 
                      placeholder="Enter bot name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bot-client">Client *</Label>
                    <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
                      <SelectTrigger id="bot-client">
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot-template">Bot Template</Label>
                    <Select value={formData.template} onValueChange={(value) => setFormData(prev => ({ ...prev, template: value as any }))}>
                      <SelectTrigger id="bot-template">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Referral Bot</SelectItem>
                        <SelectItem value="advanced">Advanced Referral Bot</SelectItem>
                        <SelectItem value="custom">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bot-prefix">Command Prefix</Label>
                    <Input
                      id="prefix"
                      placeholder="e.g., !virion"
                      value={formData.prefix || ''}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bot-description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this bot does..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Discord Application Required</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    You need to create a Discord application first and provide the credentials below.
                  </p>
                  <ol className="text-xs text-amber-600 space-y-1">
                    <li>1. Go to <a href="https://discord.com/developers/applications" target="_blank" className="underline">Discord Developer Portal</a></li>
                    <li>2. Create a new application</li>
                    <li>3. Go to "Bot" section and create a bot</li>
                    <li>4. Copy the Application ID and Bot Token below</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord-app-id">Discord Application ID *</Label>
                    <Input
                      id="discord_application_id"
                      placeholder="e.g., 1234567890123456789"
                      value={formData.discord_application_id || ''}
                      onChange={(e) => setFormData({ ...formData, discord_application_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord-bot-token">Discord Bot Token *</Label>
                    <Input
                      id="discord_bot_token"
                      type="password"
                      placeholder="Your Discord bot token"
                      value={formData.discord_bot_token || ''}
                      onChange={(e) => setFormData({ ...formData, discord_bot_token: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar-url">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      placeholder="Bot avatar URL (optional)"
                      value={formData.avatar_url || ''}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      placeholder="Discord webhook URL (optional)"
                      value={formData.webhook_url || ''}
                      onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="auto_deploy"
                    checked={formData.auto_deploy === true}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_deploy: checked })}
                  />
                  <Label htmlFor="auto-deploy">Auto-deploy after creation</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddBot(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBot}>Create Bot</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bots..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Client" />
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="most-servers">Most Servers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bot Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Servers</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Last Online</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBots.map((bot) => (
                <TableRow key={bot.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {bot.avatar_url ? (
                          <img src={bot.avatar_url} alt={bot.name} className="h-8 w-8 rounded-full" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{bot.name}</div>
                        <div className="text-sm text-muted-foreground">{bot.template}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bot.client?.name}</div>
                      <div className="text-sm text-muted-foreground">{bot.client?.industry}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(bot.status) as any}>
                      {bot.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{bot.servers || 0}</TableCell>
                  <TableCell>{bot.users || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {bot.uptime_percentage?.toFixed(1) || 0}%
                    </div>
                  </TableCell>
                  <TableCell>{formatLastOnline(bot.last_online || null)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/bots/${bot.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/bots/${bot.id}?edit=true`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon">
                        <Server className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBots}</div>
            <p className="text-xs text-muted-foreground">
              {stats.onlineBots} online ({stats.onlinePercentage.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgServersPerBot.toFixed(1)} avg per bot
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgUsersPerBot.toFixed(1)} avg per bot
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgUptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCommands} total commands
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}