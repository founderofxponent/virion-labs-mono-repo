import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    // Build query to fetch bots with client information
    let query = supabase
      .from('bots')
      .select(`
        *,
        client:clients(id, name, industry)
      `)
      .order('created_at', { ascending: false })

    // Filter by client if provided
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: bots, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      bots: bots || [],
      total: bots?.length || 0
    })

  } catch (error) {
    console.error('Error fetching bots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 