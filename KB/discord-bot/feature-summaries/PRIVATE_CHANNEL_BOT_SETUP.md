# Private Channel Referral Bot Setup Guide

## 🎯 Overview

This guide explains how to set up a Discord bot campaign that operates exclusively in private channels, ensuring only users who come through referral links can access and interact with the bot.

## 🏗 Architecture

```
Referral Link → Discord Invite → Role Assignment → Private Channel Access → Bot Interaction
```

### Benefits:
- ✅ **Pure referral attribution** - No confusion with organic users
- ✅ **Controlled access** - Only referral users can interact
- ✅ **Clean analytics** - All interactions are from verified referrals
- ✅ **Influencer confidence** - Clear tracking of their conversions

## 📋 Setup Steps

### 1. Create Private Channel in Discord

1. **Create a new text channel** in your Discord server
2. **Set permissions** to deny `@everyone` access
3. **Create a special role** (e.g., `nike-zoom-member`) 
4. **Give the role** permission to view and send messages in the private channel
5. **Copy the channel ID** (Right-click channel → Copy ID)

### 2. Configure Campaign for Private Channel Access

```sql
-- Update your campaign for private channel operation
UPDATE discord_guild_campaigns 
SET 
    private_channel_id = '1234567890123456789', -- Your private channel ID
    access_control_enabled = true,
    referral_only_access = true,
    auto_role_on_join = 'nike-zoom-member', -- Role name that grants access
    onboarding_channel_type = 'private'
WHERE campaign_name = 'Nike Zoom';
```

### 3. Update Referral Links

```sql
-- Configure referral links for private channel access
UPDATE referral_links 
SET 
    private_channel_id = '1234567890123456789',
    access_role_id = 'role_id_here', -- Discord role ID that grants access
    custom_invite_code = 'your_custom_invite' -- Optional: specific invite for this referral
WHERE campaign_id = 'your_campaign_id';
```

### 4. Discord Bot Integration

The bot needs to handle the private channel workflow:

```javascript
// Enhanced bot logic for private channel campaigns
client.on('guildMemberAdd', async (member) => {
  // Check if they joined via a referral link invite
  const referralContext = await detectReferralInvite(member);
  
  if (referralContext) {
    // Grant access to private channel via role assignment
    await grantPrivateChannelAccess(member, referralContext);
  }
});

async function grantPrivateChannelAccess(member, referralContext) {
  try {
    // 1. Assign the role that grants channel access
    const role = member.guild.roles.cache.find(r => r.name === referralContext.access_role);
    if (role) {
      await member.roles.add(role);
      console.log(`✅ Granted ${member.user.tag} access to private channel`);
    }
    
    // 2. Record the access grant in database
    await fetch(`${DASHBOARD_API_URL}/discord-bot/referral-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referral_code: referralContext.referral_code,
        discord_user_id: member.user.id,
        discord_username: member.user.tag,
        guild_id: member.guild.id,
        invite_code: referralContext.invite_code
      })
    });
    
    // 3. Send welcome message with private channel instructions
    const embed = new EmbedBuilder()
      .setTitle('🎉 Welcome to Nike Zoom Campaign!')
      .setDescription(`Thanks for joining via ${referralContext.influencer_name}'s referral link!\n\n✨ You now have access to the exclusive <#${referralContext.private_channel_id}> channel.\n\n🤖 Head there to start your onboarding with our bot!`)
      .setColor('#00ff00');
      
    await member.send({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error granting private channel access:', error);
  }
}
```

### 5. Bot Channel Restriction Logic

```javascript
// Only respond in authorized channels
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const config = await getBotConfig(message.guild.id, message.channel.id, message.author.id);
  
  if (!config.configured) {
    if (config.access_denied) {
      // User tried to use bot outside authorized channel
      const embed = new EmbedBuilder()
        .setTitle('🔒 Access Restricted')
        .setDescription(config.message)
        .setColor('#ff0000');
        
      if (config.private_channel_id) {
        embed.addFields([{
          name: '📍 Authorized Channel',
          value: `Please use <#${config.private_channel_id}> instead`,
          inline: false
        }]);
      }
      
      await message.reply({ embeds: [embed] });
      return;
    }
    return; // No config found
  }
  
  // Proceed with normal bot logic
  await handleMessage(message, config);
});
```

## 🔧 Implementation Examples

### Example Campaign Setup

```javascript
// Create a private channel campaign
const campaignData = {
  client_id: "nike-client-uuid",
  guild_id: "905448362944393218",
  campaign_name: "Nike Zoom Exclusive",
  campaign_type: "referral_onboarding",
  private_channel_id: "1234567890123456789",
  access_control_enabled: true,
  referral_only_access: true,
  auto_role_on_join: "nike-zoom-member",
  onboarding_channel_type: "private",
  welcome_message: "Welcome to the exclusive Nike Zoom campaign!",
  onboarding_flow: {
    welcome_message: "Thanks for joining via referral! Let's get you set up...",
    completion_message: "You're all set! Enjoy exclusive Nike Zoom perks."
  }
};
```

### Example Referral Link Generation

```javascript
// Generate referral link for private channel campaign
const referralLink = {
  influencer_id: "influencer-uuid",
  campaign_id: "nike-zoom-campaign-uuid",
  title: "Nike Zoom Exclusive Access",
  platform: "YouTube",
  private_channel_id: "1234567890123456789",
  access_role_id: "987654321098765432", // Discord role ID
  custom_invite_code: "nikezoom2024", // Custom Discord invite
  referral_url: "https://yourdomain.com/r/nike-zoom-exclusive"
};
```

## 📊 Analytics & Tracking

### Access Tracking

All private channel access is tracked in the `discord_referral_channel_access` table:

```sql
-- View who has access to private campaigns
SELECT 
  drca.discord_username,
  dgc.campaign_name,
  drca.private_channel_id,
  drca.access_granted_at,
  drca.onboarding_completed,
  rl.referral_code,
  ui.full_name as influencer_name
