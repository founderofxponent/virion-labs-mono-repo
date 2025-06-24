"use client"

import { useState, useEffect } from "react"
import { Calendar, Download, Users, Target, Activity, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useToast } from "@/hooks/use-toast"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface ComprehensiveAnalyticsData {
  overview: {
    total_campaigns: number
    active_campaigns: number
    campaigns_last_30_days: number
    total_clients: number
    active_clients: number
    new_clients_30_days: number
    total_users_responded: number  // Users who started onboarding (not completed responses)
    users_completed: number        // Fixed: clearer naming
    total_field_responses: number  // Optional: detailed response count
    responses_last_7_days: number
    responses_last_30_days: number
    total_interactions: number
    unique_interaction_users: number
    onboarding_completions: number
    interactions_24h: number
    total_referral_links: number
    active_referral_links: number
    total_clicks: number
    total_conversions: number
    completion_rate: number
    click_through_rate: number
  }
  campaigns: Array<{
    campaign_id: string
    campaign_name: string
    client_name: string
    total_fields: number
    active_fields: number
    required_fields: number
    total_users_started: number
    total_users_completed: number
    total_interactions: number
    interactions_last_7_days: number
    completion_rate: number
    is_active: boolean
    created_at: string
  }>
}

interface DailyMetrics {
  date: string
  campaigns_created: number
  responses_received: number
  responses_completed: number
  interactions: number
  referral_clicks: number
  new_users: number
}

