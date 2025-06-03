import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: bot, error } = await supabase
      .from('bots')
      .select(`
        *,
        client:clients(id, name, industry)
      `)
      .eq('id', id)
      .single()

    if (error || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ bot })
  } catch (error) {
    console.error('Error fetching bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const updates = await request.json()

    // Remove readonly fields
    const { discord_bot_id, created_at, deployment_id, server_endpoint, ...allowedUpdates } = updates

    const { data: bot, error } = await supabase
      .from('bots')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, industry)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update bot' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bot })
  } catch (error) {
    console.error('Error updating bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: botId } = params

    // Check if bot exists first
    const { data: bot, error: fetchError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single()

    if (fetchError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    // Delete the bot
    const { error: deleteError } = await supabase
      .from('bots')
      .delete()
      .eq('id', botId)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete bot' },
        { status: 500 }
      )
    }

    // Update client bot count
    const { data: currentClient } = await supabase
      .from('clients')
      .select('bots')
      .eq('id', bot.client_id)
      .single()

    if (currentClient) {
      await supabase
        .from('clients')
        .update({ 
          bots: Math.max(0, (currentClient.bots || 1) - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', bot.client_id)
    }

    return NextResponse.json({
      success: true,
      message: 'Bot deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}