FROM discord_referral_channel_access drca
JOIN discord_guild_campaigns dgc ON drca.campaign_id = dgc.id
JOIN referral_links rl ON drca.referral_link_id = rl.id
JOIN user_profiles ui ON rl.influencer_id = ui.id
WHERE dgc.referral_only_access = true
ORDER BY drca.access_granted_at DESC;
```

### Conversion Metrics

```sql
-- Private channel campaign performance
SELECT 
  dgc.campaign_name,
  COUNT(drca.id) as total_access_granted,
  COUNT(CASE WHEN drca.onboarding_completed THEN 1 END) as completed_onboarding,
  COUNT(DISTINCT rl.influencer_id) as active_influencers,
  ROUND(
    COUNT(CASE WHEN drca.onboarding_completed THEN 1 END)::DECIMAL / 
    COUNT(drca.id) * 100, 2
  ) as completion_rate
FROM discord_guild_campaigns dgc
LEFT JOIN discord_referral_channel_access drca ON dgc.id = drca.campaign_id
LEFT JOIN referral_links rl ON drca.referral_link_id = rl.id
WHERE dgc.referral_only_access = true
GROUP BY dgc.id, dgc.campaign_name;
```

## 🛡 Security Considerations

### Access Control
- ✅ Role-based channel permissions
- ✅ Database-tracked access grants
- ✅ Referral code validation
- ✅ Invite link verification

### Prevent Unauthorized Access
```javascript
// Check user permissions before bot interaction
async function validateChannelAccess(userId, channelId, campaignId) {
  const { data: access } = await supabase
    .from('discord_referral_channel_access')
    .select('id')
    .eq('discord_user_id', userId)
    .eq('private_channel_id', channelId)
    .eq('campaign_id', campaignId)
    .eq('is_active', true)
    .single();
    
  return !!access;
}
```

## 🚀 Testing the Setup

### 1. Test Referral Link Flow
1. Create a test referral link
2. Use the link to join Discord
3. Verify role assignment
4. Check private channel access
5. Test bot interaction in private channel

### 2. Test Access Restrictions
1. Try to use bot in public channels (should be denied)
2. Try with non-referral users (should be denied)
3. Verify analytics tracking

### 3. Monitor Logs
```javascript
// Add comprehensive logging
console.log(`🔍 Channel Access Check: User ${userId} in Channel ${channelId}`);
console.log(`✅ Access Granted: Campaign ${campaignId} via Referral ${referralCode}`);
console.log(`❌ Access Denied: User ${userId} lacks permissions for Campaign ${campaignId}`);
```

## 📈 Best Practices

1. **Clear Communication**: Tell influencers their links lead to private channels
2. **Welcome Messages**: Explain the exclusive nature of the private channel
3. **Role Management**: Regularly audit role assignments
4. **Analytics Review**: Monitor completion rates and adjust accordingly
5. **Backup Plans**: Have fallback channels if technical issues arise

## 🔧 Troubleshooting

### Common Issues

**Users can't see private channel:**
- Check role assignment
- Verify channel permissions
- Confirm Discord role hierarchy

**Bot doesn't respond in private channel:**
- Verify bot has permissions in private channel
- Check access control logic
- Review database access records

**Analytics not tracking:**
- Confirm API endpoints are working
- Check database connection
- Verify referral code validation

This setup ensures a clean, controlled environment where only verified referral users can interact with your bot, providing accurate attribution and analytics for your influencer campaigns. 