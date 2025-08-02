"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useAccessRequestsApi, type AccessRequest } from "@/hooks/use-access-requests-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  UserCheck
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


export function AdminAccessRequestsPage() {
  const { profile } = useAuth()
  const { requests, loading, error, approveRequest, denyRequest, refetch } = useAccessRequestsApi()
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseAction, setResponseAction] = useState<'approve' | 'deny'>('approve')
  const [adminResponse, setAdminResponse] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleQuickAction = async (request: AccessRequest, action: 'approve' | 'deny') => {
    setProcessingId(request.id)
    try {
      if (action === 'approve') {
        await approveRequest(request.id)
      } else {
        await denyRequest(request.id)
      }
    } catch (error) {
      console.error('Error responding to request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleResponseRequest = (request: AccessRequest, action: 'approve' | 'deny') => {
    setSelectedRequest(request)
    setResponseAction(action)
    setAdminResponse('')
    setShowResponseDialog(true)
  }

  const submitResponse = async () => {
    if (!selectedRequest) return

    try {
      if (responseAction === 'approve') {
        await approveRequest(selectedRequest.id)
      } else {
        await denyRequest(selectedRequest.id)
      }
      setShowResponseDialog(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error responding to request:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCampaignTypeColor = (type?: string) => {
    switch (type) {
      case 'referral_onboarding': return 'bg-blue-500'
      case 'product_promotion': return 'bg-green-500'
      case 'community_engagement': return 'bg-purple-500'
      case 'support': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCampaignType = (type?: string) => {
    return type?.replace('_', ' ').toUpperCase() || 'UNKNOWN'
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
          <h1 className="text-3xl font-bold">Access Requests</h1>
          <p className="text-muted-foreground">
            Quick review and approval of campaign access requests
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
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No pending access requests to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between gap-8">
                {/* Left side - Main info */}
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  {/* Avatar */}
                  {request.user?.avatar_url?.url ? (
                    <img 
                      src={request.user.avatar_url.url}
                      alt={request.user.full_name || request.user.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {(request.user?.full_name || request.user?.username)?.charAt(0) || '?'}
                    </div>
                  )}
                  
                  {/* User & Campaign Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-gray-900 text-lg">
                        {request.user?.full_name || request.user?.username || 'Unknown User'}
                      </p>
                      <span className="text-gray-400 text-lg">→</span>
                      <p className="font-medium text-gray-700 text-lg flex-1 min-w-0 truncate">
                        {request.campaign?.name || 'Unknown Campaign'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="min-w-0 truncate">{request.user?.email || 'No email'}</span>
                      <Badge 
                        className={`text-white text-xs ${getCampaignTypeColor(request.campaign?.campaign_type)}`}
                      >
                        {formatCampaignType(request.campaign?.campaign_type)}
                      </Badge>
                      <span className="font-medium">Campaign Client</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Time & Actions */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right text-sm text-gray-500 min-w-[120px]">
                    <div className="flex items-center gap-2 justify-end">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(request.requested_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      size="default"
                      variant="outline"
                      className="border-green-200 text-green-700 hover:bg-green-50 px-6"
                      onClick={() => handleQuickAction(request, 'approve')}
                      disabled={processingId === request.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 px-6"
                      onClick={() => handleQuickAction(request, 'deny')}
                      disabled={processingId === request.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deny
                    </Button>
                    {request.request_message && (
                      <Button
                        size="default"
                        variant="ghost"
                        onClick={() => handleResponseRequest(request, 'approve')}
                        disabled={processingId === request.id}
                        title="View message & respond"
                        className="px-4"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Request Message (if exists) */}
              {request.request_message && (
                <div className="mt-4 p-4 bg-blue-50 rounded border-l-4 border-blue-200 text-sm text-gray-700 ml-[72px]">
                  <span className="font-medium text-blue-800">Message: </span>
                  {request.request_message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'approve' ? 'Approve' : 'Deny'} Access Request
            </DialogTitle>
            <DialogDescription>
              Add a personal message to your {responseAction === 'approve' ? 'approval' : 'denial'}.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {selectedRequest.user?.avatar_url?.url ? (
                    <img 
                      src={selectedRequest.user.avatar_url.url}
                      alt={selectedRequest.user.full_name || selectedRequest.user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {(selectedRequest.user?.full_name || selectedRequest.user?.username)?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedRequest.user?.full_name || selectedRequest.user?.username || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.campaign?.name || 'Unknown Campaign'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-response">
                  Personal Message {responseAction === 'deny' ? '(Required)' : '(Optional)'}
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
                  className="min-h-[100px]"
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