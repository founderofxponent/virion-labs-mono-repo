import { supabase } from './supabase'

export interface AnalyticsData {
  totalClicks: number
  totalSignups: number
  conversionRate: number
  totalEarnings: number
  performanceData: Array<{
    date: string
    clicks: number
    conversions: number
  }>
  platformData: Array<{
    name: string
    value: number
  }>
  conversionRateData: Array<{
    name: string
    rate: number
  }>
  ageData: Array<{
    age: string
    count: number
  }>
  locationData: Array<{
    country: string
    count: number
  }>
  influencerData: Array<{
    name: string
    conversions: number
    rate: number
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
      return this.getInfluencerAnalytics(userId, startDate, endDate)
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

  private static async getInfluencerAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData> {
    try {
      // Get referral links for this influencer
      const { data: links, error: linksError } = await supabase
        .from('referral_links')
        .select('*')
        .eq('influencer_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (linksError) throw linksError

      // Get referral analytics events
      const linkIds = links?.map(link => link.id) || []
      const { data: analytics, error: analyticsError } = await supabase
        .from('referral_analytics')
        .select('*')
        .in('link_id', linkIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (analyticsError) throw analyticsError

      // Get referrals data
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('influencer_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (referralsError) throw referralsError

      // Calculate totals
      const totalClicks = links?.reduce((sum, link) => sum + link.clicks, 0) || 0
      const totalSignups = referrals?.length || 0
      const totalEarnings = links?.reduce((sum, link) => sum + link.earnings, 0) || 0
      const conversionRate = totalClicks > 0 ? (totalSignups / totalClicks) * 100 : 0

      // Generate performance over time data
      const performanceData = this.generatePerformanceData(analytics || [], referrals || [], startDate, endDate)

      // Generate platform data
      const platformData = this.generatePlatformData(links || [])

      // Generate conversion rate by platform
      const conversionRateData = this.generateConversionRateData(links || [], referrals || [])

      // Generate age data
      const ageData = this.generateAgeData(referrals || [])

      // Generate location data
      const locationData = this.generateLocationData(analytics || [])

      return {
        totalClicks,
        totalSignups,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalEarnings,
        performanceData,
        platformData,
        conversionRateData,
        ageData,
        locationData,
        influencerData: [] // Not applicable for individual influencers
      }
    } catch (error) {
      console.error('Error fetching influencer analytics:', error)
      return this.getFallbackData()
    }
  }

  private static async getAdminAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData> {
    try {
      // Get all referral links
      const { data: links, error: linksError } = await supabase
        .from('referral_links')
        .select(`
          *,
          user_profiles!referral_links_influencer_id_fkey(full_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (linksError) throw linksError

      // Get all referral analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('referral_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (analyticsError) throw analyticsError

      // Get all referrals
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          user_profiles!referrals_influencer_id_fkey(full_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (referralsError) throw referralsError

      // Count active influencers
      const activeInfluencers = new Set(links?.map(link => link.influencer_id)).size

      // Calculate totals
      const totalClicks = links?.reduce((sum, link) => sum + link.clicks, 0) || 0
      const totalSignups = referrals?.length || 0
      const totalEarnings = links?.reduce((sum, link) => sum + link.earnings, 0) || 0
      const conversionRate = totalClicks > 0 ? (totalSignups / totalClicks) * 100 : 0

      // Generate performance over time data
      const performanceData = this.generatePerformanceData(analytics || [], referrals || [], startDate, endDate)

      // Generate platform data
      const platformData = this.generatePlatformData(links || [])

      // Generate conversion rate by platform
      const conversionRateData = this.generateConversionRateData(links || [], referrals || [])

      // Generate age data
      const ageData = this.generateAgeData(referrals || [])

      // Generate location data
      const locationData = this.generateLocationData(analytics || [])

      // Generate influencer performance data
      const influencerData = this.generateInfluencerData(links || [], referrals || [])

      return {
        totalClicks,
        totalSignups,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalEarnings: activeInfluencers, // For admin, show active influencers instead of earnings
        performanceData,
        platformData,
        conversionRateData,
        ageData,
        locationData,
        influencerData
      }
    } catch (error) {
      console.error('Error fetching admin analytics:', error)
      return this.getFallbackData()
    }
  }

  private static generatePerformanceData(
    analytics: any[],
    referrals: any[],
    startDate: Date,
    endDate: Date
  ) {
    const days: { [key: string]: { clicks: number; conversions: number } } = {}
    
    // Initialize days
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      days[dateStr] = { clicks: 0, conversions: 0 }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Count clicks from analytics
    analytics.forEach(event => {
      if (event.event_type === 'click') {
        const dateStr = event.created_at.split('T')[0]
        if (days[dateStr]) {
          days[dateStr].clicks++
        }
      }
    })

    // Count conversions from referrals
    referrals.forEach(referral => {
      const dateStr = referral.created_at.split('T')[0]
      if (days[dateStr]) {
        days[dateStr].conversions++
      }
    })

    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Show last 30 days maximum
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: data.clicks,
        conversions: data.conversions
      }))
  }

  private static generatePlatformData(links: any[]) {
    const platforms: { [key: string]: number } = {}
    
    links.forEach(link => {
      platforms[link.platform] = (platforms[link.platform] || 0) + link.clicks
    })

    return Object.entries(platforms).map(([name, value]) => ({ name, value }))
  }

  private static generateConversionRateData(links: any[], referrals: any[]) {
    const platformStats: { [key: string]: { clicks: number; conversions: number } } = {}
    
    // Count clicks by platform
    links.forEach(link => {
      if (!platformStats[link.platform]) {
        platformStats[link.platform] = { clicks: 0, conversions: 0 }
      }
      platformStats[link.platform].clicks += link.clicks
    })

    // Count conversions by platform
    referrals.forEach(referral => {
      if (!platformStats[referral.source_platform]) {
        platformStats[referral.source_platform] = { clicks: 0, conversions: 0 }
      }
      platformStats[referral.source_platform].conversions++
    })

    return Object.entries(platformStats).map(([name, stats]) => ({
      name,
      rate: stats.clicks > 0 ? Math.round((stats.conversions / stats.clicks) * 10000) / 100 : 0
    }))
  }

  private static generateAgeData(referrals: any[]) {
    const ageGroups: { [key: string]: number } = {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55+': 0
    }

    referrals.forEach(referral => {
      const age = referral.age
      if (age >= 18 && age <= 24) ageGroups['18-24']++
      else if (age >= 25 && age <= 34) ageGroups['25-34']++
      else if (age >= 35 && age <= 44) ageGroups['35-44']++
      else if (age >= 45 && age <= 54) ageGroups['45-54']++
      else if (age >= 55) ageGroups['55+']++
    })

    return Object.entries(ageGroups).map(([age, count]) => ({ age, count }))
  }

  private static generateLocationData(analytics: any[]) {
    const countries: { [key: string]: number } = {}
    
    analytics.forEach(event => {
      if (event.country) {
        countries[event.country] = (countries[event.country] || 0) + 1
      }
    })

    return Object.entries(countries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 countries
      .map(([country, count]) => ({ country, count }))
  }

  private static generateInfluencerData(links: any[], referrals: any[]) {
    const influencerStats: { [key: string]: { name: string; clicks: number; conversions: number } } = {}
    
    // Aggregate clicks by influencer
    links.forEach(link => {
      const influencerId = link.influencer_id
      const name = link.user_profiles?.full_name || 'Unknown Influencer'
      
      if (!influencerStats[influencerId]) {
        influencerStats[influencerId] = { name, clicks: 0, conversions: 0 }
      }
      influencerStats[influencerId].clicks += link.clicks
    })

    // Aggregate conversions by influencer
    referrals.forEach(referral => {
      const influencerId = referral.influencer_id
      const name = referral.user_profiles?.full_name || 'Unknown Influencer'
      
      if (!influencerStats[influencerId]) {
        influencerStats[influencerId] = { name, clicks: 0, conversions: 0 }
      }
      influencerStats[influencerId].conversions++
    })

    return Object.values(influencerStats)
      .map(stats => ({
        name: stats.name,
        conversions: stats.conversions,
        rate: stats.clicks > 0 ? Math.round((stats.conversions / stats.clicks) * 10000) / 100 : 0
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10) // Top 10 influencers
  }

  private static getFallbackData(): AnalyticsData {
    // Return some basic fallback data if database queries fail
    return {
      totalClicks: 0,
      totalSignups: 0,
      conversionRate: 0,
      totalEarnings: 0,
      performanceData: [],
      platformData: [],
      conversionRateData: [],
      ageData: [],
      locationData: [],
      influencerData: []
    }
  }
} 