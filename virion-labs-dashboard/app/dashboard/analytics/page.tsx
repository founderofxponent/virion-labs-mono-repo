'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  Activity,
  Target,
  BarChart3,
  UserCheck,
  MessageSquare,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import { useDiscordCampaigns } from '@/hooks/use-discord-campaigns';

const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4'];

export default function AnalyticsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  
  const {
    loading,
    error,
    campaignOverviews,
    dailyMetrics,
    fieldPerformance,
    journeyInsights,
    recentJourneys,
    fetchCampaignOverview,
    fetchFieldPerformance,
    fetchUserJourneyInsights,
    refreshAllAnalytics
  } = useAnalytics();

  const { campaigns, fetchCampaigns } = useDiscordCampaigns();

  useEffect(() => {
    fetchCampaigns();
    fetchCampaignOverview();
  }, [fetchCampaigns, fetchCampaignOverview]);

  useEffect(() => {
    if (selectedCampaign && selectedCampaign !== 'all') {
      refreshAllAnalytics(selectedCampaign);
    } else {
      fetchCampaignOverview();
    }
  }, [selectedCampaign, refreshAllAnalytics, fetchCampaignOverview]);

  const handleRefresh = () => {
    if (selectedCampaign === 'all') {
      fetchCampaignOverview();
    } else {
      refreshAllAnalytics(selectedCampaign);
    }
  };

  const selectedCampaignData = campaignOverviews.find(c => c.campaign_id === selectedCampaign);
  const allCampaignsData = campaignOverviews.reduce((acc, campaign) => ({
    total_users_started: acc.total_users_started + campaign.total_users_started,
    total_users_completed: acc.total_users_completed + campaign.total_users_completed,
    completion_rate: acc.total_users_started > 0 
      ? ((acc.total_users_completed / acc.total_users_started) * 100)
      : 0,
    total_fields: acc.total_fields + campaign.total_fields,
    responses_last_7_days: acc.responses_last_7_days + campaign.responses_last_7_days
  }), {
    total_users_started: 0,
    total_users_completed: 0,
    completion_rate: 0,
    total_fields: 0,
    responses_last_7_days: 0
  });

  const displayData = selectedCampaign === 'all' ? allCampaignsData : selectedCampaignData;

  // Prepare chart data
  const dailyChartData = dailyMetrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString(),
    started: metric.unique_users_started,
    completed: metric.unique_users_completed,
    completion_rate: metric.unique_users_started > 0 
      ? ((metric.unique_users_completed / metric.unique_users_started) * 100).toFixed(1)
      : '0'
  })).reverse();

  const fieldChartData = fieldPerformance.map(field => ({
    name: field.field_label,
    completion_rate: field.completion_rate,
    drop_off_rate: field.drop_off_rate,
    total_responses: field.total_responses
  }));

  const durationDistributionData = journeyInsights?.duration_distribution?.map(bucket => ({
    name: bucket.duration_bucket,
    users: bucket.user_count,
    completed: bucket.completed_count,
    completion_rate: bucket.completion_rate
  })) || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor onboarding performance and user journey insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.campaign_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users Started</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData?.total_users_started || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{displayData?.responses_last_7_days || 0} in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Onboarding</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData?.total_users_completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {displayData?.completion_rate?.toFixed(1) || 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journeyInsights?.summary?.avg_duration_minutes?.toFixed(1) || 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              Median: {journeyInsights?.summary?.median_duration_minutes?.toFixed(1) || 0}m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fields</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData?.total_fields || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {selectedCampaign === 'all' ? campaignOverviews.length : 1} campaign(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fields">Field Performance</TabsTrigger>
          <TabsTrigger value="journeys">User Journeys</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
                <CardDescription>
                  Users started vs completed onboarding each day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="started" 
                      stackId="1"
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.3}
                      name="Started"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Completion Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trend</CardTitle>
                <CardDescription>
                  Daily completion percentage over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                    <Line 
                      type="monotone" 
                      dataKey="completion_rate" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Field Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Field Completion Rates</CardTitle>
                <CardDescription>
                  How users perform on each onboarding field
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={fieldChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                    <Bar dataKey="completion_rate" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Field Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Field Performance Details</CardTitle>
                <CardDescription>
                  Detailed metrics for each onboarding field
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldPerformance.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{field.field_label}</h4>
                          {field.is_required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {field.field_type} • {field.total_responses} responses
                        </p>
                        <div className="mt-2">
                          <Progress value={field.completion_rate} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{field.completion_rate.toFixed(1)}% completed</span>
                            <span>{field.drop_off_rate.toFixed(1)}% dropped</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Duration Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Time Distribution</CardTitle>
                <CardDescription>
                  How long users take to complete onboarding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={durationDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                    >
                      {durationDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Journey Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Journey Summary</CardTitle>
                <CardDescription>
                  Key insights about user onboarding journeys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Journeys</span>
                    <span className="text-2xl font-bold">
                      {journeyInsights?.summary?.total_journeys || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      {journeyInsights?.summary?.completion_rate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg. Fields Completed</span>
                    <span className="text-2xl font-bold">
                      {journeyInsights?.summary?.avg_fields_completed?.toFixed(1) || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Median Duration</span>
                    <span className="text-2xl font-bold">
                      {journeyInsights?.summary?.median_duration_minutes?.toFixed(1) || 0}m
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Journeys Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent User Journeys</CardTitle>
              <CardDescription>
                Latest onboarding sessions from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2">User</th>
                      <th className="pb-2">Started</th>
                      <th className="pb-2">Duration</th>
                      <th className="pb-2">Fields</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJourneys.slice(0, 10).map((journey, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">
                          <div>
                            <div className="font-medium">{journey.discord_username}</div>
                            <div className="text-xs text-muted-foreground">
                              {journey.discord_user_id}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 text-sm">
                          {new Date(journey.journey_start).toLocaleDateString()}
                        </td>
                        <td className="py-2 text-sm">
                          {journey.journey_duration_minutes.toFixed(1)}m
                        </td>
                        <td className="py-2 text-sm">
                          {journey.fields_completed}
                        </td>
                        <td className="py-2">
                          <Badge 
                            variant={journey.journey_completed ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {journey.journey_completed ? "Completed" : "In Progress"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Comparison</CardTitle>
              <CardDescription>
                Compare onboarding performance across all campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignOverviews.map((campaign, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{campaign.campaign_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {campaign.client_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.total_users_started} started • {campaign.total_users_completed} completed
                      </p>
                      <div className="mt-2">
                        <Progress value={campaign.completion_rate} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{campaign.completion_rate.toFixed(1)}% completion rate</span>
                          <span>{campaign.total_fields} fields</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 