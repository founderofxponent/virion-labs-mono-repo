import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import fetch from 'node-fetch'

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
    .addStringOption(opt => opt
      .setName('client')
      .setDescription('Client documentId provided by the dashboard')
      .setRequired(true)
    )
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
  const clientDocumentId = interaction.options.getString('client', true)

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
