export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const clientId = searchParams.get('client_id')
    const guildId = searchParams.get('guild_id')
    const isActive = searchParams.get('is_active')
    const campaignType = searchParams.get('campaign_type')
    const includeArchived = searchParams.get('include_archived') === 'true'
    const onlyArchived = searchParams.get('only_archived') === 'true'

    let query = supabase
      .from('discord_guild_campaigns')
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .order('created_at', { ascending: false })

    // Filter archived campaigns by default
    if (onlyArchived) {
      query = query.eq('archived', true)
    } else if (!includeArchived) {
      query = query.neq('archived', true)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    if (guildId) {
      query = query.eq('guild_id', guildId)
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (campaignType) {
      query = query.eq('campaign_type', campaignType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching Discord campaigns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch influencer information separately for campaigns that have influencer_id
    const campaignsWithInfluencers = await Promise.all(
      (data || []).map(async (campaign) => {
        if (campaign.influencer_id) {
          const { data: influencer } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', campaign.influencer_id)
            .single()
          
          return {
            ...campaign,
            user_profiles: influencer
          }
        }
        return campaign
      })
    )

    return NextResponse.json({ campaigns: campaignsWithInfluencers })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 