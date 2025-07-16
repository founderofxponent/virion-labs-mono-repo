import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for access request data
const AccessRequestSchema = z.object({
  discord_user_id: z.string().min(1),
  discord_username: z.string().min(1),
  discord_guild_id: z.string().min(1),
  full_name: z.string().min(2).max(50),
  email: z.string().email().min(5).max(100),
  verified_role_id: z.string().min(1)
});

/**
 * POST /api/access-requests
 * Store access request response from Discord bot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validatedData = AccessRequestSchema.parse(body);
    
    // Check if user already has an access request for this guild
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('id')
      .eq('discord_user_id', validatedData.discord_user_id)
      .eq('discord_guild_id', validatedData.discord_guild_id)
      .single();
    
    if (existingRequest) {
      // Update existing request instead of creating duplicate
      const { data, error } = await supabase
        .from('access_requests')
        .update({
          discord_username: validatedData.discord_username,
          full_name: validatedData.full_name,
          email: validatedData.email,
          verified_role_id: validatedData.verified_role_id,
          role_assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('discord_user_id', validatedData.discord_user_id)
        .eq('discord_guild_id', validatedData.discord_guild_id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating access request:', error);
        return NextResponse.json(
          { error: 'Failed to update access request' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Access request updated successfully',
        data
      });
    } else {
      // Create new access request
      const { data, error } = await supabase
        .from('access_requests')
        .insert({
          discord_user_id: validatedData.discord_user_id,
          discord_username: validatedData.discord_username,
          discord_guild_id: validatedData.discord_guild_id,
          full_name: validatedData.full_name,
          email: validatedData.email,
          verified_role_id: validatedData.verified_role_id,
          role_assigned_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating access request:', error);
        return NextResponse.json(
          { error: 'Failed to create access request' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Access request stored successfully',
        data
      });
    }
    
  } catch (error) {
    console.error('Error in access-requests API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/access-requests
 * This endpoint is intentionally not implemented as per user requirements
 * (no dashboard integration for viewing stored requests)
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Access requests viewing is not implemented' },
    { status: 404 }
  );
} 