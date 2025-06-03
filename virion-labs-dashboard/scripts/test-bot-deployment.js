#!/usr/bin/env node

/**
 * Test script for Discord bot deployment
 * Run with: node scripts/test-bot-deployment.js
 */

const { botDeploymentManager } = require('../lib/bot-deployment')

async function testDeployment() {
  console.log('🚀 Testing Bot Deployment System...\n')

  const testConfig = {
    applicationId: 'test_app_12345',
    name: 'Test Referral Bot',
    code: `
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log('Test bot is ready!');
});

client.on('messageCreate', message => {
  if (message.content === '!test') {
    message.reply('Bot is working!');
  }
});

// Use test token (this won't actually connect)
client.login('test-token').catch(console.error);
    `,
    token: 'test-token-123',
    auto_deploy: false,
    environment: {
      TEST_MODE: 'true'
    }
  }

  try {
    console.log('1. Testing bot deployment...')
    const deployResult = await botDeploymentManager.deployBot(testConfig)
    
    if (deployResult.success) {
      console.log('✅ Deployment successful!')
      console.log(`   Deployment ID: ${deployResult.deploymentId}`)
      console.log(`   Endpoint: ${deployResult.endpoint}`)
      console.log(`   Status: ${deployResult.status}\n`)

      const deploymentId = deployResult.deploymentId

      // Test start
      console.log('2. Testing bot start...')
      const startResult = await botDeploymentManager.startBot(deploymentId)
      
      if (startResult.success) {
        console.log('✅ Start successful!')
        console.log(`   Status: ${startResult.status}\n`)

        // Test stop
        console.log('3. Testing bot stop...')
        const stopResult = await botDeploymentManager.stopBot(deploymentId)
        
        if (stopResult.success) {
          console.log('✅ Stop successful!')
          console.log(`   Status: ${stopResult.status}\n`)

          // Test restart
          console.log('4. Testing bot restart...')
          const restartResult = await botDeploymentManager.restartBot(deploymentId)
          
          if (restartResult.success) {
            console.log('✅ Restart successful!')
            console.log(`   Status: ${restartResult.status}\n`)
          } else {
            console.log('❌ Restart failed:', restartResult.error)
          }
        } else {
          console.log('❌ Stop failed:', stopResult.error)
        }
      } else {
        console.log('❌ Start failed:', startResult.error)
      }

      // Show deployment info
      console.log('5. Deployment info:')
      const info = botDeploymentManager.getDeploymentInfo(deploymentId)
      console.log(JSON.stringify(info, null, 2))

    } else {
      console.log('❌ Deployment failed:', deployResult.error)
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }

  console.log('\n🏁 Test completed!')
}

// Check if we're running this script directly
if (require.main === module) {
  testDeployment()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test error:', error)
      process.exit(1)
    })
}

module.exports = { testDeployment } 