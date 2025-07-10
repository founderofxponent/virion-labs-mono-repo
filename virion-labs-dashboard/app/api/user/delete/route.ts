import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { password, userId } = body

    if (!password || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: password, userId' },
        { status: 400 }
      )
    }

    // First, get the user's email to verify the password
    const { data: user, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (getUserError || !user?.user?.email) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create a temporary client with anon key to verify password
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify password by attempting to sign in
    const { error: verifyError } = await anonSupabase.auth.signInWithPassword({
      email: user.user.email,
      password: password
    })

    if (verifyError) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      )
    }

    // Delete related data in order (to avoid foreign key constraint violations)
    
    try {
      // 1. First get referral link IDs to delete related analytics
      const { data: referralLinks } = await supabase
        .from('referral_links')
        .select('id')
        .eq('influencer_id', userId)

      if (referralLinks && referralLinks.length > 0) {
        const linkIds = referralLinks.map(link => link.id)
        
        // Delete referral analytics for these links
        const { error: analyticsError } = await supabase
          .from('referral_analytics')
          .delete()
          .in('link_id', linkIds)

        if (analyticsError) {
          console.error('Error deleting referral analytics:', analyticsError)
          throw new Error(`Failed to delete referral analytics: ${analyticsError.message}`)
        }
      }
    } catch (err) {
      console.error('Step 1 failed:', err)
      throw new Error(`Step 1 - Delete referral analytics failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 2. Delete discord referral interactions
      const { error: discordInteractionsError } = await supabase
        .from('discord_referral_interactions')
        .delete()
        .eq('influencer_id', userId)

      if (discordInteractionsError) {
        throw new Error(`Failed to delete discord referral interactions: ${discordInteractionsError.message}`)
      }
    } catch (err) {
      console.error('Step 2 failed:', err)
      throw new Error(`Step 2 - Delete discord interactions failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 3. Delete campaign influencer access
      const { error: campaignAccessError } = await supabase
        .from('campaign_influencer_access')
        .delete()
        .eq('influencer_id', userId)

      if (campaignAccessError) {
        throw new Error(`Failed to delete campaign influencer access: ${campaignAccessError.message}`)
      }

      // Also delete where user granted access to others
      const { error: grantedAccessError } = await supabase
        .from('campaign_influencer_access')
        .delete()
        .eq('access_granted_by', userId)

      if (grantedAccessError) {
        throw new Error(`Failed to delete granted access records: ${grantedAccessError.message}`)
      }
    } catch (err) {
      console.error('Step 3 failed:', err)
      throw new Error(`Step 3 - Delete campaign access failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    // Note: Campaign templates are now TypeScript-based, no database cleanup needed

    try {
      // 4. Delete referrals (where user is influencer or referred user)
      const { error: referralsAsInfluencerError } = await supabase
        .from('referrals')
        .delete()
        .eq('influencer_id', userId)

      if (referralsAsInfluencerError) {
        throw new Error(`Failed to delete referrals as influencer: ${referralsAsInfluencerError.message}`)
      }

      const { error: referralsAsReferredError } = await supabase
        .from('referrals')
        .delete()
        .eq('referred_user_id', userId)

      if (referralsAsReferredError) {
        throw new Error(`Failed to delete referrals as referred user: ${referralsAsReferredError.message}`)
      }
    } catch (err) {
      console.error('Step 5 failed:', err)
      throw new Error(`Step 5 - Delete referrals failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 6. Update bot configurations to remove influencer reference
      const { error: botConfigsError } = await supabase
        .from('discord_guild_campaigns')
        .update({ influencer_id: null })
        .eq('influencer_id', userId)

      if (botConfigsError) {
        throw new Error(`Failed to update bot configurations: ${botConfigsError.message}`)
      }
    } catch (err) {
      console.error('Step 6 failed:', err)
      throw new Error(`Step 6 - Update bot configurations failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 7. Update discord guild campaigns to remove influencer reference
      const { error: campaignsError } = await supabase
        .from('discord_guild_campaigns')
        .update({ influencer_id: null })
        .eq('influencer_id', userId)

      if (campaignsError) {
        throw new Error(`Failed to update discord guild campaigns: ${campaignsError.message}`)
      }
    } catch (err) {
      console.error('Step 7 failed:', err)
      throw new Error(`Step 7 - Update discord campaigns failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 8. Delete referral links (these should cascade delete related records)
      const { error: linksError } = await supabase
        .from('referral_links')
        .delete()
        .eq('influencer_id', userId)

      if (linksError) {
        throw new Error(`Failed to delete referral links: ${linksError.message}`)
      }
    } catch (err) {
      console.error('Step 8 failed:', err)
      throw new Error(`Step 8 - Delete referral links failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 9. Delete user settings (should cascade)
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', userId)

      if (settingsError) {
        throw new Error(`Failed to delete user settings: ${settingsError.message}`)
      }
    } catch (err) {
      console.error('Step 9 failed:', err)
      throw new Error(`Step 9 - Delete user settings failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 10. Delete user profile (should cascade)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        throw new Error(`Failed to delete user profile: ${profileError.message}`)
      }
    } catch (err) {
      console.error('Step 10 failed:', err)
      throw new Error(`Step 10 - Delete user profile failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    try {
      // 11. Finally, delete from auth using service role
      console.log('Attempting to delete user from auth using admin API...')
      const { error: adminDeleteError } = await supabase.auth.admin.deleteUser(userId)

      if (adminDeleteError) {
        console.log(`Admin API failed with error: ${adminDeleteError.message}`)
        console.log('Falling back to direct SQL deletion...')
        
        // Fallback to direct SQL deletion
        const { error: rpcError } = await supabase.rpc('delete_user_from_auth', {
          user_id: userId
        })
        
        if (rpcError) {
          throw new Error(`Both admin API and direct SQL deletion failed. Admin API error: ${adminDeleteError.message}, RPC error: ${rpcError.message}`)
        }
        
        console.log('User successfully deleted using direct SQL method')
      } else {
        console.log('User successfully deleted using admin API')
      }
    } catch (err) {
      console.error('Step 11 failed:', err)
      throw new Error(`Step 11 - Delete user from auth failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user account:', error)
    
    // Return more specific error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error)
    
    console.error('Detailed error:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Database error deleting user',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 