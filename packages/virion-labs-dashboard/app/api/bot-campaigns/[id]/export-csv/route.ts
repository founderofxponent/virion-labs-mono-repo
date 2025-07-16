import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // First verify the campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get onboarding data for this campaign from the correct table
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('campaign_onboarding_responses')
      .select(`
        *,
        referral_links:referral_link_id(title, referral_code)
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (onboardingError) {
      console.error('Error fetching onboarding data:', onboardingError)
      return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 })
    }

    if (!onboardingData || onboardingData.length === 0) {
      return NextResponse.json({ 
        error: 'No onboarding data available for export',
        message: `The campaign "${campaign.campaign_name}" doesn't have any onboarding responses yet. Users need to complete the onboarding process before data can be exported.`
      }, { status: 400 })
    }

    // Group responses by user
    const userResponses = new Map<string, any>()
    
    onboardingData.forEach((response: any) => {
      const userId = response.discord_user_id
      if (!userResponses.has(userId)) {
        userResponses.set(userId, {
          discord_user_id: response.discord_user_id,
          discord_username: response.discord_username,
          referral_code: response.referral_links?.referral_code || '',
          referral_title: response.referral_links?.title || '',
          created_at: response.created_at,
          responses: {}
        })
      }
      
      const user = userResponses.get(userId)
      user.responses[response.field_key] = response.field_value
      
      // Keep the earliest submission date
      if (new Date(response.created_at) < new Date(user.created_at)) {
        user.created_at = response.created_at
      }
    })

    // Convert to array and prepare CSV data
    const users = Array.from(userResponses.values())

    // Get all unique field keys to create column headers
    const allFieldKeys = new Set<string>()
    users.forEach(user => {
      Object.keys(user.responses).forEach(key => allFieldKeys.add(key))
    })

    // Create CSV headers
    const headers = [
      'Discord User ID',
      'Discord Username', 
      'Referral Code',
      'Referral Title',
      'Submission Date',
      ...Array.from(allFieldKeys).sort()
    ]

    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...users.map(user => {
        const row = [
          user.discord_user_id,
          `"${user.discord_username}"`,
          user.referral_code,
          `"${user.referral_title}"`,
          new Date(user.created_at).toISOString(),
          ...Array.from(allFieldKeys).sort().map(key => {
            const value = user.responses[key] || ''
            return `"${value.toString().replace(/"/g, '""')}"`
          })
        ]
        return row.join(',')
      })
    ]

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="campaign-${campaign.campaign_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-onboarding-data.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 