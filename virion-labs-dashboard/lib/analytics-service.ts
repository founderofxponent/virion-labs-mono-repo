import { supabase } from './supabase'

export interface AnalyticsData {
  // Core business metrics
  totalClients: number
  totalCampaigns: number
  totalOnboardingResponses: number
  averageCompletionRate: number
  
  // Performance over time
  performanceData: Array<{
    date: string
    campaigns: number
    responses: number
    completions: number
  }>
  
  // Client distribution
  clientData: Array<{
    name: string
    value: number
    type: string
  }>
  
  // Campaign performance
  campaignData: Array<{
    name: string
    responses: number
    completions: number
    completion_rate: number
  }>
  
  // Industry distribution
  industryData: Array<{
    industry: string
    count: number
    percentage: number
  }>
  
  // Recent activity
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
    details: any
  }>
}

export class AnalyticsService {
  static async getAnalytics(
    userId: string,
    userRole: string,
    dateRange: string = 'last-30-days'
  ): Promise<AnalyticsData> {
    const { startDate, endDate } = this.getDateRange(dateRange)

    if (userRole === 'admin') {
      return this.getAdminAnalytics(startDate, endDate)
    } else {
      return this.getClientAnalytics(userId, startDate, endDate)
    }
  }

  private static getDateRange(range: string): { startDate: Date; endDate: Date } {
    const endDate = new Date()
    const startDate = new Date()

    switch (range) {
      case 'last-7-days':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'last-30-days':
        startDate.setDate(endDate.getDate() - 30)
        break
      case 'last-90-days':
        startDate.setDate(endDate.getDate() - 90)
        break
      case 'year-to-date':
        startDate.setMonth(0, 1)
        break
      case 'all-time':
        startDate.setFullYear(2020, 0, 1) // Arbitrary early date
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    return { startDate, endDate }
  }

  private static async getAdminAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData> {
    try {
      // Get total clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (clientsError) throw clientsError

      // Get all clients for industry analysis
      const { data: allClients, error: allClientsError } = await supabase
        .from('clients')
        .select('*')

      if (allClientsError) throw allClientsError

      // Get campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('discord_guild_campaigns')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (campaignsError) throw campaignsError

      // Get onboarding responses
      const { data: responses, error: responsesError } = await supabase
        .from('campaign_onboarding_responses')
        .select('*, discord_guild_campaigns!inner(*)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (responsesError) throw responsesError

      // Get campaign analytics summary
      const { data: campaignAnalytics, error: analyticsError } = await supabase
        .rpc('get_campaign_analytics_summary')

      if (analyticsError) throw analyticsError

      // Calculate metrics
      const totalClients = allClients?.length || 0
      const totalCampaigns = campaigns?.length || 0
      const totalOnboardingResponses = responses?.length || 0
      const completedResponses = responses?.filter(r => r.is_completed).length || 0
      const averageCompletionRate = totalOnboardingResponses > 0 
        ? (completedResponses / totalOnboardingResponses) * 100 
        : 0

      // Generate performance over time data
      const performanceData = this.generatePerformanceOverTime(responses || [], campaigns || [], startDate, endDate)

      // Generate client distribution data
      const clientData = this.generateClientData(allClients || [])

      // Generate campaign performance data
      const campaignData = this.generateCampaignData(campaignAnalytics?.campaigns || [])

      // Generate industry distribution
      const industryData = this.generateIndustryData(allClients || [])

      // Generate recent activity
      const recentActivity = this.generateRecentActivity(responses || [], campaigns || [])

      return {
        totalClients,
        totalCampaigns,
        totalOnboardingResponses,
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
        performanceData,
        clientData,
        campaignData,
        industryData,
        recentActivity
      }
    } catch (error) {
      console.error('Error fetching admin analytics:', error)
      return this.getFallbackData()
    }
  }

  private static async getClientAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData> {
    try {
      // Get client's campaigns
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // For now, return basic fallback data for clients
      // This can be expanded based on client-specific needs
      return this.getFallbackData()
    } catch (error) {
      console.error('Error fetching client analytics:', error)
      return this.getFallbackData()
    }
  }

  private static generatePerformanceOverTime(
    responses: any[],
    campaigns: any[],
    startDate: Date,
    endDate: Date
  ) {
    const days: { [key: string]: { campaigns: number; responses: number; completions: number } } = {}
    
    // Initialize days
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      days[dateStr] = { campaigns: 0, responses: 0, completions: 0 }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Count campaigns by date
    campaigns.forEach(campaign => {
      const dateStr = campaign.created_at.split('T')[0]
      if (days[dateStr]) {
        days[dateStr].campaigns++
      }
    })

    // Count responses and completions by date
    responses.forEach(response => {
      const dateStr = response.created_at.split('T')[0]
      if (days[dateStr]) {
        days[dateStr].responses++
        if (response.is_completed) {
          days[dateStr].completions++
        }
      }
    })

    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Show last 30 days maximum
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        campaigns: data.campaigns,
        responses: data.responses,
        completions: data.completions
      }))
  }

  private static generateClientData(clients: any[]) {
    // Group clients by status and other metrics
    const statusCounts = {
      Active: 0,
      Inactive: 0,
      Pending: 0
    }

    clients.forEach(client => {
      statusCounts[client.status as keyof typeof statusCounts]++
    })

    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value, type: 'status' }))
  }

  private static generateCampaignData(campaigns: any[]) {
    return campaigns.slice(0, 10).map((campaign: any) => ({
      name: campaign.campaign_name || 'Unnamed Campaign',
      responses: campaign.total_users_started || 0,
      completions: campaign.total_users_completed || 0,
      completion_rate: campaign.completion_rate || 0
    }))
  }

  private static generateIndustryData(clients: any[]) {
    const industryCounts: { [key: string]: number } = {}
    
    clients.forEach(client => {
      const industry = client.industry || 'Other'
      industryCounts[industry] = (industryCounts[industry] || 0) + 1
    })

    const total = clients.length
    return Object.entries(industryCounts).map(([industry, count]) => ({
      industry,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
  }

  private static generateRecentActivity(responses: any[], campaigns: any[]) {
    const activities: any[] = []

    // Add recent campaign activities
    campaigns.slice(0, 5).forEach(campaign => {
      activities.push({
        type: 'campaign',
        description: `New campaign: ${campaign.campaign_name}`,
        timestamp: campaign.created_at,
        details: { campaign_id: campaign.id, campaign_type: campaign.campaign_type }
      })
    })

    // Add recent response activities
    responses.slice(0, 5).forEach(response => {
      activities.push({
        type: 'response',
        description: `User ${response.discord_username || response.discord_user_id} responded to ${response.field_key}`,
        timestamp: response.created_at,
        details: { 
          campaign_id: response.campaign_id, 
          field_key: response.field_key,
          is_completed: response.is_completed 
        }
      })
    })

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  private static getFallbackData(): AnalyticsData {
    return {
      totalClients: 0,
      totalCampaigns: 0,
      totalOnboardingResponses: 0,
      averageCompletionRate: 0,
      performanceData: [],
      clientData: [],
      campaignData: [],
      industryData: [],
      recentActivity: []
    }
  }
} 