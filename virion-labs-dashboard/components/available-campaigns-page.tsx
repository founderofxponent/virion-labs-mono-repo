"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAvailableCampaigns, type AvailableCampaign } from "@/hooks/use-available-campaigns"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import { 
  Target, 
  Users, 
  Calendar, 
  DollarSign, 
  ExternalLink, 
  Plus,
  Search,
  Clock,
  Building,
  Tag,
  Filter
} from "lucide-react"
import { ReferralLinkSuccessModal } from "./referral-link-success-modal"
import { ReferralLinkForm } from "./referral-link-form"

export function AvailableCampaignsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const {
    campaigns,
    loading,
    error,
    getCampaignTypes,
    getClients,
    formatCampaignType,
    isCampaignEndingSoon,
    getCampaignStats
  } = useAvailableCampaigns()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterClient, setFilterClient] = useState("all")
  const [selectedCampaign, setSelectedCampaign] = useState<AvailableCampaign | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdLink, setCreatedLink] = useState<any>(null)

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns
    .filter(campaign => {
      if (searchQuery && !campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !campaign.client_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    .filter(campaign => filterType === "all" || campaign.campaign_type === filterType)
    .filter(campaign => filterClient === "all" || campaign.client_name === filterClient)

  const stats = getCampaignStats()

  const handleLinkCreated = (link: any) => {
    setCreatedLink(link)
    setShowCreateDialog(false)
    setShowSuccessModal(true)
  }

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setCreatedLink(null)
    // Reopen the create dialog for the same campaign
    if (selectedCampaign) {
      openCreateDialog(selectedCampaign)
    }
  }

  const handleViewAllLinks = () => {
    setShowSuccessModal(false)
    setCreatedLink(null)
    router.push('/dashboard/links')
  }

  const openCreateDialog = (campaign: AvailableCampaign) => {
    setSelectedCampaign(campaign)
    setShowCreateDialog(true)
  }

  if (profile?.role !== 'influencer') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">This page is only available to influencers.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Available Campaigns</h1>
            <p className="text-muted-foreground">Browse active campaigns and create referral links to start earning</p>
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
            <h1 className="text-2xl font-bold tracking-tight">Available Campaigns</h1>
            <p className="text-muted-foreground">Browse active campaigns and create referral links to start earning</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-500">Error loading campaigns: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Available Campaigns</h1>
          <p className="text-muted-foreground">
            Browse active campaigns and create referral links to start earning
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">Active campaigns available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Types</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaignTypes}</div>
            <p className="text-xs text-muted-foreground">Different campaign types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">Unique clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ending Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.endingSoon}</div>
            <p className="text-xs text-muted-foreground">Campaigns ending in 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Campaign Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {getCampaignTypes().map(type => (
                <SelectItem key={type} value={type}>
                  {formatCampaignType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {getClients().map(client => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns List/Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterType !== "all" || filterClient !== "all"
                  ? "No campaigns found matching your criteria"
                  : "No campaigns available at the moment. Check back later!"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              onCreateLink={openCreateDialog}
              formatCampaignType={formatCampaignType}
              isCampaignEndingSoon={isCampaignEndingSoon}
            />
          ))}
        </div>
      )}

      {/* Create Referral Link Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Referral Link</DialogTitle>
            <DialogDescription>
              Create a referral link for {selectedCampaign?.campaign_name}
            </DialogDescription>
          </DialogHeader>
          
          <ReferralLinkForm 
            onSuccess={handleLinkCreated}
            onCancel={() => setShowCreateDialog(false)}
            preselectedCampaignId={selectedCampaign?.id}
          />
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <ReferralLinkSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setCreatedLink(null)
        }}
        link={createdLink}
        campaignName={selectedCampaign?.campaign_name}
        clientName={selectedCampaign?.client_name}
        onCreateAnother={handleCreateAnother}
        onViewAllLinks={handleViewAllLinks}
        createdFrom="campaigns"
      />
    </div>
  )
}

interface CampaignCardProps {
  campaign: AvailableCampaign
  onCreateLink: (campaign: AvailableCampaign) => void
  formatCampaignType: (type: string) => string
  isCampaignEndingSoon: (campaign: AvailableCampaign) => boolean
}

function CampaignCard({ campaign, onCreateLink, formatCampaignType, isCampaignEndingSoon }: CampaignCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] items-start">
          {/* Campaign Logo/Icon */}
          <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex items-center justify-center">
            {campaign.client_logo ? (
              <img 
                src={campaign.client_logo} 
                alt={campaign.client_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          {/* Campaign Details */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{campaign.campaign_name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {campaign.client_name}
                </p>
              </div>
              {isCampaignEndingSoon(campaign) && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  <Clock className="h-3 w-3 mr-1" />
                  Ending Soon
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {formatCampaignType(campaign.campaign_type)}
              </Badge>
              {campaign.campaign_end_date && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Ends {new Date(campaign.campaign_end_date).toLocaleDateString()}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {campaign.description}
            </p>

            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{campaign.target_audience}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{campaign.estimated_earnings}</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{campaign.discord_server}</span>
              </div>
            </div>

            {campaign.requirements && campaign.requirements.length > 0 && (
              <div>
                <Label className="text-xs font-medium">Requirements:</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaign.requirements.slice(0, 3).map((req, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                  {campaign.requirements.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{campaign.requirements.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => onCreateLink(campaign)}
            size="sm"
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 