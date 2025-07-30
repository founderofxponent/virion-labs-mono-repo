"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Bot, Calendar, Edit, Globe, Mail, Phone, Save, User, X, Loader2, Trash2, Zap } from "lucide-react"

import { generateInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useClients, type Client } from "@/hooks/use-clients"
import { toast } from "sonner"

interface ClientDetailPageProps {
  clientId: string
}

type ClientStatus = "active" | "inactive"

interface ClientUpdate {
  name?: string
  industry?: string
  website?: string | null
  primary_contact?: string | null
  contact_email?: string | null
  influencers?: number
  status?: string
}

interface EditFormState {
  name: string
  industry: string
  website: string
  primary_contact: string
  contact_email: string
  influencers: number
  status: ClientStatus
}

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateClient, deleteClient, getClientById, formatDate } = useClients()
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [campaignsCount, setCampaignsCount] = useState(0)

  // Form state for editing
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    industry: "",
    website: "",
    primary_contact: "",
    contact_email: "",
    influencers: 0,
    status: "active"
  })

  // Check for edit query parameter
  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (editParam === 'true') {
      setIsEditing(true)
      // Remove the edit parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('edit')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  // Handle edit save
  const handleSave = async () => {
    if (!client || !editForm.name || !editForm.industry) {
      toast.error("Please fill in required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const updates: ClientUpdate = {
        name: editForm.name,
        industry: editForm.industry,
        website: editForm.website.trim() || null,
        primary_contact: editForm.primary_contact.trim() || null,
        contact_email: editForm.contact_email.trim() || null,
        influencers: editForm.influencers,
        status: editForm.status
      }

      const clientIdentifier = client.documentId || client.id
      const { data, error } = await updateClient(clientIdentifier, updates)

      if (error) {
        toast.error(error)
      } else if (data) {
        // Use documentId from update response if available, otherwise fall back to numeric ID
        const clientIdentifier = data.documentId || client.id
        
        // Refresh the client data from the API
        const { data: refreshedData, error: refreshError } = await getClientById(clientIdentifier)
        if (refreshedData && !refreshError) {
          setClient(refreshedData)
          setEditForm({
            name: refreshedData.name,
            industry: refreshedData.industry,
            website: refreshedData.website || "",
            primary_contact: refreshedData.primary_contact || "",
            contact_email: refreshedData.contact_email || "",
            influencers: refreshedData.influencers || 0,
            status: refreshedData.status as ClientStatus
          })
          setCampaignsCount(refreshedData.campaign_count || 0)
        }
        setIsEditing(false)
        toast.success("Client updated successfully")
      }
    } catch (err) {
      toast.error("Failed to update client")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!client) return

    setIsDeleting(true)
    try {
      const clientIdentifier = client.documentId || client.id
      const { error } = await deleteClient(clientIdentifier)

      if (error) {
        toast.error(error)
      } else {
        toast.success("Client deleted successfully")
        router.push("/clients")
      }
    } catch (err) {
      toast.error("Failed to delete client")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Cancel edit
  const handleCancelEdit = () => {
    if (client) {
      setEditForm({
        name: client.name,
        industry: client.industry,
        website: client.website || "",
        primary_contact: client.primary_contact || "",
        contact_email: client.contact_email || "",
        influencers: client.influencers || 0,
        status: client.status as ClientStatus
      })
    }
    setIsEditing(false)
  }

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Try to parse as number first, but if it fails, use as string (documentId)
        const clientIdentifier = isNaN(parseInt(clientId)) ? clientId : parseInt(clientId)
        const { data, error } = await getClientById(clientIdentifier)

        if (error) {
          setError(error)
          return
        }
        
        if (data) {
          setClient(data)
          setEditForm({
            name: data.name,
            industry: data.industry,
            website: data.website || "",
            primary_contact: data.primary_contact || "",
            contact_email: data.contact_email || "",
            influencers: data.influencers || 0,
            status: data.status as ClientStatus
          })

          // Campaign count is already included in the data from the API
          setCampaignsCount(data.campaign_count || 0)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading client</p>
          <p className="text-sm text-muted-foreground">{error || "Client not found"}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {client.logo && (
                <AvatarImage src={client.logo} alt={client.name} />
              )}
              <AvatarFallback className="text-lg">{generateInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <p className="text-muted-foreground">{client.industry}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              client.status === "active" 
                ? "default" 
                : client.status === "inactive" 
                  ? "secondary" 
                  : "outline"
            }
          >
            {client.status}
          </Badge>
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              {isEditing ? "Edit client details" : "Client details and information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Client Name *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-industry">Industry *</Label>
                  <Select 
                    value={editForm.industry} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger id="edit-industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gaming">Gaming</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                      <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(value: ClientStatus) => 
                      setEditForm(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Industry:</span>
                  <span>{client.industry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Joined:</span>
                  <span>{formatDate(client.join_date)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              {isEditing ? "Edit contact details" : "Contact details and communication"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={editForm.website}
                    onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact">Primary Contact</Label>
                  <Input
                    id="edit-contact"
                    value={editForm.primary_contact}
                    onChange={(e) => setEditForm(prev => ({ ...prev, primary_contact: e.target.value }))}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Contact Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>
              </>
            ) : (
              <>
                {client.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Website:</span>
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {client.website}
                    </a>
                  </div>
                )}
                {client.primary_contact && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Primary Contact:</span>
                    <span>{client.primary_contact}</span>
                  </div>
                )}
                {client.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <a 
                      href={`mailto:${client.contact_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {client.contact_email}
                    </a>
                  </div>
                )}
                {!client.website && !client.primary_contact && !client.contact_email && (
                  <p className="text-muted-foreground text-sm">No contact information available</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>
              {isEditing ? "Edit client metrics" : "Client performance metrics"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-influencers">Influencers</Label>
                  <Input
                    id="edit-influencers"
                    type="number"
                    min="0"
                    value={editForm.influencers}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      influencers: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-campaigns">Campaigns</Label>
                  <Input
                    id="edit-campaigns"
                    type="number"
                    value={campaignsCount}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Campaign count is automatically calculated from active campaigns
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Influencers</span>
                  </div>
                  <div className="text-2xl font-bold">{client.influencers || 0}</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Campaigns</span>
                  </div>
                  <div className="text-2xl font-bold">{campaignsCount}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>System information and timestamps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Client ID:</span>
                <span className="text-sm text-muted-foreground font-mono">{client.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Created:</span>
                <span className="text-sm text-muted-foreground">
                  {client.created_at ? formatDate(client.created_at) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Updated:</span>
                <span className="text-sm text-muted-foreground">
                  {client.updated_at ? formatDate(client.updated_at) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{client.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 