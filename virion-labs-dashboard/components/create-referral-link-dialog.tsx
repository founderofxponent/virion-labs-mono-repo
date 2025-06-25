"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Users, Copy, ExternalLink, CheckCircle, Download, QrCode } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"

interface Campaign {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  client_name: string
  client_industry: string
  discord_server_name: string
  has_access: boolean
}

interface CreateReferralLinkDialogProps {
  campaign: Campaign | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (link: any) => void
}

const PLATFORMS = [
  { value: "Twitter", label: "Twitter/X" },
  { value: "Instagram", label: "Instagram" },
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube", label: "YouTube" },
  { value: "Facebook", label: "Facebook" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Other", label: "Other" }
]

export function CreateReferralLinkDialog({
  campaign,
  open,
  onOpenChange,
  onSuccess
}: CreateReferralLinkDialogProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [createdLink, setCreatedLink] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    platform: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaign || !profile?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.campaign_id}/referral-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          influencer_id: profile.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCreatedLink(data)
        toast.success("Referral link created successfully!")
        // Don't close immediately, show success state first
      } else {
        toast.error(data.error || "Failed to create referral link")
      }
    } catch (error) {
      console.error('Error creating referral link:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (createdLink?.referral_link?.referral_url) {
      navigator.clipboard.writeText(createdLink.referral_link.referral_url)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleDownloadQR = () => {
    if (!createdLink?.referral_link?.referral_url) return

    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const downloadLink = document.createElement('a')
        downloadLink.download = `qr-code-${createdLink.referral_link.referral_code || 'referral'}.png`
        downloadLink.href = canvas.toDataURL()
        downloadLink.click()
      }
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleClose = () => {
    setFormData({ title: "", description: "", platform: "" })
    setCreatedLink(null)
    onOpenChange(false)
  }

  const handleCreateAnother = () => {
    setCreatedLink(null)
    setFormData({ title: "", description: "", platform: "" })
  }

  const handleFinish = () => {
    onSuccess(createdLink)
    handleClose()
  }

  if (!campaign) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {createdLink ? "Referral Link Created!" : "Create Referral Link"}
          </DialogTitle>
          <DialogDescription>
            {createdLink 
              ? "Your referral link has been created and is ready to share"
              : `Create a referral link for ${campaign.campaign_name}`
            }
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          /* Success State */
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Link Created Successfully!</span>
            </div>

            {/* Campaign Info */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{campaign.campaign_name}</h4>
                <Badge className="bg-blue-500 text-white">
                  {campaign.campaign_type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {campaign.client_name} • {campaign.client_industry}
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{campaign.discord_server_name}</span>
              </div>
            </div>

            {/* Created Link Details */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Link Title</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {createdLink.referral_link.title}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Referral URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={createdLink.referral_link.referral_url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {createdLink.referral_link.discord_invite_url && (
                <div>
                  <Label className="text-sm font-medium">Discord Invite URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={createdLink.referral_link.discord_invite_url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(createdLink.referral_link.discord_invite_url)
                        toast.success("Discord invite copied!")
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">QR Code</Label>
              <div className="flex flex-col items-center space-y-4 p-4 bg-muted/30 rounded-lg">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={createdLink.referral_link.referral_url}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  includeMargin={true}
                  className="border rounded-md"
                />
                <Button onClick={handleDownloadQR} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCreateAnother} className="flex-1">
                Create Another
              </Button>
              <Button onClick={handleFinish} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Info */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{campaign.campaign_name}</h4>
                <Badge className="bg-blue-500 text-white">
                  {campaign.campaign_type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {campaign.client_name} • {campaign.client_industry}
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{campaign.discord_server_name}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Link Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Join Gaming Community - Special Offer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform where you'll share this link" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your referral link..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title || !formData.platform}
              >
                {loading ? "Creating..." : "Create Referral Link"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 