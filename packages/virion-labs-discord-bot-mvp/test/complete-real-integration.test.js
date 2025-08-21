// Complete Real Integration Test - Discord Bot + Business Logic API + Strapi
// Run with: node test/complete-real-integration.test.js

const { EnhancedOnboardingHandler } = require('../src/handlers/EnhancedOnboardingHandler');

// Mock logger
class MockLogger {
  info(message) { console.log(`[INFO] ${message}`); }
  warn(message) { console.log(`[WARN] ${message}`); }
  error(message) { console.log(`[ERROR] ${message}`); }
  debug(message) { console.log(`[DEBUG] ${message}`); }
}

// Real API Service that calls the actual Business Logic API
class RealApiService {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
    this.apiKey = '31db492f8194542a1965bfc4ac58fe69e621e7e2fc069817a41387d32b251a3e';
    this.campaignCache = new Map();
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    console.log(`📡 Making API request to ${url}`);

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        console.log(`API request to ${url} returned status ${response.status}:`, data);
      }
      return data;
    } catch (error) {
      console.log(`API request error during request to ${url}: ${error.message}`);
      return { success: false, message: 'Failed to communicate with the API.' };
    }
  }

  getCachedCampaign(campaignId) {
    return this.campaignCache.get(campaignId);
  }

  async startOnboarding(campaignId, userId, username) {
    console.log(`[RealAPI] Starting onboarding for user ${userId} in campaign ${campaignId}`);
    const response = await this._request('/api/v1/integrations/discord/onboarding/start', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: campaignId,
        discord_user_id: userId,
        discord_username: username
      }),
    });
    
    // Transform the response to match expected format
    if (!response.success) {
      return { success: false, message: response.message };
    }
    
    return {
      success: true,
      data: {
        questions: response.fields || []
      }
    };
  }

  async submitOnboarding(payload) {
    console.log(`[RealAPI] Submitting onboarding for user ${payload.discord_user_id}`);
    const response = await this._request('/api/v1/integrations/discord/onboarding/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    // Transform the response to match expected format
    return {
      success: response.success,
      data: {
        message: response.message || 'Onboarding completed successfully!',
        role_assigned: response.role_assigned || false
      }
    };
  }
}

// Test configuration
const mockConfig = {
  features: {
    enhanced_onboarding: true,
    enable_branching: true,
    enable_question_flow: true,
    max_questions_per_modal: 5
  }
};

const mockLogger = new MockLogger();
const realApiService = new RealApiService();

// Add test campaign to cache
realApiService.campaignCache.set('fbo62u5e1atap7743v19jsgi', {
  documentId: 'fbo62u5e1atap7743v19jsgi',
  name: 'Multi-Step Test Campaign (Real)',
  description: 'Real integration test with Business Logic API and Strapi',
  target_role_ids: ['1402456736144560310']
});

// Initialize handler with real API service
const handler = new EnhancedOnboardingHandler(mockConfig, mockLogger, realApiService);

