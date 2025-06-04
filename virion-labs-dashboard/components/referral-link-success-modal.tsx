"use client"

import { useState } from "react"
import { Check, Copy, Plus, Eye, QrCode, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { type ReferralLink } from "@/lib/supabase"
import { generateShareText } from "@/lib/platform-helpers"

interface ReferralLinkSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  link: ReferralLink | null
  campaignName?: string
  clientName?: string
  onCreateAnother?: () => void
  onViewAllLinks?: () => void
  createdFrom?: "campaigns" | "links"
}

export function ReferralLinkSuccessModal({
  isOpen,
  onClose,
  link,
  campaignName,
  clientName,
  onCreateAnother,
  onViewAllLinks,
  createdFrom = "links"
}: ReferralLinkSuccessModalProps) {
  const [copied, setCopied] = useState(false)

  if (!link) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link.referral_url)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleDownloadQR = () => {
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
        downloadLink.download = `qr-code-${link.referral_code}.png`
        downloadLink.href = canvas.toDataURL()
        downloadLink.click()
      }
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const shareText = generateShareText(link.platform || 'other', link.title, campaignName)

  const handleSocialShare = (platform: string) => {
    const url = encodeURIComponent(link.referral_url)
    const text = encodeURIComponent(shareText)
    
    let shareUrl = ''
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`
        break
      default:
        return
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const getContextualActions = () => {
    if (createdFrom === "campaigns") {
      return (
        <div className="space-y-2">
          {onCreateAnother && (
            <Button onClick={onCreateAnother} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Another Link for This Campaign
            </Button>
          )}
          {onViewAllLinks && (
            <Button onClick={onViewAllLinks} variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              View All My Links
            </Button>
          )}
        </div>
      )
    } else {
      return (
        <div className="space-y-2">
          {onCreateAnother && (
            <Button onClick={onCreateAnother} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Another Link
            </Button>
          )}
        </div>
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Link Created Successfully!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Context */}
          {campaignName && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">{campaignName}</p>
                  {clientName && (
                    <p className="text-sm text-blue-600 dark:text-blue-300">{clientName}</p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Campaign Link
                </Badge>
              </div>
            </div>
          )}

          {/* Referral Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Your Referral Link</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={link.referral_url}
                readOnly
                className="font-mono text-sm bg-muted/50"
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 px-3"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Share Buttons */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Share on Social Media</Label>
            <div className="grid grid-cols-5 gap-2">
              <Button
                onClick={() => handleSocialShare('twitter')}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center gap-1 text-xs"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </Button>
              <Button
                onClick={() => handleSocialShare('facebook')}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center gap-1 text-xs"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
              <Button
                onClick={() => handleSocialShare('linkedin')}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center gap-1 text-xs"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </Button>
              <Button
                onClick={() => handleSocialShare('telegram')}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center gap-1 text-xs"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.306.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </Button>
              <Button
                onClick={() => handleSocialShare('whatsapp')}
                variant="outline"
                size="sm"
                className="h-12 flex flex-col items-center gap-1 text-xs"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">QR Code</Label>
            <div className="flex flex-col items-center space-y-4 p-4 bg-muted/30 rounded-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={link.referral_url}
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

          {/* Contextual Actions */}
          {getContextualActions()}

          {/* Footer */}
          <div className="pt-4 border-t">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Your link is ready to share! Start promoting to earn referrals.
              </p>
              <Button onClick={onClose} variant="ghost" className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 