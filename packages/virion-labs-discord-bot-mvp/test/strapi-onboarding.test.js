// Test script for Enhanced Onboarding Handler with Strapi data format
// Run with: node test/strapi-onboarding.test.js

const { EnhancedOnboardingHandler } = require('../src/handlers/EnhancedOnboardingHandler');

// Mock classes and dependencies
class MockLogger {
  info(message) { console.log(`[INFO] ${message}`); }
  warn(message) { console.log(`[WARN] ${message}`); }
  error(message) { console.log(`[ERROR] ${message}`); }
  debug(message) { console.log(`[DEBUG] ${message}`); }
}

class MockApiService {
  constructor() {
    this.campaignCache = new Map();
  }

  getCachedCampaign(campaignId) {
    return this.campaignCache.get(campaignId);
  }

  async startOnboarding(campaignId, userId, username) {
    return {
      success: true,
      data: {
        questions: [
          {
            step_number: 1,
            sort_order: 0,
            id: 38,
            documentId: "jgtemn5uc7lw3ro5ybtqmdi4",
            field_key: "full_name",
            field_label: "What is your full name?",
            field_type: "text",
            field_placeholder: "Enter your full name",
            field_description: null,
            field_options: null,
            is_required: true,
            is_enabled: true,
            validation_rules: { max_length: 50, min_length: 2 },
            discord_integration: null,
            step_role_ids: ["1402456736144560299"]
          },
          {
            step_number: 1,
            sort_order: 1,
            id: 39,
            documentId: "guz7x94weo90j9kfiyxcu1yb",
            field_key: "email_address",
            field_label: "What is your email address?",
            field_type: "email",
            field_placeholder: "your.email@example.com",
            field_description: null,
            field_options: null,
            is_required: true,
            is_enabled: true,
            validation_rules: {},
            discord_integration: null,
            step_role_ids: ["1402456736144560299"]
          },
          {
            step_number: 2,
            sort_order: 0,
            id: 40,
            documentId: "rwt2ksev6mth2i8mimz7ib0q",
            field_key: "interests",
            field_label: "What are your main interests?",
            field_type: "text",
            field_placeholder: "Gaming, Tech, Music, etc.",
            field_description: null,
            field_options: null,
            is_required: true,
            is_enabled: true,
            validation_rules: { min_length: 3 },
            discord_integration: null,
            step_role_ids: ["1402456736144560300"]
          },
          {
            step_number: 2,
            sort_order: 1,
            id: 41,
            documentId: "afcil3lp5q7kq9a3o6018ft2",
            field_key: "experience_level",
            field_label: "How would you describe your experience level?",
            field_type: "text",
            field_placeholder: "Beginner, Intermediate, Advanced",
            field_description: null,
            field_options: null,
            is_required: true,
            is_enabled: true,
            validation_rules: {},
            discord_integration: null,
            step_role_ids: ["1402456736144560300"]
          },
          {
            step_number: 3,
            sort_order: 0,
            id: 42,
            documentId: "ug3b694xeg30cxfqd56ywo0d",
            field_key: "community_role",
            field_label: "What role do you want to play?",
            field_type: "text",
            field_placeholder: "Helper, Learner, Creator, etc.",
            field_description: null,
            field_options: null,
            is_required: true,
            is_enabled: true,
            validation_rules: { min_length: 2 },
            discord_integration: null,
            step_role_ids: ["1402456736144560302"]
          }
        ]
      }
    };
  }

