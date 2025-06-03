import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { botDeploymentManager } from '@/lib/bot-deployment'

// Discord API endpoints
const DISCORD_API_BASE = 'https://discord.com/api/v10'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      client_id,
      template,
      prefix = '!',
      description,
      auto_deploy = false,
      avatar_url,
      webhook_url,
      discord_application_id,
      discord_bot_token
    } = body

    // Validate required fields
    if (!name || !client_id || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, client_id, template' },
        { status: 400 }
      )
    }

    // For now, we'll require manual Discord application details
    if (!discord_application_id || !discord_bot_token) {
      return NextResponse.json(
        { error: 'Missing Discord application details. Please provide discord_application_id and discord_bot_token' },
        { status: 400 }
      )
    }

    // Validate client exists using Supabase client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', client_id)
      .eq('status', 'Active')
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Invalid or inactive client' },
        { status: 400 }
      )
    }

    // Validate the Discord bot token by testing it
    const isValidToken = await validateDiscordBotToken(discord_bot_token, discord_application_id)
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid Discord bot token or application ID' },
        { status: 400 }
      )
    }

    // Generate bot code based on template
    const botCode = generateBotCode(template, {
      name,
      prefix,
      discord_application_id,
      client_name: clientData.name
    })

    // Store bot information in database first
    const { data: botData, error: dbError } = await supabase
      .from('bots')
      .insert({
        name,
        client_id,
        discord_bot_id: discord_application_id,
        discord_token: discord_bot_token,
        template,
        prefix,
        description,
        auto_deploy,
        status: 'Offline', // Bots start offline until deployed
        invite_url: `https://discord.com/api/oauth2/authorize?client_id=${discord_application_id}&permissions=8&scope=bot`,
        avatar_url,
        webhook_url
      })
      .select()
      .single()

    if (dbError || !botData) {
      return NextResponse.json(
        { error: 'Failed to save bot to database: ' + (dbError?.message || 'Unknown error') },
        { status: 500 }
      )
    }

    let deploymentResult = null

    // Deploy the bot if auto_deploy is enabled
    if (auto_deploy) {
      try {
        deploymentResult = await botDeploymentManager.deployBot({
          applicationId: discord_application_id,
          name,
          code: botCode,
          token: discord_bot_token,
          auto_deploy,
          environment: {
            BOT_ID: botData.id,
            CLIENT_ID: client_id,
            WEBHOOK_URL: webhook_url || ''
          }
        })

        if (deploymentResult.success) {
          // Update bot with deployment information
          const { error: updateError } = await supabase
            .from('bots')
            .update({
              deployment_id: deploymentResult.deploymentId,
              server_endpoint: deploymentResult.endpoint,
              status: 'Online',
              updated_at: new Date().toISOString()
            })
            .eq('id', botData.id)

          if (updateError) {
            console.warn('Failed to update bot with deployment info:', updateError)
          }
        } else {
          console.error('Bot deployment failed:', deploymentResult.error)
        }
      } catch (error) {
        console.error('Deployment error:', error)
        deploymentResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown deployment error'
        }
      }
    }

    // Update client bot count
    const { data: currentClient } = await supabase
      .from('clients')
      .select('bots')
      .eq('id', client_id)
      .single()

    const { error: updateError } = await supabase
      .from('clients')
      .update({ 
        bots: (currentClient?.bots || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', client_id)

    if (updateError) {
      console.warn('Failed to update client bot count:', updateError)
    }

    const response: any = {
      success: true,
      bot: botData,
      discord_app: {
        id: discord_application_id,
        name: name,
        invite_url: `https://discord.com/api/oauth2/authorize?client_id=${discord_application_id}&permissions=8&scope=bot`
      }
    }

    // Include deployment information if deployment was attempted
    if (deploymentResult) {
      response.deployment = {
        success: deploymentResult.success,
        ...(deploymentResult.success ? {
          id: deploymentResult.deploymentId,
          endpoint: deploymentResult.endpoint,
          status: deploymentResult.status
        } : {
          error: deploymentResult.error
        })
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error creating Discord bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function validateDiscordBotToken(token: string, applicationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/applications/@me`, {
      headers: {
        'Authorization': `Bot ${token}`
      }
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.id === applicationId
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

function generateBotCode(template: string, config: {
  name: string
  prefix: string
  discord_application_id: string
  client_name: string
}): string {
  const baseCode = `
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log('✅ ${config.name} is ready!');
  console.log(\`Logged in as \${client.user.tag}!\`);
});

client.on('error', console.error);
`

  switch (template) {
    case 'standard':
      return baseCode + `
// Standard referral bot commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const args = message.content.slice('${config.prefix}'.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  
  if (!message.content.startsWith('${config.prefix}')) return;
  
  switch (command) {
    case 'refer':
      const embed = new EmbedBuilder()
        .setTitle('🔗 Referral Program')
        .setDescription('Join our referral program and earn rewards!')
        .setColor(0x00AE86)
        .addFields(
          { name: 'How it works', value: '1. Share your unique link\\n2. Friends sign up\\n3. Earn rewards!' },
          { name: 'Your referral link', value: \`https://example.com/ref/\${message.author.id}\` }
        )
        .setFooter({ text: 'Powered by ${config.client_name}' });
      
      await message.reply({ embeds: [embed] });
      break;
      
    case 'stats':
      const statsEmbed = new EmbedBuilder()
        .setTitle('📊 Your Referral Stats')
        .setDescription('Here are your current referral statistics')
        .setColor(0x3498DB)
        .addFields(
          { name: 'Total Referrals', value: '0', inline: true },
          { name: 'Active Referrals', value: '0', inline: true },
          { name: 'Rewards Earned', value: '0 points', inline: true }
        )
        .setFooter({ text: 'Stats update in real-time' });
      
      await message.reply({ embeds: [statsEmbed] });
      break;
      
    case 'leaderboard':
      const leaderboardEmbed = new EmbedBuilder()
        .setTitle('🏆 Referral Leaderboard')
        .setDescription('Top referrers this month')
        .setColor(0xF39C12)
        .addFields(
          { name: '🥇 1st Place', value: 'User#1234 - 15 referrals' },
          { name: '🥈 2nd Place', value: 'User#5678 - 12 referrals' },
          { name: '🥉 3rd Place', value: 'User#9012 - 8 referrals' }
        )
        .setFooter({ text: 'Keep referring to climb the ranks!' });
      
      await message.reply({ embeds: [leaderboardEmbed] });
      break;
      
    default:
      await message.reply('❓ Unknown command. Available commands: \`${config.prefix}refer\`, \`${config.prefix}stats\`, \`${config.prefix}leaderboard\`');
  }
});

client.login(process.env.DISCORD_TOKEN);
`;

    case 'advanced':
      return baseCode + `
// Advanced referral bot with platform-specific features
const platforms = {
  twitter: '🐦 Twitter',
  instagram: '📸 Instagram',
  youtube: '▶️ YouTube',
  tiktok: '🎵 TikTok'
};

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const args = message.content.slice('${config.prefix}'.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  
  if (!message.content.startsWith('${config.prefix}')) return;
  
  switch (command) {
    case 'refer':
      const platform = args[0]?.toLowerCase();
      
      if (!platform || !platforms[platform]) {
        const embed = new EmbedBuilder()
          .setTitle('🔗 Platform-Specific Referral Links')
          .setDescription('Choose your platform to get a customized referral link')
          .setColor(0x00AE86)
          .addFields(
            Object.entries(platforms).map(([key, name]) => ({
              name: name,
              value: \`\`\`${config.prefix}refer \${key}\`\`\`,
              inline: true
            }))
          )
          .setFooter({ text: 'Powered by ${config.client_name}' });
        
        await message.reply({ embeds: [embed] });
        return;
      }
      
      const referralEmbed = new EmbedBuilder()
        .setTitle(\`\${platforms[platform]} Referral Link\`)
        .setDescription('Share this link to earn rewards from your referrals!')
        .setColor(0x00AE86)
        .addFields(
          { name: 'Your Link', value: \`https://example.com/ref/\${platform}/\${message.author.id}\` },
          { name: 'Bonus for this platform', value: '+50% rewards for the first week!' }
        )
        .setFooter({ text: 'Link expires in 30 days' });
      
      await message.reply({ embeds: [referralEmbed] });
      break;
      
    case 'analytics':
      const analyticsEmbed = new EmbedBuilder()
        .setTitle('📈 Detailed Analytics')
        .setDescription('Your referral performance breakdown')
        .setColor(0x9B59B6)
        .addFields(
          { name: 'This Week', value: '3 new referrals\\n+15 points', inline: true },
          { name: 'This Month', value: '12 total referrals\\n+60 points', inline: true },
          { name: 'All Time', value: '45 total referrals\\n+225 points', inline: true },
          { name: 'Top Platform', value: '🐦 Twitter (60%)', inline: true },
          { name: 'Conversion Rate', value: '12.5%', inline: true },
          { name: 'Next Reward', value: '5 more for bonus!', inline: true }
        )
        .setFooter({ text: 'Data updated every hour' });
      
      await message.reply({ embeds: [analyticsEmbed] });
      break;
      
    case 'rewards':
      const rewardsEmbed = new EmbedBuilder()
        .setTitle('🎁 Available Rewards')
        .setDescription('Redeem your points for awesome rewards!')
        .setColor(0xE74C3C)
        .addFields(
          { name: '💰 $10 Gift Card', value: '100 points', inline: true },
          { name: '💎 Premium Badge', value: '50 points', inline: true },
          { name: '🚀 VIP Access', value: '200 points', inline: true }
        )
        .addFields({ name: 'Your Balance', value: '75 points available' })
        .setFooter({ text: 'Use ${config.prefix}redeem <reward> to claim' });
      
      await message.reply({ embeds: [rewardsEmbed] });
      break;
      
    default:
      const helpEmbed = new EmbedBuilder()
        .setTitle('📚 Bot Commands')
        .setDescription('Available commands for ${config.name}')
        .setColor(0x34495E)
        .addFields(
          { name: \`\${config.prefix}refer [platform]\`, value: 'Get your referral link' },
          { name: \`\${config.prefix}analytics\`, value: 'View detailed statistics' },
          { name: \`\${config.prefix}rewards\`, value: 'See available rewards' }
        );
      
      await message.reply({ embeds: [helpEmbed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
`;

    case 'custom':
      return baseCode + `
// Custom bot template - customize as needed
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content.startsWith('${config.prefix}hello')) {
    await message.reply('👋 Hello! I\\'m ${config.name}, here to help with your referrals!');
  }
  
  if (message.content.startsWith('${config.prefix}help')) {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🤖 ${config.name}')
      .setDescription('A custom Discord bot for ${config.client_name}')
      .setColor(0x7289DA)
      .addFields(
        { name: 'Customize me!', value: 'This is a basic template. Add your own commands and features.' }
      )
      .setFooter({ text: 'Built with Virion Labs' });
    
    await message.reply({ embeds: [helpEmbed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
`;

    default:
      return baseCode + `
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content === '${config.prefix}ping') {
    await message.reply('🏓 Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);
`;
  }
} 