export function AnalyticsPage() {
  const { profile, user } = useAuth()
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState("last-30-days")
  const [date, setDate] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<ComprehensiveAnalyticsData | null>(null)
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [isQuickExporting, setIsQuickExporting] = useState(false)

  const isAdmin = profile?.role === "admin"

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id || !profile?.role) return

      setLoading(true)
      try {
        const response = await fetch('/api/analytics/campaign-overview')
        const result = await response.json()
        
        if (result.success) {
          setAnalyticsData(result.data.overview)
          setDailyMetrics(result.data.dailyMetrics || [])
        } else {
          console.error('Failed to fetch analytics:', result.error)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user?.id, profile?.role, dateRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Business Analytics</h1>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Business Analytics</h1>
            <p className="text-muted-foreground">Failed to load analytics data.</p>
          </div>
        </div>
      </div>
    )
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const handleQuickExport = async () => {
    setIsQuickExporting(true)
    try {
      // Convert the new data structure to the old format for export compatibility
      const exportData = {
        totalClients: analyticsData.overview.total_clients,
        totalCampaigns: analyticsData.overview.total_campaigns,
        totalOnboardingStarts: analyticsData.overview.total_users_responded,
        averageCompletionRate: analyticsData.overview.completion_rate,
        performanceData: dailyMetrics.map(day => ({
          date: format(new Date(day.date), 'MMM dd'),
          campaigns: day.campaigns_created,
          responses: day.responses_received,
          completions: day.responses_completed
        })),
        clientData: [
          { name: 'Active', value: analyticsData.overview.active_clients, type: 'status' },
          { name: 'Total', value: analyticsData.overview.total_clients, type: 'status' }
        ],
        campaignData: analyticsData.campaigns.slice(0, 10).map(campaign => ({
          name: campaign.campaign_name,
          responses: campaign.total_users_started,
          completions: campaign.total_users_completed,
          completion_rate: campaign.completion_rate
        })),
        industryData: [],
        recentActivity: []
      }

      // Create CSV content
      const csvContent = [
        'OVERVIEW METRICS',
        'Metric,Value',
        `Total Clients,${exportData.totalClients}`,
        `Total Campaigns,${exportData.totalCampaigns}`,
        `Total Responses,${exportData.totalOnboardingResponses}`,
        `Average Completion Rate,${exportData.averageCompletionRate}%`,
        '',
        'DAILY PERFORMANCE',
        'Date,Campaigns Created,Responses,Completions,Interactions,Clicks',
        ...dailyMetrics.map(day => 
          `${day.date},${day.campaigns_created},${day.responses_received},${day.responses_completed},${day.interactions},${day.referral_clicks}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful!",
        description: "Analytics report exported as CSV",
      })
    } catch (error) {
      console.error('Quick export failed:', error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your analytics report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsQuickExporting(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Analytics</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Comprehensive business metrics across all clients and campaigns"
              : "Track your campaign performance and user engagement"}
          </p>
        </div>
        <div className="flex gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(date) => {
                  setDate(date || new Date())
                  setIsCalendarOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-90-days">Last 90 days</SelectItem>
              <SelectItem value="year-to-date">Year to date</SelectItem>
              <SelectItem value="all-time">All time</SelectItem>
            </SelectContent>
          </Select>
          {analyticsData && (
            <div className="flex gap-2">
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleQuickExport}
                    disabled={isQuickExporting}
                  >
                    {isQuickExporting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Quick CSV
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export all analytics data as CSV file</p>
                </TooltipContent>
              </UITooltip>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.total_clients)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.total_clients > 0 ? "Active clients on platform" : "No clients registered yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.total_campaigns)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.total_campaigns > 0 ? "Bot campaigns deployed" : "No campaigns created yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Users Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.total_users_responded)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.total_users_responded > 0 ? "Users who started onboarding" : "No users started yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData.overview.completion_rate)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.completion_rate > 0 ? "Average onboarding completion" : "No completions yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          {isAdmin && <TabsTrigger value="activity">Recent Activity</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Campaigns, users started, and completions over the selected period</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {dailyMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyMetrics.map(day => ({
                      date: format(new Date(day.date), 'MMM dd'),
                      campaigns: day.campaigns_created,
                      responses: day.responses_received,
                      completions: day.responses_completed
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="responses" stroke="#8884d8" activeDot={{ r: 8 }} name="Users Started" />
                    <Line yAxisId="right" type="monotone" dataKey="completions" stroke="#82ca9d" name="Completions" />
                    <Line yAxisId="left" type="monotone" dataKey="campaigns" stroke="#ffc658" name="New Campaigns" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground">No performance data available for this period</p>
                    <p className="text-sm text-muted-foreground mt-2">Performance data will appear once you have active campaigns</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Status Distribution</CardTitle>
                <CardDescription>Breakdown of clients by status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {analyticsData.overview.total_clients > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: analyticsData.overview.active_clients },
                          { name: 'Total', value: analyticsData.overview.total_clients }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {['Active', 'Total'].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No client data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industry Distribution</CardTitle>
                <CardDescription>Clients by industry</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {analyticsData.overview.total_clients > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Active', value: analyticsData.overview.active_clients },
                        { name: 'Total', value: analyticsData.overview.total_clients }
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Number of Clients" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No industry data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Users started and completion rates by campaign</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {analyticsData.campaigns.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.campaigns.slice(0, 10).map(campaign => ({
                      name: campaign.campaign_name,
                      responses: campaign.total_users_started,
                      completions: campaign.total_users_completed,
                      completion_rate: campaign.completion_rate
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="responses" fill="#8884d8" name="Users Started" />
                    <Bar yAxisId="left" dataKey="completions" fill="#82ca9d" name="Completions" />
                    <Line yAxisId="right" dataKey="completion_rate" stroke="#ffc658" name="Completion Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground">No campaign performance data available</p>
                    <p className="text-sm text-muted-foreground mt-2">Data will appear once users start onboarding campaigns</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Activity</CardTitle>
                <CardDescription>Recent campaign interactions and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.campaigns.slice(0, 10).map((campaign, index) => (
                      <div key={campaign.campaign_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            campaign.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.client_name} • {campaign.total_interactions} interactions • {campaign.interactions_last_7_days} in last 7 days
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {campaign.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">No campaign activity to display</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
    </TooltipProvider>
  )
}
