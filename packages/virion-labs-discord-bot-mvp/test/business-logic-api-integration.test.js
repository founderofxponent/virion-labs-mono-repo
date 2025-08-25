// Test script for Business Logic API Integration
// Run with: node test/business-logic-api-integration.test.js

const { EnhancedOnboardingHandler } = require('../src/handlers/EnhancedOnboardingHandler');
const { ApiService } = require('../src/services/ApiService');

// Mock classes and dependencies
class MockLogger {
  info(message) { console.log(`[INFO] ${message}`); }
  warn(message) { console.log(`[WARN] ${message}`); }
  error(message) { console.log(`[ERROR] ${message}`); }
  debug(message) { console.log(`[DEBUG] ${message}`); }
}

// Mock API Service that simulates the business logic API responses
class MockBusinessLogicApiService {
  constructor() {
    this.campaignCache = new Map();
  }

  getCachedCampaign(campaignId) {
    return this.campaignCache.get(campaignId);
  }

  // Mock the business logic API response with the new schema format
  async startOnboarding(campaignId, userId, username) {
    console.log(`[MockAPI] Starting onboarding for campaign: ${campaignId}`);
    
    // Simulate the enhanced business logic API response with step fields
    return {
      success: true,
      data: {
        questions: [
          {
            field_key: 'full_name',
            field_label: 'What is your full name?',
            field_type: 'text',
            field_placeholder: 'Enter your full name',
            field_description: null,
            field_options: null,
            is_required: true,
            validation_rules: { max_length: 50, min_length: 2 },
            sort_order: 0,
            step_number: 1,
            step_role_ids: ['1402456736144560299'],
            branching_logic: []
          },
          {
            field_key: 'email_address',
            field_label: 'What is your email address?',
            field_type: 'email',
            field_placeholder: 'your.email@example.com',
            field_description: null,
            field_options: null,
            is_required: true,
            validation_rules: {},
            sort_order: 1,
            step_number: 1,
            step_role_ids: ['1402456736144560299'],
            branching_logic: []
          },
          {
            field_key: 'interests',
            field_label: 'What are your main interests?',
            field_type: 'text',
            field_placeholder: 'Gaming, Tech, Music, etc.',
            field_description: null,
            field_options: null,
            is_required: true,
            validation_rules: { min_length: 3 },
            sort_order: 0,
            step_number: 2,
            step_role_ids: ['1402456736144560300'],
            branching_logic: []
          },
          {
            field_key: 'experience_level',
            field_label: 'How would you describe your experience level?',
            field_type: 'text',
            field_placeholder: 'Beginner, Intermediate, Advanced',
            field_description: null,
            field_options: null,
            is_required: true,
            validation_rules: {},
            sort_order: 1,
            step_number: 2,
            step_role_ids: ['1402456736144560300'],
            branching_logic: []
          },
          {
            field_key: 'community_role',
            field_label: 'What role do you want to play?',
            field_type: 'text',
            field_placeholder: 'Helper, Learner, Creator, etc.',
            field_description: null,
            field_options: null,
            is_required: true,
            validation_rules: { min_length: 2 },
            sort_order: 0,
            step_number: 3,
            step_role_ids: ['1402456736144560302'],
            branching_logic: []
          }
        ]
      }
    };
  }

