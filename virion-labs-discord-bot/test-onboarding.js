const fetch = require('node-fetch');
require('dotenv').config();

const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';

async function testOnboardingFlow() {
  console.log('🧪 Testing Onboarding Flow API endpoints...\n');
  
  const testCampaignId = 'test-campaign-id';
  const testUserId = 'test-user-123';
  const testUsername = 'TestUser#1234';
  
  try {
    // Test 1: Create new onboarding session
    console.log('1️⃣ Testing: Create new onboarding session');
    const createResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({
        campaign_id: testCampaignId,
        discord_user_id: testUserId,
        discord_username: testUsername
      })
    });
    
    console.log(`   Status: ${createResponse.status}`);
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log(`   ✅ Success: ${JSON.stringify(createResult, null, 2)}`);
    } else {
      const error = await createResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }
    
    // Test 2: Get existing session
    console.log('\n2️⃣ Testing: Get existing onboarding session');
    const getResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding?campaign_id=${testCampaignId}&discord_user_id=${testUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      }
    });
    
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log(`   ✅ Success: ${JSON.stringify(getResult, null, 2)}`);
    } else {
      const error = await getResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }
    
    // Test 3: Save a response
    console.log('\n3️⃣ Testing: Save onboarding response');
    const saveResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({
        campaign_id: testCampaignId,
        discord_user_id: testUserId,
        discord_username: testUsername,
        field_key: 'test_field',
        field_value: 'test_value'
      })
    });
    
    console.log(`   Status: ${saveResponse.status}`);
    if (saveResponse.ok) {
      const saveResult = await saveResponse.json();
      console.log(`   ✅ Success: ${JSON.stringify(saveResult, null, 2)}`);
    } else {
      const error = await saveResponse.text();
      console.log(`   ❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOnboardingFlow(); 