require('dotenv').config();

// Configuration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.xponent.ph/webhook/7a630bf4-234c-44fc-bd69-f1db2f6062ac';

// Test data that mimics what the Discord bot would send
const testData = {
  messageId: "test-123456789",
  channelId: "test-channel-123",
  guildId: "test-guild-123",
  guildName: "Test Server",
  channelName: "general",
  authorId: "test-user-123",
  authorTag: "testuser#1234",
  authorDisplayName: "Test User",
  content: "Hello, this is a test message from the Virion Labs Discord bot!",
  timestamp: new Date().toISOString(),
  attachments: [],
  embeds: [],
  mentions: {
    users: [],
    roles: [],
    channels: []
  },
  referencedMessage: null
};

async function testWebhook() {
  console.log('🧪 Testing n8n webhook...');
  console.log(`🔗 URL: ${N8N_WEBHOOK_URL}`);
  console.log('📤 Sending test data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n⏳ Sending request...\n');
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot-Test/1.0'
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('❌ Webhook responded with error status');
      
      // Provide specific error guidance
      switch (response.status) {
        case 404:
          console.log('\n💡 This usually means:');
          console.log('   • n8n workflow is not active');
          console.log('   • Webhook URL is incorrect');
          console.log('   • Webhook path doesn\'t match');
          break;
        case 500:
          console.log('\n💡 This usually means:');
          console.log('   • Error in n8n workflow execution');
          console.log('   • Check n8n workflow logs');
          break;
        case 403:
          console.log('\n💡 This usually means:');
          console.log('   • Webhook authentication required');
          console.log('   • IP restrictions in place');
          break;
      }
      return;
    }

    // Try to parse response
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      console.log('📨 JSON Response:');
      console.log(JSON.stringify(responseData, null, 2));
    } else {
      responseData = await response.text();
      console.log('📨 Text Response:');
      console.log(responseData);
    }

    // Test different response formats the bot expects
    let aiResponse = '';
    if (typeof responseData === 'string') {
      aiResponse = responseData;
    } else if (responseData && responseData.response) {
      aiResponse = responseData.response;
    } else if (responseData && responseData.message) {
      aiResponse = responseData.message;
    } else if (responseData && responseData.content) {
      aiResponse = responseData.content;
    } else if (responseData && responseData.text) {
      aiResponse = responseData.text;
    } else if (responseData && responseData.reply) {
      aiResponse = responseData.reply;
    } else {
      aiResponse = JSON.stringify(responseData);
    }

    console.log('\n🤖 AI Response extracted:');
    console.log(`"${aiResponse}"`);
    console.log('\n✅ Webhook test completed successfully!');
    
    if (aiResponse.trim()) {
      console.log('\n🎉 Your n8n workflow is working correctly!');
      console.log('   The Discord bot should now be able to get AI responses.');
    } else {
      console.log('\n⚠️ Warning: AI response is empty');
      console.log('   Check your n8n workflow to ensure it returns content.');
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 This usually means:');
      console.log('   • DNS resolution failed');
      console.log('   • Check the webhook URL');
      console.log('   • Verify internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 This usually means:');
      console.log('   • n8n server is not responding');
      console.log('   • Server might be down');
      console.log('   • Port might be blocked');
    }
    
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('🚀 Virion Labs Discord Bot - Webhook Test\n');
testWebhook(); 