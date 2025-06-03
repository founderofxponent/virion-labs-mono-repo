"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Clock
} from "lucide-react"
import { useUnifiedData, type UnifiedData, type UnifiedListItem, type UnifiedActivity } from "@/hooks/use-unified-data"
import { useAuth } from "@/components/auth-provider"

// Stats card component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description 
}: { 
  title: string
  value: number | string
  icon: any
  trend?: number
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(trend)}%
            </span>
            <span className="ml-1">from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// List item component
function ListItem({ item, showValue = true }: { item: UnifiedListItem; showValue?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'online':
        return 'bg-green-100 text-green-800'
      case 'inactive':
      case 'offline':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <Badge variant="secondary" className={getStatusColor(item.status)}>
            {item.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
        <p className="text-xs text-muted-foreground">Created: {item.created}</p>
      </div>
      {showValue && (
        <div className="text-right">
          <p className="text-sm font-medium">{item.value.toLocaleString()}</p>
          {item.metadata.url && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Activity item component
function ActivityItem({ activity }: { activity: UnifiedActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className="flex items-center justify-center w-6 h-6 mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.user}</p>
        <p className="text-xs text-muted-foreground">{activity.action}</p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{activity.time}</span>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main dashboard component
export function UnifiedDashboard() {
  const { profile } = useAuth()
  const { data, loading, error, refetch } = useUnifiedData()

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const getStatsIcons = () => {
    switch (profile?.role) {
      case 'admin':
        return [Users, Activity, BarChart3, TrendingUp]
      case 'client':
        return [BarChart3, Users, TrendingUp, DollarSign]
      default:
        return [Activity, TrendingUp, DollarSign, BarChart3]
    }
  }

  const icons = getStatsIcons()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile?.role === 'admin' ? 'Admin Dashboard' : 
             profile?.role === 'client' ? 'Client Dashboard' : 
             'Influencer Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name}! Here's your overview.
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={data.stats.primaryLabel}
          value={data.stats.primary}
          icon={icons[0]}
          description={data.stats.conversionRate ? `${data.stats.conversionRate.toFixed(1)}% conversion rate` : undefined}
        />
        <StatsCard
          title={data.stats.secondaryLabel}
          value={data.stats.secondary}
          icon={icons[1]}
        />
        <StatsCard
          title={data.stats.tertiaryLabel}
          value={data.stats.tertiary}
          icon={icons[2]}
        />
        <StatsCard
          title={data.stats.quaternaryLabel}
          value={data.stats.quaternary}
          icon={icons[3]}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Primary List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {profile?.role === 'admin' ? 'Clients' : 
               profile?.role === 'client' ? 'Campaigns' : 
               'My Links'}
            </CardTitle>
            <CardDescription>
              {profile?.role === 'admin' ? 'Manage your clients and their performance' : 
               profile?.role === 'client' ? 'Track your campaign performance' : 
               'Your referral links and their performance'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.primaryList.length > 0 ? (
                data.primaryList.map((item) => (
                  <ListItem key={item.id} item={item} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No {profile?.role === 'admin' ? 'clients' : 
                       profile?.role === 'client' ? 'campaigns' : 
                       'links'} found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Secondary List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {profile?.role === 'admin' ? 'Bots' : 
               profile?.role === 'client' ? 'Top Influencers' : 
               'Recent Referrals'}
            </CardTitle>
            <CardDescription>
              {profile?.role === 'admin' ? 'Bot deployment status' : 
               profile?.role === 'client' ? 'Your best performing influencers' : 
               'Latest referral activity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.secondaryList.length > 0 ? (
                data.secondaryList.slice(0, 5).map((item) => (
                  <ListItem key={item.id} item={item} showValue={profile?.role !== 'admin'} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and actions in your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8 col-span-full">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(data.metadata.lastUpdated).toLocaleString()} • 
        Role: {data.metadata.role} • 
        Permissions: {data.metadata.permissions.join(', ')}
      </div>
    </div>
  )
} 