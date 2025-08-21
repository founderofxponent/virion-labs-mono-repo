// Test script to verify the real Business Logic API is working
// Run with: node test/real-api-test.js

const API_BASE_URL = 'http://localhost:8000';  // Business Logic API URL
const API_KEY = '31db492f8194542a1965bfc4ac58fe69e621e7e2fc069817a41387d32b251a3e';

async function testRealBusinessLogicApi() {
  console.log('🧪 Testing Real Business Logic API');
  console.log('=====================================');
  
  try {
    const startOnboardingRequest = {
      campaign_id: 'fbo62u5e1atap7743v19jsgi',
      discord_user_id: 'test-user-123',
      discord_username: 'testuser'
    };
    
    console.log('Sending start onboarding request...');
    const response = await fetch(`${API_BASE_URL}/api/v1/integrations/discord/onboarding/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(startOnboardingRequest)
    });
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API request successful!');
    console.log('Response success:', data.success);
    console.log('Response message:', data.message || 'No message');
    console.log('Number of fields:', data.fields?.length || 0);
    
    if (!data.success) {
      console.log('❌ API returned success: false');
      console.log('Full response:', JSON.stringify(data, null, 2));
      return;
    }
    
    if (data.fields && data.fields.length > 0) {
      console.log('\nFirst field structure:');
      const firstField = data.fields[0];
      console.log('- field_key:', firstField.field_key);
      console.log('- field_label:', firstField.field_label);
      console.log('- step_number:', firstField.step_number);
      console.log('- step_role_ids:', firstField.step_role_ids);
      console.log('- validation_rules:', firstField.validation_rules);
      
      console.log('\nAll fields with step information:');
      data.fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field.field_key} (step ${field.step_number}, roles: [${field.step_role_ids?.join(', ') || 'none'}])`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testRealBusinessLogicApi();
}

module.exports = { testRealBusinessLogicApi };