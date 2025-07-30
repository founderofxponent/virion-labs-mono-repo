"use client"

import { Download, Users, Target, Activity, TrendingUp, Info, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
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
import { ExportDialog } from "@/components/export-dialog"
import { useAnalytics } from "@/hooks/use-analytics"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AnalyticsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { 
    analyticsData, 
    dailyMetrics, 
    loading, 
    error, 
    formatNumber, 
    formatPercentage 
  } = useAnalytics()

  const isAdmin = profile?.role === "admin" || profile?.role === "Platform Administrator"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading analytics</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
            <p className="text-muted-foreground">No analytics data available.</p>
          </div>
        </div>
      </div>
    )
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
          {analyticsData && (
            <UITooltip>
              <TooltipTrigger asChild>
                <ExportDialog 
                  trigger={
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Export campaign onboarding responses and user data</p>
              </TooltipContent>
            </UITooltip>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clients
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total number of registered clients on the platform.</p>
                  <p>Each client can have multiple campaigns.</p>
                </TooltipContent>
              </UITooltip>
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
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total number of Discord bot campaigns created across all clients.</p>
                  <p>Includes both active and inactive campaigns.</p>
                </TooltipContent>
              </UITooltip>
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
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of users who initiated the onboarding process by opening the first modal.</p>
                  <p>This is the starting point for calculating completion rates.</p>
                </TooltipContent>
              </UITooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.total_onboarding_starts)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.total_onboarding_starts > 0 ? "Users who started onboarding" : "No users started yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of users who completed the full onboarding process out of those who started.</p>
                  <p>Calculated as: (Users Completed ÷ Users Started) × 100</p>
                </TooltipContent>
              </UITooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData.overview.overall_completion_rate)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.overall_completion_rate > 0 ? "Average onboarding completion" : "No completions yet"}
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
              <CardTitle className="flex items-center gap-2">
                Performance Over Time
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Daily trends showing new campaigns created, users who started onboarding,</p>
                    <p>and users who completed the full process.</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
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
                <CardTitle className="flex items-center gap-2">
                  Client Status Distribution
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shows the distribution of active vs total clients</p>
                      <p>on the platform.</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
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
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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
                <CardTitle className="flex items-center gap-2">
                  Industry Distribution
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Distribution of clients across different industries.</p>
                      <p>Currently shows active vs total client breakdown.</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
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
              <CardTitle className="flex items-center gap-2">
                Campaign Performance
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compares users started vs completions for each campaign.</p>
                    <p>Shows both absolute numbers and completion rates.</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
              <CardDescription>Users started and completion rates by campaign</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {analyticsData.campaigns.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.campaigns.slice(0, 10).map(campaign => ({
                      name: campaign.name,
                      responses: campaign.total_starts,
                      completions: campaign.total_completions,
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
                <CardTitle className="flex items-center gap-2">
                  Campaign Activity
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shows Discord bot interactions for each campaign including commands, messages, and user engagements.</p>
                      <p>This is different from onboarding metrics.</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
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
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.client_name || 'N/A'} •
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help underline decoration-dotted">
                                    {campaign.total_interactions || 0} interactions
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Discord bot interactions like /start, /join commands,</p>
                                  <p>messages, and access requests</p>
                                </TooltipContent>
                              </UITooltip>
                              • {campaign.interactions_last_7_days || 0} in last 7 days
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