  async submitOnboarding(payload) {
    return {
      success: true,
      data: {
        message: 'Multi-step onboarding completed successfully!'
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
const mockApiService = new MockApiService();

// Add test campaign to cache
mockApiService.campaignCache.set('fbo62u5e1atap7743v19jsgi', {
  documentId: 'fbo62u5e1atap7743v19jsgi',
  name: 'Multi-Step Test Campaign',
  description: 'A test campaign with multiple onboarding steps',
  target_role_ids: ['1402456736144560310']
});

// Initialize handler
const handler = new EnhancedOnboardingHandler(mockConfig, mockLogger, mockApiService);

// Test functions for Strapi data format
function testStrapiValidationRules() {
  console.log('\n=== Testing Strapi Validation Rules Normalization ===');
  
  // Test object format validation rules (from Strapi)
  const objectRules = { max_length: 50, min_length: 2 };
  const normalizedObjectRules = handler._normalizeValidationRules(objectRules);
  console.log('Object rules normalized:', normalizedObjectRules);
  
  // Test empty validation rules
  const emptyRules = {};
  const normalizedEmptyRules = handler._normalizeValidationRules(emptyRules);
  console.log('Empty rules normalized:', normalizedEmptyRules);
  
  // Test validation with normalized rules
  console.log('Min length validation (too short):', handler.validateFieldResponse('a', normalizedObjectRules));
  console.log('Min length validation (valid):', handler.validateFieldResponse('John Doe', normalizedObjectRules));
  console.log('Max length validation (too long):', handler.validateFieldResponse('This name is way too long for the validation rule', normalizedObjectRules));
}

function testStrapiQuestionGrouping() {
  console.log('\n=== Testing Strapi Question Grouping ===');
  
  // Simulate getting questions from the mock API service
  const mockResponse = {
    success: true,
    data: {
      questions: [
        { field_key: 'full_name', step_number: 1, sort_order: 0, is_enabled: true },
        { field_key: 'email_address', step_number: 1, sort_order: 1, is_enabled: true },
        { field_key: 'interests', step_number: 2, sort_order: 0, is_enabled: true },
        { field_key: 'experience_level', step_number: 2, sort_order: 1, is_enabled: true },
        { field_key: 'community_role', step_number: 3, sort_order: 0, is_enabled: true }
      ]
    }
  };
  
  const questions = mockResponse.data.questions.filter(q => q.is_enabled);
  const grouped = handler.groupQuestionsByStep(questions);
  
  console.log('Grouped Strapi questions:');
  for (const [step, stepQuestions] of grouped) {
    console.log(`  Step ${step}: ${stepQuestions.map(q => q.field_key).join(', ')}`);
  }
  
  console.log(`Total steps: ${grouped.size}`);
}

function testStrapiStepValidation() {
  console.log('\n=== Testing Strapi Step Validation ===');
  
  const stepQuestions = [
    {
      field_key: 'full_name',
      field_label: 'What is your full name?',
      validation_rules: { max_length: 50, min_length: 2 },
      is_required: true
    },
    {
      field_key: 'email_address',
      field_label: 'What is your email address?',
      validation_rules: {},
      is_required: true
    }
  ];
  
  // Test valid responses
  const validResponses = {
    full_name: 'John Doe',
    email_address: 'john.doe@example.com'
  };
  
  const validErrors = handler.validateStepResponses(validResponses, stepQuestions);
  console.log('Valid step responses errors:', validErrors);
  
  // Test invalid responses
  const invalidResponses = {
    full_name: 'J', // Too short
    email_address: '' // Required but empty
  };
  
  const invalidErrors = handler.validateStepResponses(invalidResponses, stepQuestions);
  console.log('Invalid step responses errors:', invalidErrors);
}

function testStrapiFieldTypes() {
  console.log('\n=== Testing Strapi Field Types ===');
  
  const fieldTypes = ['text', 'email', 'number', 'url', 'select', 'multiselect'];
  
  fieldTypes.forEach(type => {
    const inputStyle = handler._getInputStyle(type);
    console.log(`Field type "${type}" -> Discord input style: ${inputStyle}`);
  });
}

function testCompleteMultiStepFlow() {
  console.log('\n=== Testing Complete Multi-Step Flow ===');
  
  // Simulate the complete flow
  console.log('1. Starting onboarding with Strapi data...');
  
  mockApiService.startOnboarding('fbo62u5e1atap7743v19jsgi', 'user123', 'testuser')
    .then(response => {
      console.log('2. API Response success:', response.success);
      console.log('3. Number of questions received:', response.data.questions.length);
      
      const questions = response.data.questions.filter(q => q.is_enabled);
      const stepGroups = handler.groupQuestionsByStep(questions);
      
      console.log('4. Number of steps:', stepGroups.size);
      console.log('5. Is multi-step flow:', stepGroups.size > 1);
      
      // Test each step
      for (const [stepNumber, stepQuestions] of stepGroups) {
        console.log(`6. Step ${stepNumber}:`);
        console.log(`   - Questions: ${stepQuestions.map(q => q.field_key).join(', ')}`);
        console.log(`   - Role IDs: ${[...new Set(stepQuestions.flatMap(q => q.step_role_ids || []))].join(', ')}`);
        
        // Simulate step responses
        const stepResponses = {};
        stepQuestions.forEach(q => {
          switch (q.field_key) {
            case 'full_name':
              stepResponses[q.field_key] = 'John Doe';
              break;
            case 'email_address':
              stepResponses[q.field_key] = 'john.doe@example.com';
              break;
            case 'interests':
              stepResponses[q.field_key] = 'Gaming, Tech, Music';
              break;
            case 'experience_level':
              stepResponses[q.field_key] = 'Intermediate';
              break;
            case 'community_role':
              stepResponses[q.field_key] = 'Helper';
              break;
          }
        });
        
        const errors = handler.validateStepResponses(stepResponses, stepQuestions);
        console.log(`   - Validation errors: ${errors.length === 0 ? 'None' : errors.join(', ')}`);
      }
    })
    .catch(error => {
      console.error('Error in complete flow test:', error);
    });
}

// Run all Strapi-specific tests
function runStrapiTests() {
  console.log('🧪 Enhanced Onboarding Handler - Strapi Integration Tests');
  console.log('========================================================');
  
  try {
    testStrapiValidationRules();
    testStrapiQuestionGrouping();
    testStrapiStepValidation();
    testStrapiFieldTypes();
    testCompleteMultiStepFlow();
    
    console.log('\n✅ All Strapi integration tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Strapi integration test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runStrapiTests();
}

module.exports = {
  testStrapiValidationRules,
  testStrapiQuestionGrouping,
  testStrapiStepValidation,
  testStrapiFieldTypes,
  testCompleteMultiStepFlow,
  runStrapiTests
};