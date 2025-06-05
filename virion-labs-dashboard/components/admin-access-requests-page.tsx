"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useAccessRequests } from "@/hooks/use-access-requests"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  Building,
  UserCheck,
  UserX
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AccessRequest {
  id: string
  campaign_id: string
  influencer_id: string
  request_status: string
  requested_at: string
  request_message: string
  access_granted_at: string | null
  access_granted_by: string | null
  admin_response: string | null
  discord_guild_campaigns: {
    id: string
    campaign_name: string
    campaign_type: string
    clients: {
      name: string
      industry: string
    }
  }
  user_profiles: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export function AdminAccessRequestsPage() {
  const { profile } = useAuth()
  const { refreshCount } = useAccessRequests()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseAction, setResponseAction] = useState<'approve' | 'deny'>('approve')
  const [adminResponse, setAdminResponse] = useState('')

  useEffect(() => {
    fetchAccessRequests()
  }, [])

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch('/api/admin/access-requests?status=pending')
      const data = await response.json()
      
      if (response.ok) {
        setRequests(data.requests || [])
      } else {
        console.error('Failed to fetch access requests:', data.error)
      }
    } catch (error) {
      console.error('Error fetching access requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResponseRequest = (request: AccessRequest, action: 'approve' | 'deny') => {
    setSelectedRequest(request)
    setResponseAction(action)
    setAdminResponse('')
    setShowResponseDialog(true)
  }

  const submitResponse = async () => {
    if (!selectedRequest || !profile?.id) return

    try {
      const response = await fetch('/api/admin/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          action: responseAction,
          admin_id: profile.id,
          admin_response: adminResponse
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh the requests list and sidebar count
        fetchAccessRequests()
        refreshCount()
        setShowResponseDialog(false)
        setSelectedRequest(null)
        console.log(`Access request ${responseAction}d successfully`)
      } else {
        console.error('Failed to respond to request:', data.error)
      }
    } catch (error) {
      console.error('Error responding to request:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'referral_onboarding': return 'bg-blue-500'
      case 'product_promotion': return 'bg-green-500'
      case 'community_engagement': return 'bg-purple-500'
      case 'support': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCampaignType = (type: string) => {
    return type.replace('_', ' ').toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Access Requests</h1>
          <p className="text-muted-foreground">
            Review and approve influencer access requests for campaigns
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {requests.length} Pending
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
            <p className="text-muted-foreground">
              All campaign access requests have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">
                      {request.discord_guild_campaigns.campaign_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`text-white ${getCampaignTypeColor(request.discord_guild_campaigns.campaign_type)}`}
                      >
                        {formatCampaignType(request.discord_guild_campaigns.campaign_type)}
                      </Badge>
                      <Badge variant="outline">
                        {request.discord_guild_campaigns.clients.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(request.requested_at)}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Influencer Info */}
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {request.user_profiles.avatar_url ? (
                    <img 
                      src={request.user_profiles.avatar_url}
                      alt={request.user_profiles.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {request.user_profiles.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{request.user_profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">{request.user_profiles.email}</p>
                  </div>
                </div>

                {/* Request Message */}
                {request.request_message && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Request Message</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{request.request_message}</p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleResponseRequest(request, 'approve')}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Access
                  </Button>
                  <Button 
                    onClick={() => handleResponseRequest(request, 'deny')}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Deny Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'approve' ? 'Approve' : 'Deny'} Access Request
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'approve' 
                ? 'Grant access to this campaign for the influencer?' 
                : 'Deny access to this campaign for the influencer?'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedRequest.user_profiles.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.discord_guild_campaigns.campaign_name}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-response">
                  Response Message {responseAction === 'deny' ? '(Required)' : '(Optional)'}
                </Label>
                <Textarea
                  id="admin-response"
                  placeholder={
                    responseAction === 'approve' 
                      ? 'Welcome to the campaign! You can now create referral links...'
                      : 'Please explain why access is being denied...'
                  }
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitResponse}
              disabled={responseAction === 'deny' && !adminResponse.trim()}
              variant={responseAction === 'approve' ? 'default' : 'destructive'}
            >
              {responseAction === 'approve' ? 'Approve' : 'Deny'} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 