"use client"

import { useState } from "react"
import { Copy, ExternalLink, QrCode, Search, Plus, Edit, Trash2, MoreHorizontal, Power, PowerOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { ReferralLinkForm } from "@/components/referral-link-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useReferralLinks } from "@/hooks/use-referral-links"
import { type ReferralLinkWithAnalytics } from "@/lib/supabase"
import { toast } from "sonner"

export function LinksPage() {
  const { profile } = useAuth()
  const {
    links,
    loading,
    error,
    deleteLink,
    toggleLinkStatus,
    getAnalyticsSummary,
    formatDate,
  } = useReferralLinks()

  const [showLinkForm, setShowLinkForm] = useState(false)
  const [editingLink, setEditingLink] = useState<ReferralLinkWithAnalytics | null>(null)
  const [deletingLink, setDeletingLink] = useState<ReferralLinkWithAnalytics | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const filteredLinks = links
    .filter((link) => {
      if (filterPlatform !== "all" && link.platform.toLowerCase() !== filterPlatform) {
        return false
      }
      if (filterStatus === "active" && !link.is_active) {
        return false
      }
      if (filterStatus === "inactive" && link.is_active) {
        return false
      }
      if (searchQuery && !link.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === "most-clicks") {
        return b.clicks - a.clicks
      } else if (sortBy === "most-conversions") {
        return b.conversions - a.conversions
      } else if (sortBy === "highest-rate") {
        return (b.conversion_rate || 0) - (a.conversion_rate || 0)
      }
      return 0
    })

  const analytics = getAnalyticsSummary()

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleDeleteLink = async (link: ReferralLinkWithAnalytics) => {
    const result = await deleteLink(link.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Link deleted successfully!")
      setDeletingLink(null)
    }
  }

  const handleToggleStatus = async (link: ReferralLinkWithAnalytics) => {
    const result = await toggleLinkStatus(link.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Link ${link.is_active ? 'deactivated' : 'activated'} successfully!`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
            <p className="text-muted-foreground">Manage and track all your referral links</p>
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
            <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
            <p className="text-muted-foreground">Manage and track all your referral links</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-500">Error loading links: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
          <p className="text-muted-foreground">Manage and track all your referral links</p>
        </div>
        <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Referral Link</DialogTitle>
              <DialogDescription>Create a new referral link for your content</DialogDescription>
            </DialogHeader>
            <ReferralLinkForm 
              onSuccess={() => setShowLinkForm(false)}
              onCancel={() => setShowLinkForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLinks}</div>
            <p className="text-xs text-muted-foreground">{analytics.activeLinks} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analytics.averageConversionRate.toFixed(1)}% avg rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-clicks">Most Clicks</SelectItem>
              <SelectItem value="most-conversions">Most Conversions</SelectItem>
              <SelectItem value="highest-rate">Highest Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterPlatform !== "all" || filterStatus !== "all"
                  ? "No links found matching your criteria"
                  : "No referral links yet. Create your first link to get started!"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLinks.map((link) => (
            <LinkCard 
              key={link.id} 
              link={link} 
              onCopy={handleCopyLink}
              onEdit={setEditingLink}
              onDelete={setDeletingLink}
              onToggleStatus={handleToggleStatus}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Edit Link Dialog */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Referral Link</DialogTitle>
            <DialogDescription>Update your referral link details</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <ReferralLinkForm 
              link={editingLink}
              onSuccess={() => setEditingLink(null)}
              onCancel={() => setEditingLink(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLink} onOpenChange={(open) => !open && setDeletingLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Referral Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLink?.title}"? This action cannot be undone and will remove all associated analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLink && handleDeleteLink(deletingLink)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface LinkCardProps {
  link: ReferralLinkWithAnalytics
  onCopy: (url: string) => void
  onEdit: (link: ReferralLinkWithAnalytics) => void
  onDelete: (link: ReferralLinkWithAnalytics) => void
  onToggleStatus: (link: ReferralLinkWithAnalytics) => void
  formatDate: (date: string) => string
}

function LinkCard({ link, onCopy, onEdit, onDelete, onToggleStatus, formatDate }: LinkCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-[100px_1fr] items-start">
          <div className="aspect-video bg-muted rounded-md overflow-hidden">
            {link.thumbnail_url ? (
              <img 
                src={link.thumbnail_url} 
                alt={link.title} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=100&width=180"
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <QrCode className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{link.title}</h3>
                  <Badge variant={link.is_active ? "default" : "secondary"}>
                    {link.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {link.description && (
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{link.platform}</span>
                  <span>•</span>
                  <span>{formatDate(link.created_at)}</span>
                  {link.expires_at && (
                    <>
                      <span>•</span>
                      <span>Expires {formatDate(link.expires_at)}</span>
                    </>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(link)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleStatus(link)}>
                    {link.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(link)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2">
              <Input 
                value={link.referral_url} 
                readOnly 
                className="text-xs font-mono" 
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onCopy(link.referral_url)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">{link.clicks.toLocaleString()}</span> clicks
                </div>
                <div className="text-sm">
                  <span className="font-medium">{link.conversions.toLocaleString()}</span> conversions
                </div>
                <div className="text-sm">
                  <span className="font-medium">{(link.conversion_rate || 0).toFixed(1)}%</span> rate
                </div>
                <div className="text-sm">
                  <span className="font-medium">${link.earnings.toFixed(2)}</span> earned
                </div>
              </div>
              <div className="flex-1 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(link.original_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Original
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
