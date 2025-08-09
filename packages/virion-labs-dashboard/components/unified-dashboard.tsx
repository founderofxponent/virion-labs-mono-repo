"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle,
  Activity,
  Users,
  DollarSign,
  BarChart3,
  ExternalLink,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  ChevronRight,
  Calendar,
  Target,
  Settings,
  Edit
} from "lucide-react"
import { useDashboardData, type DashboardData, type DashboardListItem, type DashboardActivity } from "@/hooks/use-dashboard-data"
import { useAuth, type UserProfile } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

// Enhanced stats card component with better visual hierarchy
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  isMain = false,
  onClick
}: { 
  title: string
  value: number | string
  icon: any
  trend?: number
  description?: string
  isMain?: boolean
  onClick?: () => void
}) {
  const cardClasses = `transition-all duration-200 hover:shadow-md ${
    isMain ? 'border-primary/20 bg-primary/5' : ''
  } ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`

  return (
    <Card className={cardClasses} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={`font-medium ${isMain ? 'text-base' : 'text-sm'}`}>{title}</CardTitle>
        <div className={`p-2 rounded-lg ${isMain ? 'bg-primary/10' : 'bg-muted'}`}>
          <Icon className={`${isMain ? 'h-5 w-5 text-primary' : 'h-4 w-4 text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`font-bold ${isMain ? 'text-3xl' : 'text-2xl'} mb-2`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend !== undefined && (
          <div className="flex items-center text-sm">
            {trend > 0 ? (
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="mr-1 h-4 w-4 text-red-600" />
            )}
            <span className={`font-medium ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="ml-1 text-muted-foreground">vs last month</span>
          </div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Quick action button component
function QuickActionCard({ title, description, icon: Icon, onClick, variant = "default" }: {
  title: string
  description: string
  icon: any
  onClick: () => void
  variant?: "default" | "primary"
}) {
  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
      variant === 'primary' ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
    }`} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${variant === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

// Simplified list item with better spacing
function ListItem({ item, showActions = false, role }: { 
  item: DashboardListItem; 
  showActions?: boolean;
  role?: UserProfile['role'];
}) {
  const router = useRouter()
  const roleName = (typeof role === 'string' ? role : role?.name)?.toLowerCase()

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const handleViewClick = useCallback(() => {
    if (roleName === 'admin' || roleName === 'platform administrator') {
      // Navigate to client detail page
      router.push(`/clients/${item.id}`)
    } else if (roleName === 'influencer') {
      // Navigate to link analytics or details
      router.push(`/links`)
    } else if (roleName === 'client') {
      // Navigate to campaign details
      router.push(`/campaigns`)
    }
  }, [item.id, roleName, router])

  const handleExternalClick = useCallback(() => {
    if (item.metadata.url) {
      window.open(item.metadata.url, '_blank', 'noopener,noreferrer')
    }
  }, [item.metadata.url])

  return (
    <div className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-medium truncate">{item.title}</h4>
          <Badge variant="outline" className={`text-xs ${getStatusColor(item.status)}`}>
            {item.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate mb-1">{item.subtitle}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Created: {item.created}</span>
          <span className="font-medium">{item.value.toLocaleString()} {roleName === 'admin' || roleName === 'platform administrator' ? 'campaigns' : 'conversions'}</span>
        </div>
      </div>
      {showActions && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={handleViewClick}>
            <Eye className="h-4 w-4" />
          </Button>
          {item.metadata.url && (
            <Button variant="ghost" size="sm" onClick={handleExternalClick}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Activity item with better visual design
function ActivityItem({ activity }: { activity: DashboardActivity }) {
  const getActivityIcon = (type: string) => {
    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full"
    switch (type) {
      case 'success':
        return <div className={`${baseClasses} bg-green-100`}>
          <div className="w-3 h-3 bg-green-600 rounded-full" />
        </div>
      case 'warning':
        return <div className={`${baseClasses} bg-yellow-100`}>
          <div className="w-3 h-3 bg-yellow-600 rounded-full" />
        </div>
      case 'error':
        return <div className={`${baseClasses} bg-red-100`}>
          <div className="w-3 h-3 bg-red-600 rounded-full" />
        </div>
      default:
        return <div className={`${baseClasses} bg-blue-100`}>
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
        </div>
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {getActivityIcon(activity.type)}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{activity.user}</p>
        <p className="text-sm text-muted-foreground">{activity.action}</p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{activity.time}</span>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton with improved design
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Main stats skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      {/* Content cards skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

// Main dashboard component with improved layout
export function UnifiedDashboard({ data, loading, error, refetch }: {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => void
}) {
  const { profile } = useAuth()
  const router = useRouter()
  const roleName = (typeof profile?.role === 'string' ? profile.role : profile?.role?.name)?.toLowerCase()

  // Navigation handlers
  const handleAnalyticsClick = useCallback(() => {
    router.push('/analytics')
  }, [router])

  const handleClientsClick = useCallback(() => {
    router.push('/clients')
  }, [router])

  const handleCampaignsClick = useCallback(() => {
    if (roleName === 'admin' || roleName === 'platform administrator') {
      router.push('/bot-campaigns')
    } else {
      router.push('/campaigns')
    }
  }, [router, roleName])

  const handleLinksClick = useCallback(() => {
    router.push('/links')
  }, [router])

  const handleReferralsClick = useCallback(() => {
    router.push('/referrals')
  }, [router])

  const handleSettingsClick = useCallback(() => {
    router.push('/settings')
  }, [router])

  const handleViewAllClients = useCallback(() => {
    router.push('/clients')
  }, [router])

  const handleViewAllCampaigns = useCallback(() => {
    if (roleName === 'admin' || roleName === 'platform administrator') {
      router.push('/bot-campaigns')
    } else {
      router.push('/campaigns')
    }
  }, [router, roleName])

  const handleViewAllLinks = useCallback(() => {
    router.push('/links')
  }, [router])

  const handleCreateClient = useCallback(() => {
    router.push('/clients?action=create')
  }, [router])

  const handleTimeFilterChange = useCallback(() => {
    // This could open a date picker or filter modal
    // For now, we'll just refetch data
    refetch()
  }, [refetch])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Data Available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Your dashboard data is not available at the moment. Please try refreshing or contact support if the issue persists.
          </p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    )
  }

  const getStatsIcons = () => {
    switch (roleName) {
      case 'platform administrator':
      case 'admin':
        return [Users, Activity, BarChart3, Target]
      case 'client':
        return [BarChart3, Users, TrendingUp, DollarSign]
      default:
        return [Activity, TrendingUp, DollarSign, BarChart3]
    }
  }

  const icons = getStatsIcons()

  const getQuickActions = () => {
    switch (roleName) {
      case 'platform administrator':
      case 'admin':
        return [
          {
            title: "Add New Client",
            description: "Onboard a new client to the platform",
            icon: Plus,
            onClick: handleCreateClient,
            variant: "primary" as const
          },
          {
            title: "View Analytics",
            description: "Deep dive into performance metrics",
            icon: BarChart3,
            onClick: handleAnalyticsClick,
            variant: "default" as const
          },
          {
            title: "Manage Campaigns",
            description: "Create and monitor campaigns",
            icon: Target,
            onClick: handleCampaignsClick,
            variant: "default" as const
          }
        ]
      case 'client':
        return [
          {
            title: "Create Campaign",
            description: "Launch a new marketing campaign",
            icon: Plus,
            onClick: handleCampaignsClick,
            variant: "primary" as const
          },
          {
            title: "View Analytics",
            description: "Track campaign performance",
            icon: BarChart3,
            onClick: handleAnalyticsClick,
            variant: "default" as const
          },
          {
            title: "Settings",
            description: "Manage account settings",
            icon: Settings,
            onClick: handleSettingsClick,
            variant: "default" as const
          }
        ]
      case 'influencer':
        return [
          {
            title: "Create Link",
            description: "Generate a new referral link",
            icon: Plus,
            onClick: handleLinksClick,
            variant: "primary" as const
          },
          {
            title: "View Referrals",
            description: "Track your referral performance",
            icon: Users,
            onClick: handleReferralsClick,
            variant: "default" as const
          },
          {
            title: "Browse Campaigns",
            description: "Find new opportunities",
            icon: Target,
            onClick: handleCampaignsClick,
            variant: "default" as const
          }
        ]
      default:
        return []
    }
  }

  const getStatClickHandler = (index: number) => {
    switch (roleName) {
      case 'platform administrator':
      case 'admin':
        return [handleClientsClick, handleAnalyticsClick, handleAnalyticsClick, handleCampaignsClick][index]
      case 'client':
        return [handleAnalyticsClick, handleAnalyticsClick, handleAnalyticsClick, handleAnalyticsClick][index]
      case 'influencer':
        return [handleLinksClick, handleReferralsClick, handleReferralsClick, handleCampaignsClick][index]
      default:
        return undefined
    }
  }

  const getViewAllHandler = () => {
    switch (roleName) {
      case 'platform administrator':
      case 'admin':
        return handleViewAllClients
      case 'client':
        return handleViewAllCampaigns
      case 'influencer':
        return handleViewAllLinks
      default:
        return () => {}
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {roleName === 'admin' || roleName === 'platform administrator' ? 'Admin Dashboard' : 
             roleName === 'client' ? 'Client Dashboard' : 
             'Influencer Dashboard'}
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back, {profile?.full_name}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleTimeFilterChange}>
            <Calendar className="mr-2 h-4 w-4" />
            This Month
          </Button>
        </div>
      </div>

      {/* Main Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={data.stats.primaryLabel}
          value={data.stats.primary}
          icon={icons[0]}
          trend={data.stats.conversionRate}
          isMain={true}
          onClick={getStatClickHandler(0)}
        />
        <StatsCard
          title={data.stats.secondaryLabel}
          value={data.stats.secondary}
          icon={icons[1]}
          onClick={getStatClickHandler(1)}
        />
        <StatsCard
          title={data.stats.tertiaryLabel}
          value={data.stats.tertiary}
          icon={icons[2]}
          onClick={getStatClickHandler(2)}
        />
        <StatsCard
          title={data.stats.quaternaryLabel}
          value={data.stats.quaternary}
          icon={icons[3]}
          onClick={getStatClickHandler(3)}
        />
      </div>

      {/* Quick Actions Section */}
      {getQuickActions().length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getQuickActions().map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Primary List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {roleName === 'admin' || roleName === 'platform administrator' ? 'Recent Clients' : 
                   roleName === 'client' ? 'Active Campaigns' : 
                   'My Links'}
                </CardTitle>
                <CardDescription>
                  {roleName === 'admin' || roleName === 'platform administrator' ? 'Latest client onboardings and their status' : 
                   roleName === 'client' ? 'Your campaign performance overview' : 
                   'Your referral links and their performance'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={getViewAllHandler()}>
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.primaryList.length > 0 ? (
              data.primaryList.slice(0, 4).map((item) => (
                <ListItem key={item.id} item={item} showActions={true} role={profile?.role} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-muted-foreground mb-2">
                  No {roleName === 'admin' || roleName === 'platform administrator' ? 'clients' : 
                       roleName === 'client' ? 'campaigns' : 
                       'links'} yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating your first {roleName === 'admin' || roleName === 'platform administrator' ? 'client' : 'campaign'}.
                </p>
                <Button onClick={getQuickActions()[0]?.onClick} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {getQuickActions()[0]?.title || 'Get Started'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription>Latest updates and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 6).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {(roleName === 'admin' || roleName === 'platform administrator') && data.secondaryList.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Campaign Performance</CardTitle>
                <CardDescription>Top performing campaigns and their metrics</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleViewAllCampaigns}>
                View All Campaigns
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.secondaryList.slice(0, 6).map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/bot-campaigns/${item.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.subtitle}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Performance</span>
                      <span className="font-medium">{Math.min(100, (item.value / 1000) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, (item.value / 1000) * 100)} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}