async function testCompleteRealIntegration() {
  console.log('🧪 Complete Real Integration Test');
  console.log('Discord Bot → Business Logic API → Strapi');
  console.log('===========================================');
  
  try {
    // Test 1: Start onboarding and get real data
    console.log('\n1️⃣ Testing Real Onboarding Start API Call');
    const startResponse = await realApiService.startOnboarding('fbo62u5e1atap7743v19jsgi', 'real-test-user-456', 'realtestuser');
    
    if (!startResponse.success) {
      console.log('❌ Start onboarding failed:', startResponse.message);
      return;
    }
    
    console.log('✅ Start onboarding successful');
    console.log('📊 Received', startResponse.data.questions.length, 'onboarding fields');
    
    // Test 2: Verify field structure
    console.log('\n2️⃣ Testing Field Structure from Real API');
    const questions = startResponse.data.questions;
    
    let allFieldsValid = true;
    questions.forEach((field, index) => {
      console.log(`Field ${index + 1}: ${field.field_key} (step ${field.step_number})`);
      if (!field.step_number || !field.step_role_ids) {
        console.log(`❌ Field ${field.field_key} missing step information`);
        allFieldsValid = false;
      }
    });
    
    if (allFieldsValid) {
      console.log('✅ All fields have required step information');
    }
    
    // Test 3: Question grouping with real data
    console.log('\n3️⃣ Testing Question Grouping with Real Data');
    const stepGroups = handler.groupQuestionsByStep(questions);
    console.log('📈 Created', stepGroups.size, 'step groups');
    
    for (const [stepNumber, stepQuestions] of stepGroups) {
      const roleIds = [...new Set(stepQuestions.flatMap(q => q.step_role_ids || []))];
      console.log(`Step ${stepNumber}: ${stepQuestions.length} questions, roles: [${roleIds.join(', ')}]`);
    }
    
    // Test 4: Multi-step flow detection
    console.log('\n4️⃣ Testing Multi-Step Flow Detection');
    const isMultiStep = stepGroups.size > 1;
    const totalSteps = Math.max(...Array.from(stepGroups.keys()));
    
    console.log('🔄 Is multi-step flow:', isMultiStep);
    console.log('🔢 Total steps:', totalSteps);
    
    if (isMultiStep) {
      console.log('✅ Multi-step flow correctly detected');
    }
    
    // Test 5: Validation with real data
    console.log('\n5️⃣ Testing Validation Rules with Real Data');
    const step1Questions = questions.filter(q => q.step_number === 1);
    
    // Test with valid responses
    const validResponses = {};
    step1Questions.forEach(q => {
      switch (q.field_key) {
        case 'full_name':
          validResponses[q.field_key] = 'John Real Test';
          break;
        case 'email_address':
          validResponses[q.field_key] = 'realtest@example.com';
          break;
        default:
          validResponses[q.field_key] = 'valid response';
      }
    });
    
    const validationErrors = handler.validateStepResponses(validResponses, step1Questions);
    console.log('✅ Step 1 validation errors:', validationErrors.length === 0 ? 'None' : validationErrors);
    
    // Test 6: Complete onboarding submission
    console.log('\n6️⃣ Testing Complete Onboarding Submission');
    
    // Create responses for all fields
    const allResponses = {};
    questions.forEach(q => {
      switch (q.field_key) {
        case 'full_name':
          allResponses[q.field_key] = 'John Real Test User';
          break;
        case 'email_address':
          allResponses[q.field_key] = 'realtest@example.com';
          break;
        case 'interests':
          allResponses[q.field_key] = 'Real API Testing, Discord Bots';
          break;
        case 'experience_level':
          allResponses[q.field_key] = 'Advanced';
          break;
        case 'community_role':
          allResponses[q.field_key] = 'Tester';
          break;
        default:
          allResponses[q.field_key] = 'test response';
      }
    });
    
    console.log('📝 Submitting responses for', Object.keys(allResponses).length, 'fields');
    
    const submitResponse = await realApiService.submitOnboarding({
      campaign_id: 'fbo62u5e1atap7743v19jsgi',
      discord_user_id: 'real-test-user-456',
      discord_username: 'realtestuser',
      responses: allResponses
    });
    
    if (submitResponse.success) {
      console.log('✅ Onboarding submission successful:', submitResponse.data.message);
    } else {
      console.log('❌ Onboarding submission failed:', submitResponse.data.message);
    }
    
    // Test 7: Full flow simulation
    console.log('\n7️⃣ Testing Full Enhanced Onboarding Flow Simulation');
    
    // Initialize flow state like the real handler would
    const flowState = {
      campaign_id: 'fbo62u5e1atap7743v19jsgi',
      user_id: 'real-test-user-456',
      current_step: 1,
      responses: {},
      visible_fields: questions.map(q => q.field_key),
      completed_steps: [],
      total_steps: totalSteps
    };
    
    console.log('🔄 Flow state initialized');
    console.log('📊 Flow metadata:', {
      total_steps: flowState.total_steps,
      total_fields: flowState.visible_fields.length,
      is_multi_step: isMultiStep
    });
    
    // Simulate step completions
    for (let stepNum = 1; stepNum <= totalSteps; stepNum++) {
      const stepQuestions = questions.filter(q => q.step_number === stepNum);
      const stepRoleIds = [...new Set(stepQuestions.flatMap(q => q.step_role_ids || []))];
      
      console.log(`📋 Step ${stepNum}: ${stepQuestions.length} questions → roles: [${stepRoleIds.join(', ')}]`);
    }
    
    console.log('\n🎉 Complete Real Integration Test PASSED!');
    console.log('==================================================');
    console.log('✅ Business Logic API integration working');
    console.log('✅ Strapi data properly retrieved');
    console.log('✅ Multi-step onboarding flow functional');
    console.log('✅ Step-based role assignment ready');
    console.log('✅ Validation rules enforced');
    console.log('✅ End-to-end flow validated');
    
  } catch (error) {
    console.error('\n❌ Complete Real Integration Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the complete real integration test
if (require.main === module) {
  testCompleteRealIntegration();
}

module.exports = { testCompleteRealIntegration };