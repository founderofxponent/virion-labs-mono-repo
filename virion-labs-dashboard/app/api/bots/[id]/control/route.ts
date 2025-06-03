import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ControlParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: ControlParams) {
  try {
    const { action } = await request.json()
    const { id: botId } = await params

    if (!action || !['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, or restart' },
        { status: 400 }
      )
    }

    // Get bot from database
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

    // Determine new status based on action
    let newStatus: string
    let lastOnline: string | null = bot.last_online

    switch (action) {
      case 'start':
      case 'restart':
        newStatus = 'Online'
        lastOnline = new Date().toISOString()
        break
      case 'stop':
        newStatus = 'Offline'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update bot status in database
    const { data: updatedBot, error: updateError } = await supabase
      .from('bots')
      .update({
        status: newStatus,
        last_online: lastOnline,
        updated_at: new Date().toISOString()
      })
      .eq('id', botId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update bot status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bot: updatedBot,
      action: action,
      message: `Bot ${action}ed successfully`
    })

  } catch (error) {
    console.error('Error controlling bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 