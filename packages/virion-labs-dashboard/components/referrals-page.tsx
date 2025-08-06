"use client"

import { useState } from "react"
import { Download, Search, MoreHorizontal, Eye, Trash2, UserCheck, UserX, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { useReferralsApi } from "@/hooks/use-referrals-api"
import { type Referral } from "@/hooks/use-referrals-api"
import { toast } from "sonner"

export function ReferralsPage() {
  const { profile } = useAuth()
  const {
    referrals,
    loading,
    error,
    updateReferralStatus,
    deleteReferral,
    refetch,
  } = useReferralsApi()
  const roleName = typeof profile?.role === 'string' ? profile.role : profile?.role?.name

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getReferralsSummary = () => {
    const totalReferrals = referrals.length
    const completedReferrals = referrals.filter(r => r.status === 'completed').length
    const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0
    
    // This logic will need to be adapted once the full Referral type is available
    const platformCounts = referrals.reduce((acc, referral) => {
      const platform = referral.source_platform
      acc[platform] = (acc[platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topPlatform = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

    return {
      totalReferrals,
      activeReferrals: referrals.filter(r => r.status === 'active').length,
      completedReferrals,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      conversionRate,
      topPlatform,
      platformCounts,
    }
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [deletingReferral, setDeletingReferral] = useState<Referral | null>(null)

  const filteredReferrals = referrals
    .filter((referral) => {
      if (filterSource !== "all" && referral.source_platform.toLowerCase() !== filterSource) {
        return false
      }
      if (filterStatus !== "all" && referral.status !== filterStatus) {
        return false
      }
      if (
        searchQuery &&
        !referral.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !referral.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name)
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status)
      }
      return 0
    })

  const summary = getReferralsSummary()

  const handleStatusUpdate = async (referral: Referral, newStatus: string) => {
    try {
      await updateReferralStatus(referral.id, newStatus)
      toast.success(`Referral status updated to ${newStatus}`)
    } catch (error) {
      toast.error("Failed to update referral status")
    }
  }

  const handleDeleteReferral = async (referral: Referral) => {
    try {
      await deleteReferral(referral.id)
      toast.success("Referral deleted successfully!")
      setDeletingReferral(null)
    } catch (error) {
      toast.error("Failed to delete referral")
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Discord ID', 'Age', 'Status', 'Source', 'Link Title', 'Referral Code', 'Date'].join(','),
      ...filteredReferrals.map(referral => [
        referral.name,
        referral.email,
        referral.discord_id || '',
        referral.age || '',
        referral.status,
        referral.source_platform,
        referral.referral_link?.title || '',
        referral.referral_link?.referral_code || '',
        formatDate(referral.created_at)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'active':
        return 'secondary'
      case 'pending':
        return 'outline'
      case 'inactive':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
            <p className="text-muted-foreground">Track all users who signed up through your links</p>
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
            <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
            <p className="text-muted-foreground">Track all users who signed up through your links</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-500">Error loading referrals: {error}</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground">Track all users who signed up through your links</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} title="Refresh data">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {roleName === 'admin' && (
            <Button variant="outline" onClick={exportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">{summary.activeReferrals} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{summary.completedReferrals} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.topPlatform}</div>
            <p className="text-xs text-muted-foreground">{summary.platformCounts[summary.topPlatform] || 0} referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingReferrals}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="YouTube">YouTube</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Twitter">Twitter</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Referrals Table */}
      {filteredReferrals.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterSource !== "all" || filterStatus !== "all"
                  ? "No referrals found matching your criteria"
                  : "No referrals yet. Share your links to start getting referrals!"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Referral List ({filteredReferrals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{referral.name}</div>
                        {referral.discord_id && (
                          <div className="text-xs text-muted-foreground">{referral.discord_id}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{referral.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{referral.source_platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {referral.referral_link?.title || 'Unknown Link'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(referral.status)}>
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {referral.referral_link?.referral_code || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(referral.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {referral.status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(referral, 'active')}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Mark Active
                            </DropdownMenuItem>
                          )}
                          {referral.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(referral, 'completed')}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Mark Completed
                            </DropdownMenuItem>
                          )}
                          {referral.status !== 'inactive' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(referral, 'inactive')}>
                              <UserX className="h-4 w-4 mr-2" />
                              Mark Inactive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingReferral(referral)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingReferral} onOpenChange={(open) => !open && setDeletingReferral(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Referral</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the referral for "{deletingReferral?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingReferral && handleDeleteReferral(deletingReferral)}
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
