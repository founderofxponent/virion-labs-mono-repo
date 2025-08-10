"use client"

import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useBotCampaignsAPI, getCampaignStatus } from '@/hooks/use-bot-campaigns-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CampaignWizard } from "@/components/campaign-wizard/CampaignWizard"

export default function ClientsCampaignsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const filters = useMemo(() => ({}), [])
  const { campaigns, loading, refresh } = useBotCampaignsAPI(filters)

  // Wizard dialog state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(undefined)

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

  const filtered = campaigns.filter(c => {
    // Search filter
    if (search) {
      const q = search.toLowerCase()
      const matchesSearch = 
        c.name.toLowerCase().includes(q) ||
        (c.client_name && c.client_name.toLowerCase().includes(q)) ||
        c.guild_id.toLowerCase().includes(q)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      const status = getCampaignStatus(c)
      if (status.toLowerCase() !== statusFilter.toLowerCase()) return false
    }

    return true
  })

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

  // Calculate statistics
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => getCampaignStatus(c) === 'active').length,
    inactive: campaigns.filter(c => getCampaignStatus(c) === 'inactive').length,
    archived: campaigns.filter(c => getCampaignStatus(c) === 'archived').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your Discord bot campaigns
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={openCreateWizard}>
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.inactive}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  id="search" 
                  placeholder="Search campaigns..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Label htmlFor="status" className="sr-only">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Showing ${filtered.length} of ${campaigns.length} campaigns`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                {search || statusFilter !== 'all' 
                  ? "Try adjusting your filters to see more campaigns"
                  : "Get started by creating your first campaign"}
              </p>
              {(!search && statusFilter === 'all') && (
                <Button className="flex items-center gap-2" onClick={openCreateWizard}>
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(campaign => {
                const status = getCampaignStatus(campaign)
                return (
                  <div 
                    key={campaign.documentId || campaign.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(status)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            <span>Guild ID: {campaign.guild_id}</span>
                            {campaign.client_name && (
                              <>
                                <span>•</span>
                                <span>Client: {campaign.client_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(status)}>
                          {status}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Campaign actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setWizardMode('edit')
                              setSelectedCampaignId((campaign as any).documentId || (campaign as any).id)
                              setWizardOpen(true)
                            }}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Campaign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })}
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
