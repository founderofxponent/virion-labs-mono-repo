import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const API_URL = process.env.BUSINESS_LOGIC_API_URL
const API_KEY = process.env.BUSINESS_LOGIC_API_KEY
const BOT_TOKEN = process.env.DISCORD_CLIENT_BOT_TOKEN

if (!API_URL || !API_KEY || !BOT_TOKEN) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const commands = [
  new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Sync channels and roles to Virion Labs dashboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON()
]

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN)

async function registerCommands() {
  try {
    const app = await client.application?.fetch()
    await rest.put(Routes.applicationCommands(app?.id || client.user.id), { body: commands })
  } catch (e) {
    console.warn('Command registration fallback', e.message)
  }
}

client.on('ready', async () => {
  console.log(`Client bot logged in as ${client.user.tag}`)
  try { await registerCommands() } catch {}
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName !== 'sync') return

  await interaction.deferReply({ ephemeral: true })
  const guild = interaction.guild
  if (!guild) return interaction.editReply('This command must be used in a server.')
  
  // Auto-detect client from guild mapping (created during OAuth callback)
  let clientDocumentId
  try {
    const findClientRes = await fetch(`${API_URL}/api/v1/integrations/discord/client/find-by-guild/${guild.id}`, {
      headers: { 'x-api-key': API_KEY }
    })
    
    if (findClientRes.ok) {
      const clientData = await findClientRes.json()
      clientDocumentId = clientData.client_document_id
    }
  } catch (e) {
    console.warn('Failed to find client for guild:', e.message)
  }
  
  if (!clientDocumentId) {
    return interaction.editReply('❌ This Discord server is not connected to any Virion Labs client. Please install the bot through your dashboard first.\n\nGo to your Virion Labs dashboard → Integrations → Click "Install Bot" to connect this server.')
  }

  await guild.roles.fetch()
  await guild.channels.fetch()

  const roles = guild.roles.cache
    .filter(r => !r.managed)
    .map(r => ({ id: r.id, name: r.name, color: r.color }))

  const channels = guild.channels.cache
    .filter(c => c.isTextBased?.())
    .map(c => ({ id: c.id, name: c.name, type: c.type, topic: c.topic || null }))

  const payload = {
    client_document_id: clientDocumentId,
    guild_id: guild.id,
    guild_name: guild.name,
    guild_icon_url: guild.iconURL() || undefined,
    discord_user_id: interaction.user.id,
    discord_username: interaction.user.username,
    channels,
    roles,
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/integrations/discord/client/bot-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(`Sync failed: ${res.status}`)
    await interaction.editReply('✅ Sync complete! Your server is now connected to the dashboard.')
  } catch (e) {
    console.error(e)
    await interaction.editReply('❌ Failed to sync. Please try again or contact support.')
  }
})

client.login(BOT_TOKEN)
