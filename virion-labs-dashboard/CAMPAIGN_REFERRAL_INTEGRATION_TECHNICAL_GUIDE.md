# Campaign-Based Referral Links with Discord Integration - Technical Implementation Guide

## Overview

This guide outlines the technical implementation for integrating campaign-based referral links with Discord server onboarding, where admins control which Discord servers campaigns are assigned to, and influencers create referral links for available campaigns.

## Current Database Analysis

### ✅ Already Implemented
- `discord_guild_campaigns` table with full campaign configuration
- `referral_links.campaign_id` field linking referrals to campaigns  
- `campaign_influencer_access` table for controlling influencer access
- `get_guild_campaign_config()` function for Discord bot integration
- Admin campaign creation with Discord server assignment

### ❌ Missing Components
- Discord invite URL generation and storage
- Campaign landing pages for referral links
- API endpoints for influencer campaign browsing
- Enhanced referral link creation workflow

---

## Implementation Plan

### Phase 1: Database Enhancements
### Phase 2: API Endpoints Development  
### Phase 3: Frontend Components
### Phase 4: Discord Integration Updates
### Phase 5: Testing & Deployment

---

## Phase 1: Database Enhancements

### 1.1 Add Discord Invite Fields to Referral Links

```sql
-- Add Discord-specific fields to referral_links table
ALTER TABLE referral_links 
ADD COLUMN discord_invite_url TEXT,
ADD COLUMN discord_guild_id TEXT,
ADD COLUMN redirect_to_discord BOOLEAN DEFAULT false,
ADD COLUMN landing_page_enabled BOOLEAN DEFAULT true;

-- Index for performance
CREATE INDEX idx_referral_links_discord_guild ON referral_links(discord_guild_id);
CREATE INDEX idx_referral_links_campaign_active ON referral_links(campaign_id, is_active);
```

### 1.2 Create Discord Invite Tracking Table

```sql
-- Track Discord invites generated for campaigns
CREATE TABLE discord_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES discord_guild_campaigns(id),
    referral_link_id UUID REFERENCES referral_links(id),
    discord_invite_code TEXT NOT NULL,
    discord_invite_url TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    channel_id TEXT,
    max_uses INTEGER DEFAULT 0, -- 0 = unlimited
    expires_at TIMESTAMP WITH TIME ZONE,
    uses_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_discord_invites_campaign ON discord_invite_links(campaign_id);
CREATE INDEX idx_discord_invites_referral ON discord_invite_links(referral_link_id);
```

### 1.3 Enhanced Functions

