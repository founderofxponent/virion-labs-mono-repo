# Implementation Guide: Campaign-First Discord Integration

## 🚀 **Quick Start**

### **1. Frontend: Using the React Hook**

```typescript
import { useDiscordCampaigns } from '@/hooks/use-discord-campaigns'

function CampaignManager() {
  const {
    campaigns,
    templates,
    loading,
    createCampaign,
    createCampaignFromTemplate,
    updateCampaign,
    pauseCampaign,
    resumeCampaign,
    getCampaignStats
  } = useDiscordCampaigns()

  // Create a campaign from template
  const handleCreateCampaign = async () => {
    const result = await createCampaignFromTemplate('referral-template-id', {
      client_id: 'client-uuid',
      guild_id: '1234567890123456789',
      campaign_name: 'Welcome New Gamers',
      referral_link_id: 'referral-uuid'
    })
    
    if (result.error) {
      console.error('Failed to create campaign:', result.error)
    } else {
      console.log('Campaign created:', result.data)
    }
  }

  // Get campaign analytics
  const stats = getCampaignStats()
  console.log(`Total campaigns: ${stats.totalCampaigns}`)
  console.log(`Conversion rate: ${stats.conversionRate.toFixed(2)}%`)

  return (
    <div>
      {campaigns.map(campaign => (
        <CampaignCard 
          key={campaign.id} 
          campaign={campaign}
          onPause={() => pauseCampaign(campaign.id)}
          onResume={() => resumeCampaign(campaign.id)}
        />
      ))}
    </div>
  )
}
```

### **2. Backend: API Usage**

#### **Create Campaign with Template**
```typescript
// POST /api/discord-campaigns
const response = await fetch('/api/discord-campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'client-uuid',
    guild_id: '1234567890123456789',
    campaign_name: 'Gaming Community Welcome',
    campaign_type: 'referral_onboarding',
    template_id: 'referral-onboarding-template', // Auto-fills bot config
    referral_link_id: 'referral-uuid',
    // Custom overrides
    bot_name: 'Custom Gaming Bot',
    brand_color: '#ff6b35'
  })
})
```

#### **Update Campaign**
```typescript
// PUT /api/discord-campaigns/{id}
const response = await fetch(`/api/discord-campaigns/${campaignId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    welcome_message: 'Updated welcome message!',
    auto_responses: {
      'hello': 'Hey there, gamer! 🎮'
    },
    is_active: false // Pause campaign
  })
})
```

#### **Get Campaign Configuration for Bot**
```typescript
// GET /api/discord-bot/config?guild_id=123&channel_id=456
const response = await fetch('/api/discord-bot/config?guild_id=1234567890123456789')
const config = await response.json()

if (config.configured) {
  const campaign = config.campaign
  console.log(`Bot name: ${campaign.bot_config.bot_name}`)
  console.log(`Brand color: ${campaign.bot_config.brand_color}`)
  console.log(`Auto responses:`, campaign.bot_config.auto_responses)
}
```

### **3. Discord Bot: Enhanced Integration**

```javascript
// enhanced-index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js')

class EnhancedDiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    })
    
    this.configCache = new Map() // Cache campaign configs
    this.setupEventHandlers()
  }

  async getCampaignConfig(guildId, channelId = null) {
    const cacheKey = `${guildId}-${channelId || 'default'}`
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey)
    }

    try {
      const params = new URLSearchParams({ guild_id: guildId })
      if (channelId) params.set('channel_id', channelId)
      
      const response = await fetch(`${process.env.DASHBOARD_API_URL}/api/discord-bot/config?${params}`)
      const config = await response.json()
      
      // Cache for 5 minutes
      this.configCache.set(cacheKey, config)
      setTimeout(() => this.configCache.delete(cacheKey), 5 * 60 * 1000)
      
      return config
    } catch (error) {
      console.error('Failed to fetch campaign config:', error)
      return { configured: false }
    }
  }

  async handleMessage(message) {
    if (message.author.bot) return

    const config = await this.getCampaignConfig(message.guild.id, message.channel.id)
    
    if (!config.configured) {
      console.log(`No campaign configured for guild ${message.guild.id}`)
      return
    }

    const campaign = config.campaign
    const botConfig = campaign.bot_config

    // Handle referral codes
    if (campaign.referral_tracking_enabled) {
      const referralMatch = message.content.match(/\b([A-Z0-9]{6,12})\b/)
      if (referralMatch) {
        await this.handleReferralCode(message, campaign, referralMatch[1])
        return
      }
    }

    // Handle auto responses
    const messageContent = message.content.toLowerCase()
    for (const [trigger, response] of Object.entries(botConfig.auto_responses)) {
      if (messageContent.includes(trigger)) {
        await this.sendCampaignResponse(message, campaign, response)
        await this.trackInteraction(campaign.id, 'auto_response', { trigger })
        return
      }
    }

    // Handle custom commands
    for (const command of botConfig.custom_commands) {
      if (message.content.startsWith(command.command)) {
        await this.sendCampaignResponse(message, campaign, command.response)
        await this.trackInteraction(campaign.id, 'custom_command', { command: command.command })
        return
      }
    }

    // Forward to AI webhook if configured
    if (campaign.webhook_url) {
      await this.forwardToAI(message, campaign)
    }
  }

  async handleReferralCode(message, campaign, code) {
    // Validate referral code
    if (campaign.referral && campaign.referral.code === code) {
      // Success response
      const response = campaign.bot_config.auto_responses.referral_success
        .replace('{influencer_name}', campaign.referral.influencer.name)
      
      await this.sendCampaignResponse(message, campaign, response)
      
      // Assign role if configured
      if (campaign.auto_role_assignment && campaign.target_role_id) {
        const role = message.guild.roles.cache.get(campaign.target_role_id)
        if (role) {
          await message.member.roles.add(role)
        }
      }
      
      // Track successful conversion
      await this.trackInteraction(campaign.id, 'referral_conversion', {
        referral_code: code,
        user_id: message.author.id,
        influencer_id: campaign.referral.influencer.id
      })
    } else {
      // Invalid code response
      const response = campaign.bot_config.auto_responses.referral_invalid
      await this.sendCampaignResponse(message, campaign, response)
      
      await this.trackInteraction(campaign.id, 'referral_invalid', { attempted_code: code })
    }
  }

  async sendCampaignResponse(message, campaign, responseText) {
    const embed = new EmbedBuilder()
      .setDescription(responseText)
      .setColor(campaign.bot_config.brand_color)
      .setFooter({ text: campaign.bot_config.bot_name })
    
    if (campaign.bot_config.brand_logo_url) {
      embed.setThumbnail(campaign.bot_config.brand_logo_url)
    }

    await message.reply({ embeds: [embed] })
  }

  async trackInteraction(campaignId, interactionType, metadata = {}) {
    try {
      await fetch(`${process.env.DASHBOARD_API_URL}/api/discord-bot/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          interaction_type: interactionType,
          metadata
        })
      })
    } catch (error) {
      console.error('Failed to track interaction:', error)
    }
  }

  setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`Enhanced Discord Bot logged in as ${this.client.user.tag}`)
    })

    this.client.on('messageCreate', (message) => {
      this.handleMessage(message)
    })

    this.client.on('guildMemberAdd', async (member) => {
      const config = await this.getCampaignConfig(member.guild.id)
      
      if (config.configured && config.campaign.welcome_message) {
        const welcomeChannel = member.guild.systemChannel
        if (welcomeChannel) {
          await this.sendCampaignResponse(
            { reply: (content) => welcomeChannel.send(content) },
            config.campaign,
            config.campaign.welcome_message
          )
        }
      }
    })
  }

  start() {
    this.client.login(process.env.DISCORD_BOT_TOKEN)
  }
}

// Start the enhanced bot
const bot = new EnhancedDiscordBot()
bot.start()
```

## 📊 **Database Queries**

### **Get Campaign with Full Details**
```sql
SELECT 
  dgc.*,
  c.name as client_name,
  c.industry as client_industry,
  rl.title as referral_title,
  rl.referral_code,
  up.full_name as influencer_name,
  up.email as influencer_email
FROM discord_guild_campaigns dgc
LEFT JOIN clients c ON dgc.client_id = c.id
LEFT JOIN referral_links rl ON dgc.referral_link_id = rl.id
LEFT JOIN user_profiles up ON dgc.influencer_id = up.id
WHERE dgc.guild_id = $1 
  AND dgc.is_active = true
ORDER BY dgc.created_at DESC;
```

### **Track Interaction**
```sql
INSERT INTO discord_referral_interactions (
  campaign_id,
  user_id,
  interaction_type,
  referral_code,
  metadata
) VALUES ($1, $2, $3, $4, $5);

-- Update campaign stats
UPDATE discord_guild_campaigns 
SET 
  total_interactions = total_interactions + 1,
  referral_conversions = CASE 
    WHEN $3 = 'referral_conversion' THEN referral_conversions + 1 
    ELSE referral_conversions 
  END,
  successful_onboardings = CASE 
    WHEN $3 = 'onboarding_complete' THEN successful_onboardings + 1 
    ELSE successful_onboardings 
  END
WHERE id = $1;
```

## 🎨 **Frontend Components**

### **Campaign Card Component**
```typescript
interface CampaignCardProps {
  campaign: DiscordCampaign
  onPause: () => void
  onResume: () => void
  onEdit: () => void
}

function CampaignCard({ campaign, onPause, onResume, onEdit }: CampaignCardProps) {
  const { getCampaignTypeLabel, getCampaignTypeColor, formatDate } = useDiscordCampaigns()

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{campaign.campaign_name}</h3>
        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: getCampaignTypeColor(campaign.campaign_type) + '20',
              color: getCampaignTypeColor(campaign.campaign_type)
            }}
          >
            {getCampaignTypeLabel(campaign.campaign_type)}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {campaign.is_active ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Interactions</p>
          <p className="font-medium">{campaign.total_interactions}</p>
        </div>
        <div>
          <p className="text-gray-500">Conversions</p>
          <p className="font-medium">{campaign.referral_conversions}</p>
        </div>
        <div>
          <p className="text-gray-500">Success Rate</p>
          <p className="font-medium">
            {campaign.total_interactions > 0 
              ? ((campaign.referral_conversions / campaign.total_interactions) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={campaign.is_active ? onPause : onResume}
          className={`px-3 py-1 rounded text-sm ${
            campaign.is_active 
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {campaign.is_active ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
```

## 🔧 **Environment Variables**

### **Discord Bot (.env)**
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DASHBOARD_API_URL=https://your-dashboard.com
```

### **Dashboard (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 **Deployment**

### **1. Deploy Dashboard Changes**
```bash
# Deploy API endpoints and React hook
npm run build
npm run deploy
```

### **2. Update Discord Bot**
```bash
# Deploy enhanced bot with campaign support
cd virion-labs-discord-bot
npm install
# Update index.js with enhanced-index.js content
npm run deploy
```

### **3. Database Migration**
```bash
# Apply database schema changes
# (Already done via Supabase migrations)
```

## 📈 **Monitoring & Analytics**

### **Campaign Performance Dashboard**
```typescript
function CampaignAnalytics() {
  const { campaigns, getCampaignStats } = useDiscordCampaigns()
  const stats = getCampaignStats()

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard 
        title="Total Campaigns" 
        value={stats.totalCampaigns}
        change="+12% from last month"
      />
      <MetricCard 
        title="Active Campaigns" 
        value={stats.activeCampaigns}
        change={`${stats.activeCampaigns}/${stats.totalCampaigns} active`}
      />
      <MetricCard 
        title="Conversion Rate" 
        value={`${stats.conversionRate.toFixed(1)}%`}
        change="+2.3% from last week"
      />
      <MetricCard 
        title="Total Interactions" 
        value={stats.totalInteractions}
        change="+156 this week"
      />
    </div>
  )
}
```

This implementation guide provides everything needed to work with the new campaign-first Discord integration system! 