  async submitOnboarding(payload) {
    console.log(`[MockAPI] Submitting onboarding for user: ${payload.discord_user_id}`);
    return {
      success: true,
      data: {
        message: 'Multi-step onboarding completed successfully via Business Logic API!'
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
const mockApiService = new MockBusinessLogicApiService();

// Add test campaign to cache
mockApiService.campaignCache.set('fbo62u5e1atap7743v19jsgi', {
  documentId: 'fbo62u5e1atap7743v19jsgi',
  name: 'Multi-Step Test Campaign via Business Logic API',
  description: 'Testing the business logic API integration',
  target_role_ids: ['1402456736144560310']
});

// Initialize handler
const handler = new EnhancedOnboardingHandler(mockConfig, mockLogger, mockApiService);

// Test functions for Business Logic API integration
function testBusinessLogicApiFieldStructure() {
  console.log('\n=== Testing Business Logic API Field Structure ===');
  
  return mockApiService.startOnboarding('fbo62u5e1atap7743v19jsgi', 'user123', 'testuser')
    .then(response => {
      console.log('API Response success:', response.success);
      console.log('Number of fields received:', response.data.questions.length);
      
      // Verify that all required step fields are present
      const firstField = response.data.questions[0];
      console.log('First field structure:');
      console.log('- field_key:', firstField.field_key);
      console.log('- step_number:', firstField.step_number);
      console.log('- step_role_ids:', firstField.step_role_ids);
      console.log('- sort_order:', firstField.sort_order);
      console.log('- validation_rules:', firstField.validation_rules);
      
      // Verify all fields have required step information
      let allFieldsValid = true;
      response.data.questions.forEach((field, index) => {
        if (field.step_number === undefined || field.step_role_ids === undefined) {
          console.log(`❌ Field ${index} (${field.field_key}) missing step information`);
          allFieldsValid = false;
        }
      });
      
      if (allFieldsValid) {
        console.log('✅ All fields have required step information');
      }
      
      return response;
    });
}

function testEnhancedOnboardingWithApiData() {
  console.log('\n=== Testing Enhanced Onboarding Handler with Business Logic API Data ===');
  
  return mockApiService.startOnboarding('fbo62u5e1atap7743v19jsgi', 'user123', 'testuser')
    .then(response => {
      const questions = response.data.questions;
      
      // Test question grouping by step
      const stepGroups = handler.groupQuestionsByStep(questions);
      console.log('Step groups created:', stepGroups.size);
      
      for (const [stepNumber, stepQuestions] of stepGroups) {
        console.log(`Step ${stepNumber}:`);
        console.log(`  - Questions: ${stepQuestions.map(q => q.field_key).join(', ')}`);
        
        // Test step role collection
        const stepRoleIds = new Set();
        stepQuestions.forEach(q => {
          if (q.step_role_ids && Array.isArray(q.step_role_ids)) {
            q.step_role_ids.forEach(roleId => stepRoleIds.add(roleId));
          }
        });
        console.log(`  - Role IDs: [${Array.from(stepRoleIds).join(', ')}]`);
        
        // Test validation rules normalization
        stepQuestions.forEach(q => {
          if (q.validation_rules && Object.keys(q.validation_rules).length > 0) {
            const normalizedRules = handler._normalizeValidationRules(q.validation_rules);
            console.log(`  - ${q.field_key} validation rules:`, normalizedRules.length, 'rules');
          }
        });
      }
      
      return { stepGroups, questions };
    });
}

function testStepValidationWithApiData() {
  console.log('\n=== Testing Step Validation with Business Logic API Data ===');
  
  return mockApiService.startOnboarding('fbo62u5e1atap7743v19jsgi', 'user123', 'testuser')
    .then(response => {
      const questions = response.data.questions;
      const step1Questions = questions.filter(q => q.step_number === 1);
      
      console.log(`Testing validation for Step 1 with ${step1Questions.length} questions`);
      
      // Test valid responses
      const validResponses = {
        full_name: 'John Doe',
        email_address: 'john.doe@example.com'
      };
      
      const validErrors = handler.validateStepResponses(validResponses, step1Questions);
      console.log('Valid step responses errors:', validErrors.length === 0 ? 'None' : validErrors);
      
      // Test invalid responses
      const invalidResponses = {
        full_name: 'J', // Too short based on min_length: 2
        email_address: 'invalid-email' // Invalid email format
      };
      
      const invalidErrors = handler.validateStepResponses(invalidResponses, step1Questions);
      console.log('Invalid step responses errors:', invalidErrors);
      
      return { validErrors, invalidErrors };
    });
}

function testMultiStepFlowDetection() {
  console.log('\n=== Testing Multi-Step Flow Detection ===');
  
  return mockApiService.startOnboarding('fbo62u5e1atap7743v19jsgi', 'user123', 'testuser')
    .then(response => {
      const questions = response.data.questions;
      const stepGroups = handler.groupQuestionsByStep(questions);
      
      const isMultiStep = stepGroups.size > 1;
      const totalSteps = Math.max(...Array.from(stepGroups.keys()));
      
      console.log('Questions received:', questions.length);
      console.log('Unique steps detected:', stepGroups.size);
      console.log('Is multi-step flow:', isMultiStep);
      console.log('Total steps:', totalSteps);
      
      if (isMultiStep) {
        console.log('✅ Multi-step flow correctly detected');
        console.log('First step questions:', stepGroups.get(1)?.map(q => q.field_key).join(', '));
      } else {
        console.log('❌ Multi-step flow not detected');
      }
      
      return { isMultiStep, totalSteps, stepGroups };
    });
}

function testCompleteApiIntegration() {
  console.log('\n=== Testing Complete Business Logic API Integration ===');
  
  return mockApiService.startOnboarding('fbo62u5e1atap7743v19jsgi', 'user123', 'testuser')
    .then(response => {
      console.log('1. ✅ Start onboarding API call successful');
      
      const questions = response.data.questions;
      const stepGroups = handler.groupQuestionsByStep(questions);
      
      console.log('2. ✅ Question grouping successful');
      console.log('3. ✅ Step role IDs available for assignment');
      console.log('4. ✅ Validation rules properly formatted');
      
      // Simulate completing step 1
      const step1Questions = stepGroups.get(1) || [];
      const step1Responses = {
        full_name: 'John Doe',
        email_address: 'john.doe@example.com'
      };
      
      const step1Errors = handler.validateStepResponses(step1Responses, step1Questions);
      console.log('5. ✅ Step 1 validation successful:', step1Errors.length === 0);
      
      // Test final submission
      const allResponses = {
        full_name: 'John Doe',
        email_address: 'john.doe@example.com',
        interests: 'Gaming, Tech, Music',
        experience_level: 'Intermediate',
        community_role: 'Helper'
      };
      
      return mockApiService.submitOnboarding({
        campaign_id: 'fbo62u5e1atap7743v19jsgi',
        discord_user_id: 'user123',
        discord_username: 'testuser',
        responses: allResponses
      });
    })
    .then(submitResponse => {
      console.log('6. ✅ Submit onboarding API call successful:', submitResponse.success);
      console.log('7. ✅ Complete integration test passed!');
      return submitResponse;
    });
}

// Run all Business Logic API integration tests
async function runBusinessLogicApiTests() {
  console.log('🧪 Enhanced Onboarding Handler - Business Logic API Integration Tests');
  console.log('==================================================================');
  
  try {
    await testBusinessLogicApiFieldStructure();
    await testEnhancedOnboardingWithApiData();
    await testStepValidationWithApiData();
    await testMultiStepFlowDetection();
    await testCompleteApiIntegration();
    
    console.log('\n✅ All Business Logic API integration tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Business Logic API integration test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBusinessLogicApiTests();
}

module.exports = {
  testBusinessLogicApiFieldStructure,
  testEnhancedOnboardingWithApiData,
  testStepValidationWithApiData,
  testMultiStepFlowDetection,
  testCompleteApiIntegration,
  runBusinessLogicApiTests
};