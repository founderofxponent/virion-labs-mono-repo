import { NextRequest, NextResponse } from 'next/server'

// Discord webhook simulator for testing onboarding field collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      guild_id,
      user_id, 
      username,
      field_responses,
      campaign_id,
      referral_code 
    } = body

    console.log('=== Discord Onboarding Webhook Received ===')
    console.log('Guild ID:', guild_id)
    console.log('User ID:', user_id)
    console.log('Username:', username)
    console.log('Campaign ID:', campaign_id)
    console.log('Referral Code:', referral_code)
    console.log('Field Responses:', JSON.stringify(field_responses, null, 2))

    // Simulate Discord bot workflow
    const workflow = {
      step1: 'User joins Discord server',
      step2: 'Bot detects new member',
      step3: 'Bot checks if onboarding is enabled for campaign',
      step4: 'Bot starts DM conversation with onboarding questions',
      step5: 'User responds to questions in sequence',
      step6: 'Bot collects all responses and submits to API',
      step7: 'Bot assigns roles/permissions based on completion'
    }

    // Submit to actual onboarding API
    const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discord/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id,
        discord_user_id: user_id,
        discord_username: username,
        referral_code,
        onboarding_data: field_responses,
        is_completed: true
      })
    })

    const onboardingResult = await onboardingResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Discord onboarding webhook processed successfully',
      workflow,
      onboarding_result,
      discord_actions: [
        'Sent welcome message to user',
        'Collected onboarding responses via DM',
        'Updated user roles and permissions',
        'Logged completion in analytics'
      ]
    })

  } catch (error) {
    console.error('Discord webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process Discord webhook' },
      { status: 500 }
    )
  }
}

// Test endpoint to simulate Discord bot onboarding flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaign_id')
  
  if (!campaignId) {
    return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })
  }

  // Fetch onboarding fields for the campaign
  const fieldsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discord/onboarding?campaign_id=${campaignId}`)
  const fieldsData = await fieldsResponse.json()

  // Simulate Discord bot onboarding flow
  const simulatedFlow = {
    campaign_id: campaignId,
    fields: fieldsData.fields,
    discord_bot_flow: [
      '🤖 **Bot:** Welcome to the server! I need to ask you a few questions to get you set up.',
      '👤 **User:** Sure, what do you need to know?',
      ...fieldsData.fields?.map((field: any, index: number) => [
        `🤖 **Bot:** ${field.field_label}${field.is_required ? ' *' : ''}`,
        `📝 **Description:** ${field.field_description || 'No description'}`,
        `👤 **User:** [responds with answer]`
      ]).flat() || [],
      '🤖 **Bot:** Perfect! Your onboarding is complete. Welcome to the community!',
      '✅ **System:** User roles updated, analytics logged, onboarding marked complete'
    ],
    sample_webhook_payload: {
      guild_id: "123456789012345678",
      user_id: "987654321098765432",
      username: "new_member#1234",
      campaign_id: campaignId,
      referral_code: "REF123",
      field_responses: fieldsData.fields?.reduce((acc: any, field: any) => {
        acc[field.field_key] = field.field_type === 'select' 
          ? field.field_options?.[0] || 'Sample response'
          : `Sample ${field.field_type} response`
        return acc
      }, {}) || {}
    }
  }

  return NextResponse.json(simulatedFlow)
} 