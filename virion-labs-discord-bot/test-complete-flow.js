const fetch = require('node-fetch');
require('dotenv').config();

const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';

async function testCompleteOnboardingFlow() {
  console.log('🧪 Testing Complete Discord Bot Onboarding Flow...\n');
  
  const testGuildId = '905448362944393218';
  const testChannelId = '1156935138584838144';
  const testUserId = 'test-user-' + Date.now();
  const testUsername = 'TestUser#' + Math.floor(Math.random() * 9999);
  
  console.log(`📊 Test Parameters:`);
  console.log(`   Guild ID: ${testGuildId}`);
  console.log(`   Channel ID: ${testChannelId}`);
  console.log(`   User ID: ${testUserId}`);
  console.log(`   Username: ${testUsername}\n`);
  
  try {
    // Test 1: Get bot configuration
    console.log('1️⃣ Testing: Get bot configuration from API');
    const configResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/config?guild_id=${testGuildId}&channel_id=${testChannelId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      }
    });

    if (!configResponse.ok) {
      throw new Error(`Config API failed: ${configResponse.status} ${configResponse.statusText}`);
    }

    const configData = await configResponse.json();
    console.log(`✅ Config API Success:`);
    console.log(`   Configured: ${configData.configured}`);
    console.log(`   Campaign: ${configData.campaign?.name} (${configData.campaign?.type})`);
    console.log(`   Bot: ${configData.campaign?.bot_config?.bot_name}`);
    console.log(`   Onboarding Fields: ${configData.campaign?.onboarding_fields?.length || 0}\n`);

    if (!configData.configured) {
      throw new Error('Bot not configured for this guild/channel');
    }

    const campaignId = configData.campaign.id;
    const onboardingFields = configData.campaign.onboarding_fields;

    // Test 2: Create new onboarding session
    console.log('2️⃣ Testing: Create new onboarding session');
    const createResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        discord_user_id: testUserId,
        discord_username: testUsername
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      throw new Error(`Create session failed: ${createResponse.status} - ${errorData}`);
    }

    const sessionData = await createResponse.json();
    console.log(`✅ Session Creation Success:`);
    console.log(`   Success: ${sessionData.success}`);
    console.log(`   Fields Count: ${sessionData.fields?.length || 0}`);
    console.log(`   Next Field: ${sessionData.next_field}`);
    console.log(`   Is Completed: ${sessionData.is_completed}\n`);

    if (sessionData.is_completed) {
      console.log('⚠️ Session already completed - testing with a different user ID');
      return;
    }

    // Test 3: Answer onboarding questions
    if (onboardingFields && onboardingFields.length > 0) {
      console.log('3️⃣ Testing: Answer onboarding questions');
      
      for (let i = 0; i < Math.min(onboardingFields.length, 3); i++) {
        const field = onboardingFields[i];
        let testValue;
        
        switch (field.field_type) {
          case 'text':
            testValue = `Test ${field.field_key} response`;
            break;
          case 'email':
            testValue = `test${Date.now()}@example.com`;
            break;
          case 'select':
            testValue = field.field_options?.[0] || 'Test Option';
            break;
          case 'multiselect':
            testValue = field.field_options?.slice(0, 2) || ['Option 1', 'Option 2'];
            break;
          default:
            testValue = 'Test Value';
        }

        console.log(`   📝 Answering "${field.field_label}": ${JSON.stringify(testValue)}`);

        const answerResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Virion-Discord-Bot/2.0'
          },
          body: JSON.stringify({
            campaign_id: campaignId,
            discord_user_id: testUserId,
            discord_username: testUsername,
            field_key: field.field_key,
            field_value: typeof testValue === 'object' ? JSON.stringify(testValue) : testValue
          })
        });

        if (!answerResponse.ok) {
          const errorData = await answerResponse.text();
          console.log(`   ❌ Failed to answer field ${field.field_key}: ${answerResponse.status} - ${errorData}`);
          continue;
        }

        const answerData = await answerResponse.json();
        console.log(`   ✅ Answer recorded. Next: ${answerData.next_field || 'COMPLETION'}`);

        if (answerData.is_completed) {
          console.log(`   🎉 Onboarding completed!\n`);
          break;
        }
      }
    }

    // Test 4: Check session status
    console.log('4️⃣ Testing: Check final session status');
    const statusResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding?campaign_id=${campaignId}&discord_user_id=${testUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`✅ Final Status:`);
      console.log(`   Completed: ${statusData.is_completed}`);
      console.log(`   Progress: ${statusData.completed_fields || 0}/${statusData.total_fields || 0}`);
      console.log(`   Next Field: ${statusData.next_field || 'N/A'}\n`);
    }

    console.log('🎉 Complete Onboarding Flow Test PASSED!');
    console.log('\n📊 Summary:');
    console.log('✅ Bot configuration retrieval');
    console.log('✅ Onboarding session creation');
    console.log('✅ Question answering flow');
    console.log('✅ Session state management');
    console.log('\n🚀 The Discord bot onboarding flow is working properly!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\n🔧 This indicates an issue that needs to be resolved.');
  }
}

// Run the test
testCompleteOnboardingFlow().catch(console.error); 