```sql
-- Function to get available campaigns for influencer
CREATE OR REPLACE FUNCTION get_available_campaigns_for_influencer(p_influencer_id UUID)
RETURNS TABLE (
    campaign_id UUID,
    campaign_name TEXT,
    campaign_type TEXT,
    client_id UUID,
    client_name TEXT,
    client_industry TEXT,
    guild_id TEXT,
    discord_server_name TEXT,
    campaign_description TEXT,
    campaign_start_date TIMESTAMPTZ,
    campaign_end_date TIMESTAMPTZ,
    total_interactions INTEGER,
    referral_conversions INTEGER,
    has_access BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dgc.id,
        dgc.campaign_name,
        dgc.campaign_type,
        dgc.client_id,
        c.name,
        c.industry,
        dgc.guild_id,
        dgc.metadata->>'discord_server_name' as discord_server_name,
        dgc.metadata->>'description' as campaign_description,
        dgc.campaign_start_date,
        dgc.campaign_end_date,
        dgc.total_interactions,
        dgc.referral_conversions,
        CASE 
            WHEN cia.influencer_id IS NOT NULL THEN true 
            ELSE false 
        END as has_access
    FROM discord_guild_campaigns dgc
    LEFT JOIN clients c ON dgc.client_id = c.id
    LEFT JOIN campaign_influencer_access cia ON (
        dgc.id = cia.campaign_id 
        AND cia.influencer_id = p_influencer_id 
        AND cia.is_active = true
    )
    WHERE dgc.is_active = true
    AND (dgc.campaign_end_date IS NULL OR dgc.campaign_end_date > now())
    ORDER BY dgc.campaign_start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create Discord invite for campaign
CREATE OR REPLACE FUNCTION create_campaign_discord_invite(
    p_campaign_id UUID,
    p_referral_link_id UUID DEFAULT NULL
)
RETURNS TABLE (
    invite_code TEXT,
    invite_url TEXT
) AS $$
DECLARE
    v_guild_id TEXT;
    v_invite_code TEXT;
    v_invite_url TEXT;
BEGIN
    -- Get guild_id from campaign
    SELECT guild_id INTO v_guild_id 
    FROM discord_guild_campaigns 
    WHERE id = p_campaign_id AND is_active = true;
    
    IF v_guild_id IS NULL THEN
        RAISE EXCEPTION 'Campaign not found or inactive';
    END IF;
    
    -- Generate unique invite code
    v_invite_code := 'camp-' || LOWER(SUBSTRING(gen_random_uuid()::text, 1, 8));
    v_invite_url := 'https://discord.gg/' || v_invite_code;
    
    -- Store invite link
    INSERT INTO discord_invite_links (
        campaign_id, 
        referral_link_id, 
        discord_invite_code, 
        discord_invite_url, 
        guild_id
    ) VALUES (
        p_campaign_id, 
        p_referral_link_id, 
        v_invite_code, 
        v_invite_url, 
        v_guild_id
    );
    
    RETURN QUERY SELECT v_invite_code, v_invite_url;
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 2: API Endpoints Development

### 2.1 Available Campaigns API

**File: `app/api/campaigns/available/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const influencerId = searchParams.get('influencer_id')
    
    if (!influencerId) {
      return NextResponse.json(
        { error: 'influencer_id parameter required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc(
      'get_available_campaigns_for_influencer',
      { p_influencer_id: influencerId }
    )

    if (error) {
      console.error('Error fetching available campaigns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaigns: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 2.2 Enhanced Campaign-Specific Referral Link Creation

**File: `app/api/campaigns/[id]/referral-links/route.ts`** *(enhance existing)*

```typescript
// Add to existing file after campaign validation:

// Generate referral code and URL
const referralCode = generateReferralCode(title)
const referralUrl = generateReferralUrl(referralCode)

// Create referral link with Discord integration
const { data: referralLink, error: linkError } = await supabase
  .from('referral_links')
  .insert({
    influencer_id,
    campaign_id: campaignId,
    title,
    description,
    platform,
    original_url: `${process.env.NEXT_PUBLIC_APP_URL}/r/${referralCode}`, // Landing page URL
    referral_code: referralCode,
    referral_url: referralUrl,
    discord_guild_id: campaign.guild_id,
    redirect_to_discord: true,
    landing_page_enabled: true,
    is_active: true
  })
  .select()
  .single()

// Create Discord invite
const { data: inviteData, error: inviteError } = await supabase.rpc(
  'create_campaign_discord_invite',
  { 
    p_campaign_id: campaignId,
    p_referral_link_id: referralLink.id 
  }
)

if (inviteData && inviteData.length > 0) {
  // Update referral link with Discord invite URL
  await supabase
    .from('referral_links')
    .update({ discord_invite_url: inviteData[0].invite_url })
    .eq('id', referralLink.id)
}
```

### 2.3 Referral Landing Page API

**File: `app/api/referral/[code]/campaign/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Get referral link with campaign details
    const { data, error } = await supabase
      .from('referral_links')
      .select(`
        id,
        title,
        description,
        platform,
        discord_invite_url,
        landing_page_enabled,
        is_active,
        expires_at,
        campaign_id,
        discord_guild_campaigns (
          id,
          campaign_name,
          campaign_type,
          guild_id,
          welcome_message,
          brand_color,
          brand_logo_url,
          metadata,
          clients (
            name,
            industry,
            logo
          )
        ),
        user_profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('referral_code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Referral link not found' },
        { status: 404 }
      )
    }

    // Check if link has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Referral link has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      referral_link: data,
      campaign: data.discord_guild_campaigns,
      influencer: data.user_profiles
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Phase 3: Frontend Components

### 3.1 Available Campaigns Page

**File: `app/campaigns/available/page.tsx`**

```typescript
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AvailableCampaignsPage } from "@/components/available-campaigns-page"

export default function AvailableCampaigns() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AvailableCampaignsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
```

**File: `components/available-campaigns-page.tsx`**

```typescript
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AvailableCampaign {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  client_name: string
  discord_server_name: string
  campaign_description: string
  total_interactions: number
  referral_conversions: number
  has_access: boolean
}

export function AvailableCampaignsPage() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchAvailableCampaigns()
    }
  }, [profile?.id])

  const fetchAvailableCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns/available?influencer_id=${profile.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = (campaign: AvailableCampaign) => {
    if (campaign.has_access) {
      // Navigate to referral link creation for this campaign
      window.location.href = `/campaigns/${campaign.campaign_id}/create-link`
    }
  }

  if (loading) return <div>Loading campaigns...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Available Campaigns</h1>
        <p className="text-muted-foreground">
          Create referral links for campaigns you have access to
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.campaign_id}>
            <CardHeader>
              <CardTitle>{campaign.campaign_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{campaign.client_name}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Badge>{campaign.campaign_type.replace('_', ' ')}</Badge>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium">{campaign.total_interactions}</p>
                    <p className="text-muted-foreground">Interactions</p>
                  </div>
                  <div>
                    <p className="font-medium">{campaign.referral_conversions}</p>
                    <p className="text-muted-foreground">Conversions</p>
                  </div>
                </div>

                <Button 
                  onClick={() => handleCreateLink(campaign)}
                  disabled={!campaign.has_access}
                  className="w-full"
                >
                  {campaign.has_access ? 'Create Referral Link' : 'Request Access'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### 3.2 Campaign Referral Landing Page

**File: `app/r/[code]/page.tsx`**

```typescript
import { CampaignReferralLandingPage } from "@/components/campaign-referral-landing-page"

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function ReferralLandingPage({ params }: PageProps) {
  const { code } = await params
  return <CampaignReferralLandingPage referralCode={code} />
}
```

**File: `components/campaign-referral-landing-page.tsx`**

```typescript
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users } from "lucide-react"

interface CampaignData {
  referral_link: {
    title: string
    description: string
    discord_invite_url: string
  }
  campaign: {
    campaign_name: string
    campaign_type: string
    welcome_message: string
    brand_color: string
    brand_logo_url: string
    clients: {
      name: string
      logo: string
    }
  }
  influencer: {
    full_name: string
    avatar_url: string
  }
}

interface Props {
  referralCode: string
}

export function CampaignReferralLandingPage({ referralCode }: Props) {
  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaignData()
  }, [referralCode])

  const fetchCampaignData = async () => {
    try {
      const response = await fetch(`/api/referral/${referralCode}/campaign`)
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
      } else {
        setError(result.error || 'Failed to load campaign')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinDiscord = () => {
    if (data?.referral_link.discord_invite_url) {
      window.open(data.referral_link.discord_invite_url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { referral_link, campaign, influencer } = data

  return (
    <div 
      className="min-h-screen py-12 px-4"
      style={{ 
        background: `linear-gradient(135deg, ${campaign.brand_color}20, ${campaign.brand_color}10)` 
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          {campaign.brand_logo_url && (
            <img 
              src={campaign.brand_logo_url} 
              alt={campaign.clients.name}
              className="h-16 mx-auto"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{campaign.campaign_name}</h1>
            <p className="text-lg text-muted-foreground">by {campaign.clients.name}</p>
          </div>
        </div>

        {/* Main Campaign Card */}
        <Card>
          <CardHeader>
            <CardTitle>{referral_link.title}</CardTitle>
            {referral_link.description && (
              <p className="text-muted-foreground">{referral_link.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Welcome Message */}
            {campaign.welcome_message && (
              <div className="p-4 rounded-lg bg-muted">
                <p>{campaign.welcome_message}</p>
              </div>
            )}

            {/* Influencer Attribution */}
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {influencer.avatar_url && (
                <img 
                  src={influencer.avatar_url}
                  alt={influencer.full_name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">Recommended by</p>
                <p className="text-sm text-muted-foreground">{influencer.full_name}</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Ready to join?</h3>
                <p className="text-muted-foreground">
                  Click below to join the Discord community!
                </p>
              </div>

              <Button 
                onClick={handleJoinDiscord}
                className="w-full h-12 text-lg"
                style={{ backgroundColor: campaign.brand_color }}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Discord Server
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Community</p>
                <p className="text-sm text-muted-foreground">Join like-minded people</p>
              </div>
              <div className="text-center">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Exclusive Access</p>
                <p className="text-sm text-muted-foreground">Special perks & content</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## Phase 4: Discord Bot Integration Updates

### 4.1 Enhanced Referral Validation API

**File: `app/api/referral/[code]/validate/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { guild_id } = await request.json()

    // Find and validate referral link
    const { data, error } = await supabase
      .from('referral_links')
      .select(`
        id,
        title,
        influencer_id,
        campaign_id,
        discord_guild_id,
        is_active,
        expires_at,
        discord_guild_campaigns (
          id,
          campaign_name,
          campaign_type,
          guild_id,
          welcome_message,
          auto_role_assignment,
          target_role_id,
          user_profiles (
            full_name
          )
        )
      `)
      .eq('referral_code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid referral code' })
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Referral code has expired' })
    }

    // Check guild match
    if (data.discord_guild_campaigns?.guild_id !== guild_id) {
      return NextResponse.json({ valid: false, error: 'Invalid for this server' })
    }

    return NextResponse.json({
      valid: true,
      referral_link: data,
      campaign: data.discord_guild_campaigns,
      influencer: data.discord_guild_campaigns?.user_profiles
    })

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json({ valid: false, error: 'Validation failed' })
  }
}
```

### 4.2 Discord Bot Updates

**File: `virion-labs-discord-bot/enhanced-index.js`** *(additions to existing code)*

```javascript
// Enhanced referral code validation
async function validateReferralCode(code, guildId) {
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/api/referral/${code}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({ guild_id: guildId })
    });

    if (response.ok) {
      return await response.json();
    }
    return { valid: false };
  } catch (error) {
    console.error('Error validating referral code:', error);
    return { valid: false };
  }
}

// Enhanced referral onboarding
async function handleReferralOnboarding(message, config) {
  const referralCode = extractReferralCode(message.content);
  
  if (referralCode) {
    // Validate the referral code
    const validation = await validateReferralCode(referralCode, message.guild.id);
    
    if (validation.valid) {
      const embed = createCampaignEmbed(
        config,
        '🎉 Welcome to the Community!',
        `Thanks for joining through ${validation.influencer.full_name}'s referral link!\n\nYou're now part of our exclusive community. Here's what you can do next:\n\n• Explore our products and services\n• Connect with other community members\n• Get exclusive updates and offers`,
        '#00ff00'
      );

      await message.reply({ embeds: [embed] });
      
      // Assign role if configured
      if (validation.campaign.auto_role_assignment && validation.campaign.target_role_id) {
        const role = message.guild.roles.cache.get(validation.campaign.target_role_id);
        if (role && message.member) {
          try {
            await message.member.roles.add(role);
            console.log(`✅ Assigned role ${role.name} to ${message.author.tag}`);
          } catch (error) {
            console.error('Error assigning role:', error);
          }
        }
      }
      
      // Track successful referral signup
      await trackInteraction(
        message.guild?.id,
        message.channel.id,
        message,
        'referral_signup',
        'Referral onboarding completed',
        referralCode
      );
      
      return true;
    } else {
      // Invalid referral code
      const embed = createCampaignEmbed(
        config,
        '❌ Invalid Referral Code',
        `The referral code "${referralCode}" is not valid for this server. Please check your code and try again.`,
        '#ff0000'
      );

      await message.reply({ embeds: [embed] });
      return true;
    }
  }
  
  return false;
}
```

---

## Phase 5: Testing & Deployment

### 5.1 Database Migration Script

```sql
-- Step 1: Add new columns to referral_links
ALTER TABLE referral_links 
ADD COLUMN IF NOT EXISTS discord_invite_url TEXT,
ADD COLUMN IF NOT EXISTS discord_guild_id TEXT,
ADD COLUMN IF NOT EXISTS redirect_to_discord BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS landing_page_enabled BOOLEAN DEFAULT true;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_links_discord_guild ON referral_links(discord_guild_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_campaign_active ON referral_links(campaign_id, is_active);

-- Step 3: Create discord_invite_links table
CREATE TABLE IF NOT EXISTS discord_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES discord_guild_campaigns(id),
    referral_link_id UUID REFERENCES referral_links(id),
    discord_invite_code TEXT NOT NULL,
    discord_invite_url TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    channel_id TEXT,
    max_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    uses_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 4: Create indexes for new table
CREATE INDEX IF NOT EXISTS idx_discord_invites_campaign ON discord_invite_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_discord_invites_referral ON discord_invite_links(referral_link_id);

-- Step 5: Update existing referral links to populate discord_guild_id
UPDATE referral_links 
SET discord_guild_id = dgc.guild_id,
    redirect_to_discord = true,
    landing_page_enabled = true
FROM discord_guild_campaigns dgc 
WHERE referral_links.campaign_id = dgc.id 
AND referral_links.discord_guild_id IS NULL;
```

### 5.2 Environment Variables

```env
# Add to .env.local
NEXT_PUBLIC_APP_URL=https://your-domain.com
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_discord_app_id
```

### 5.3 Testing Checklist

- [ ] Database migration runs successfully
- [ ] Available campaigns API returns correct data
- [ ] Influencers can create campaign-specific referral links
- [ ] Landing pages load correctly with campaign branding
- [ ] Discord invites are generated and stored
- [ ] Discord bot receives referral context
- [ ] Campaign-specific onboarding works
- [ ] Analytics tracking functions properly

---

## Implementation Summary

This implementation provides:

1. **Admin Control**: Admins assign Discord servers to campaigns during creation
2. **Influencer Access**: Influencers browse available campaigns and create referral links
3. **Landing Pages**: Beautiful branded pages showing campaign info before Discord join
4. **Discord Integration**: Seamless onboarding with campaign-specific bot behavior
5. **Full Tracking**: Complete analytics from referral click to Discord conversion

The system maintains the existing database structure while adding the missing Discord integration components for a complete campaign-based referral experience. 