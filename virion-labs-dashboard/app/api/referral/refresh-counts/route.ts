import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { influencer_id } = body

    if (!influencer_id) {
      return NextResponse.json(
        { error: 'influencer_id is required' },
        { status: 400 }
      )
    }

    // Get all referral links for this influencer
    const { data: referralLinks, error: linksError } = await supabase
      .from('referral_links')
      .select('id')
      .eq('influencer_id', influencer_id)

    if (linksError) {
      console.error('Error fetching referral links:', linksError)
      return NextResponse.json(
        { error: 'Failed to fetch referral links' },
        { status: 500 }
      )
    }

    const updatedLinks = []

    // Update conversion counts for each link
    for (const link of referralLinks || []) {
      // Count all referrals for this link
      const { data: referralCount, error: countError } = await supabase
        .from('referrals')
        .select('id', { count: 'exact' })
        .eq('referral_link_id', link.id)

      if (countError) {
        console.error(`Error counting referrals for link ${link.id}:`, countError)
        continue
      }

      // Update the link with the correct count
      const { error: updateError } = await supabase
        .from('referral_links')
        .update({
          conversions: referralCount?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', link.id)

      if (updateError) {
        console.error(`Error updating link ${link.id}:`, updateError)
        continue
      }

      updatedLinks.push({
        link_id: link.id,
        conversions: referralCount?.length || 0
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Conversion counts refreshed successfully',
      updated_links: updatedLinks.length,
      details: updatedLinks
    })

  } catch (error) {
    console.error('Error refreshing conversion counts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 