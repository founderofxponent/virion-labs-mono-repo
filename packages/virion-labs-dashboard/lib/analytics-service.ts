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

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  includeCharts?: boolean
  dateRange?: string
  sections?: Array<'overview' | 'clients' | 'campaigns' | 'performance' | 'activity'>
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

  static async exportAnalytics(
    analyticsData: AnalyticsData,
    options: ExportOptions
  ): Promise<void> {
    const { format, dateRange = 'last-30-days' } = options
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `analytics-report-${dateRange}-${timestamp}`

    switch (format) {
      case 'csv':
        await this.exportToCSV(analyticsData, filename)
        break
      case 'json':
        await this.exportToJSON(analyticsData, filename)
        break
      case 'pdf':
        await this.exportToPDF(analyticsData, filename, options)
        break
      default:
        throw new Error('Unsupported export format')
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

  private static async exportToCSV(data: AnalyticsData, filename: string): Promise<void> {
    const csvSections: string[] = []

    // Overview metrics
    csvSections.push('OVERVIEW METRICS')
    csvSections.push('Metric,Value')
    csvSections.push(`Total Clients,${data.totalClients}`)
    csvSections.push(`Total Campaigns,${data.totalCampaigns}`)
    csvSections.push(`Total Responses,${data.totalOnboardingResponses}`)
    csvSections.push(`Average Completion Rate,${data.averageCompletionRate}%`)
    csvSections.push('')

    // Performance over time
    if (data.performanceData.length > 0) {
      csvSections.push('PERFORMANCE OVER TIME')
      csvSections.push('Date,Campaigns,Responses,Completions')
      data.performanceData.forEach(item => {
        csvSections.push(`${item.date},${item.campaigns},${item.responses},${item.completions}`)
      })
      csvSections.push('')
    }

    // Campaign performance
    if (data.campaignData.length > 0) {
      csvSections.push('CAMPAIGN PERFORMANCE')
      csvSections.push('Campaign Name,Responses,Completions,Completion Rate')
      data.campaignData.forEach(item => {
        csvSections.push(`"${item.name}",${item.responses},${item.completions},${item.completion_rate}%`)
      })
      csvSections.push('')
    }

    // Client distribution
    if (data.clientData.length > 0) {
      csvSections.push('CLIENT DISTRIBUTION')
      csvSections.push('Status,Count,Type')
      data.clientData.forEach(item => {
        csvSections.push(`${item.name},${item.value},${item.type}`)
      })
      csvSections.push('')
    }

    // Industry distribution
    if (data.industryData.length > 0) {
      csvSections.push('INDUSTRY DISTRIBUTION')
      csvSections.push('Industry,Count,Percentage')
      data.industryData.forEach(item => {
        csvSections.push(`${item.industry},${item.count},${item.percentage}%`)
      })
      csvSections.push('')
    }

    // Recent activity
    if (data.recentActivity.length > 0) {
      csvSections.push('RECENT ACTIVITY')
      csvSections.push('Type,Description,Timestamp')
      data.recentActivity.forEach(item => {
        csvSections.push(`${item.type},"${item.description}",${item.timestamp}`)
      })
    }

    const csvContent = csvSections.join('\n')
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  }

  private static async exportToJSON(data: AnalyticsData, filename: string): Promise<void> {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: 'json',
        version: '1.0'
      },
      analytics: data
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json')
  }

  private static async exportToPDF(data: AnalyticsData, filename: string, options: ExportOptions): Promise<void> {
    // For PDF export, we'll create an HTML template and convert it
    const htmlContent = this.generatePDFTemplate(data, options)
    
    // Create a temporary element to trigger print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print()
      }, 500)
    } else {
      // Fallback: create downloadable HTML file
      this.downloadFile(htmlContent, `${filename}.html`, 'text/html')
    }
  }

  private static generatePDFTemplate(data: AnalyticsData, options: ExportOptions): string {
    const timestamp = new Date().toLocaleDateString()
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report - ${timestamp}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-description { font-size: 12px; color: #888; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .no-data { text-align: center; color: #888; font-style: italic; padding: 20px; }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Analytics Report</h1>
        <p>Generated on ${timestamp} | Date Range: ${options.dateRange || 'last-30-days'}</p>
      </div>

      <div class="section">
        <h2 class="section-title">Overview Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-title">Total Clients</div>
            <div class="metric-value">${data.totalClients.toLocaleString()}</div>
            <div class="metric-description">Active clients on platform</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Total Campaigns</div>
            <div class="metric-value">${data.totalCampaigns.toLocaleString()}</div>
            <div class="metric-description">Bot campaigns deployed</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">User Responses</div>
            <div class="metric-value">${data.totalOnboardingResponses.toLocaleString()}</div>
            <div class="metric-description">Onboarding interactions</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Completion Rate</div>
            <div class="metric-value">${data.averageCompletionRate.toFixed(1)}%</div>
            <div class="metric-description">Average onboarding completion</div>
          </div>
        </div>
      </div>

      ${data.performanceData.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Performance Over Time</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Campaigns</th>
              <th>Responses</th>
              <th>Completions</th>
            </tr>
          </thead>
          <tbody>
            ${data.performanceData.map(item => `
              <tr>
                <td>${item.date}</td>
                <td>${item.campaigns}</td>
                <td>${item.responses}</td>
                <td>${item.completions}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.campaignData.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Campaign Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Responses</th>
              <th>Completions</th>
              <th>Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.campaignData.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.responses}</td>
                <td>${item.completions}</td>
                <td>${item.completion_rate.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.industryData.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Industry Distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Industry</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${data.industryData.map(item => `
              <tr>
                <td>${item.industry}</td>
                <td>${item.count}</td>
                <td>${item.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${data.recentActivity.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Recent Activity</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${data.recentActivity.map(item => `
              <tr>
                <td style="text-transform: capitalize;">${item.type}</td>
                <td>${item.description}</td>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    </body>
    </html>
    `
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
} 