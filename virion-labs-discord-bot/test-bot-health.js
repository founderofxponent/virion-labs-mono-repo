const { supabase } = require('./supabase');
require('dotenv').config();

const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';

async function testBotHealth() {
  console.log('🧪 Testing Discord Bot Health...\n');
  
  // Test 1: Database connectivity
  console.log('1. Testing Supabase connectivity...');
  try {
    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, is_active')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
      if (data && data.length > 0) {
        console.log(`   Found ${data.length} campaign(s)`);
      }
    }
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
  }
  
  // Test 2: Dashboard API connectivity
  console.log('\n2. Testing Dashboard API connectivity...');
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/config?guild_id=test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot-Health-Check/1.0'
      }
    });
    
    if (response.ok) {
      console.log('✅ Dashboard API connection successful');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } else {
      console.log(`❌ Dashboard API connection failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Dashboard API connection error:', error.message);
  }
  
  // Test 3: Onboarding API endpoint
  console.log('\n3. Testing Onboarding API endpoint...');
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding?campaign_id=1&discord_user_id=test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot-Health-Check/1.0'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 400) {
      console.log('✅ Onboarding API responding correctly (expected 400 for test data)');
    } else if (response.ok) {
      console.log('✅ Onboarding API connection successful');
    } else {
      console.log(`⚠️ Onboarding API unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Onboarding API connection error:', error.message);
  }
  
  // Test 4: Active campaigns query
  console.log('\n4. Testing active campaigns query...');
  try {
    const { data: activeCampaigns, error } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, is_active, status')
      .eq('is_active', true)
      .eq('is_deleted', false);
    
    if (error) {
      console.log('❌ Active campaigns query failed:', error.message);
    } else {
      console.log(`✅ Found ${activeCampaigns.length} active campaigns`);
      activeCampaigns.forEach(campaign => {
        console.log(`   - ${campaign.campaign_name} (ID: ${campaign.id}, Status: ${campaign.status})`);
      });
    }
  } catch (error) {
    console.log('❌ Active campaigns query error:', error.message);
  }
  
  // Test 5: Response time test
  console.log('\n5. Testing response times...');
  const startTime = Date.now();
  
  try {
    await Promise.all([
      supabase.from('discord_guild_campaigns').select('count').limit(1),
      fetch(`${DASHBOARD_API_URL}/discord-bot/config?guild_id=test`),
    ]);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (responseTime < 1000) {
      console.log(`✅ Good response time: ${responseTime}ms`);
    } else if (responseTime < 3000) {
      console.log(`⚠️ Slow response time: ${responseTime}ms (may cause interaction timeouts)`);
    } else {
      console.log(`❌ Very slow response time: ${responseTime}ms (will cause interaction failures)`);
    }
  } catch (error) {
    console.log('❌ Response time test failed:', error.message);
  }
  
  console.log('\n🏁 Health check complete!');
  console.log('\n💡 If you see slow response times or connection errors, this may explain');
  console.log('   why Discord buttons sometimes show "This interaction failed".');
  console.log('\n📋 Recommended actions:');
  console.log('   - Ensure your database and API are running properly');
  console.log('   - Check your network connection');
  console.log('   - Restart the Discord bot if needed');
}

// Run the health check
testBotHealth().catch(console.error); 