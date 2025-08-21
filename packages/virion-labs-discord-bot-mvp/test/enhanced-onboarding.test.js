// Test script for Enhanced Onboarding Handler
// Run with: node test/enhanced-onboarding.test.js

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
            field_key: 'username',
            field_label: 'Your Username',
            field_type: 'text',
            is_required: true,
            validation_rules: [
              { type: 'required', value: true, message: 'Username is required' },
              { type: 'min', value: 3, message: 'Username must be at least 3 characters' },
              { type: 'max', value: 20, message: 'Username must be less than 20 characters' }
            ],
            discord_integration: {
              step_number: 1,
              component_type: 'text_input'
            }
          },
          {
            field_key: 'email',
            field_label: 'Email Address',
            field_type: 'email',
            is_required: true,
            validation_rules: [
              { type: 'required', value: true },
              { type: 'email', value: true }
            ],
            discord_integration: {
              step_number: 1,
              component_type: 'text_input'
            }
          },
          {
            field_key: 'user_type',
            field_label: 'What type of user are you?',
            field_type: 'select',
            field_options: ['Content Creator', 'Brand Representative', 'Agency'],
            is_required: true,
            validation_rules: [
              { type: 'required', value: true }
            ],
            branching_logic: [
              {
                condition: {
                  field_key: 'user_type',
                  operator: 'equals',
                  value: 'Content Creator'
                },
                action: 'show',
                target_fields: ['social_platforms', 'follower_count']
              }
            ],
            discord_integration: {
              step_number: 2,
              component_type: 'select_menu'
            }
          },
          {
            field_key: 'social_platforms',
            field_label: 'Which social platforms do you use?',
            field_type: 'multiselect',
            field_options: ['YouTube', 'TikTok', 'Instagram', 'Twitter', 'Twitch'],
            is_required: true,
            validation_rules: [
              { type: 'required', value: true }
            ],
            discord_integration: {
              step_number: 3,
              component_type: 'text_input'
            }
          }
        ]
      }
    };
  }

  async submitOnboarding(payload) {
    return {
      success: true,
      data: {
        message: 'Onboarding completed successfully!'
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
mockApiService.campaignCache.set('test_campaign_123', {
  id: 'test_campaign_123',
  name: 'Test Campaign',
  description: 'A test campaign for validation',
  target_role_ids: ['role_123', 'role_456']
});

// Initialize handler
const handler = new EnhancedOnboardingHandler(mockConfig, mockLogger, mockApiService);

// Test functions
function testValidation() {
  console.log('\n=== Testing Validation ===');
  
  // Test required validation
  const requiredRule = { type: 'required', value: true, message: 'This field is required' };
  console.log('Required validation (empty):', handler.validateFieldResponse('', [requiredRule]));
  console.log('Required validation (filled):', handler.validateFieldResponse('test', [requiredRule]));
  
  // Test email validation
  const emailRule = { type: 'email', value: true };
  console.log('Email validation (invalid):', handler.validateFieldResponse('invalid-email', [emailRule]));
  console.log('Email validation (valid):', handler.validateFieldResponse('test@example.com', [emailRule]));
  
  // Test min/max length
  const minRule = { type: 'min', value: 5, message: 'Minimum 5 characters' };
  const maxRule = { type: 'max', value: 10, message: 'Maximum 10 characters' };
  console.log('Min length validation (too short):', handler.validateFieldResponse('hi', [minRule]));
  console.log('Min length validation (valid):', handler.validateFieldResponse('hello', [minRule]));
  console.log('Max length validation (too long):', handler.validateFieldResponse('this is way too long', [maxRule]));
  console.log('Max length validation (valid):', handler.validateFieldResponse('short', [maxRule]));
  
  // Test contains validation
  const containsRule = { type: 'contains', value: 'test', case_sensitive: false };
  console.log('Contains validation (missing):', handler.validateFieldResponse('hello world', [containsRule]));
  console.log('Contains validation (found):', handler.validateFieldResponse('this is a test message', [containsRule]));
  
  // Test numeric validation
  const numericRule = { type: 'numeric', value: true };
  console.log('Numeric validation (invalid):', handler.validateFieldResponse('not a number', [numericRule]));
  console.log('Numeric validation (valid):', handler.validateFieldResponse('123', [numericRule]));
  
  // Test greater than validation
  const greaterThanRule = { type: 'greater_than', value: 10 };
  console.log('Greater than validation (too small):', handler.validateFieldResponse('5', [greaterThanRule]));
  console.log('Greater than validation (valid):', handler.validateFieldResponse('15', [greaterThanRule]));
}

function testBranchingLogic() {
  console.log('\n=== Testing Branching Logic ===');
  
  // Test equals condition
  const equalsCondition = {
    field_key: 'user_type',
    operator: 'equals',
    value: 'Content Creator',
    case_sensitive: false
  };
  
  console.log('Equals condition (match):', handler._evaluateCondition({
    user_type: 'Content Creator'
  }, equalsCondition));
  
  console.log('Equals condition (no match):', handler._evaluateCondition({
    user_type: 'Brand Representative'
  }, equalsCondition));
  
  // Test contains condition
  const containsCondition = {
    field_key: 'interests',
    operator: 'contains',
    value: 'gaming',
    case_sensitive: false
  };
  
  console.log('Contains condition (match):', handler._evaluateCondition({
    interests: 'I love gaming and streaming'
  }, containsCondition));
  
  console.log('Contains condition (no match):', handler._evaluateCondition({
    interests: 'I enjoy cooking and reading'
  }, containsCondition));
  
  // Test greater than condition
  const greaterThanCondition = {
    field_key: 'age',
    operator: 'greater_than',
    value: 18
  };
  
  console.log('Greater than condition (valid):', handler._evaluateCondition({
    age: '25'
  }, greaterThanCondition));
  
  console.log('Greater than condition (invalid):', handler._evaluateCondition({
    age: '16'
  }, greaterThanCondition));
  
  // Test empty condition
  const emptyCondition = {
    field_key: 'optional_field',
    operator: 'empty',
    value: ''
  };
  
  console.log('Empty condition (empty):', handler._evaluateCondition({
    optional_field: ''
  }, emptyCondition));
  
  console.log('Empty condition (not empty):', handler._evaluateCondition({
    optional_field: 'some value'
  }, emptyCondition));
}

function testQuestionGrouping() {
  console.log('\n=== Testing Question Grouping ===');
  
  const questions = [
    { field_key: 'q1', step_number: 1 },
    { field_key: 'q2', step_number: 1 },
    { field_key: 'q3', step_number: 2 },
    { field_key: 'q4', step_number: 2 },
    { field_key: 'q5', step_number: 3 }
  ];
  
  const grouped = handler.groupQuestionsByStep(questions);
  console.log('Grouped questions:');
  for (const [step, stepQuestions] of grouped) {
    console.log(`  Step ${step}: ${stepQuestions.map(q => q.field_key).join(', ')}`);
  }
}

function testStepCalculation() {
  console.log('\n=== Testing Step Calculation ===');
  
  const questions = [
    {
      field_key: 'user_type',
      step_number: 1,
      branching_logic: [
        {
          condition: {
            field_key: 'user_type',
            operator: 'equals',
            value: 'Content Creator'
          },
          action: 'skip_to_step',
          target_step: 3
        }
      ]
    },
    { field_key: 'brand_info', step_number: 2 },
    { field_key: 'creator_info', step_number: 3 }
  ];
  
  // Test normal progression
  const nextStep1 = handler.calculateNextStep(1, { user_type: 'Brand Representative' }, questions);
  console.log('Next step (normal progression):', nextStep1);
  
  // Test skip logic
  const nextStep2 = handler.calculateNextStep(1, { user_type: 'Content Creator' }, questions);
  console.log('Next step (skip logic):', nextStep2);
  
  // Test end of flow
  const nextStep3 = handler.calculateNextStep(3, { user_type: 'Content Creator' }, questions);
  console.log('Next step (end of flow):', nextStep3);
}

function testComplexValidation() {
  console.log('\n=== Testing Complex Validation ===');
  
  const complexRules = [
    { type: 'required', value: true },
    { type: 'min', value: 8 },
    { type: 'contains', value: '@', case_sensitive: false },
    { type: 'contains', value: '.', case_sensitive: false }
  ];
  
  console.log('Complex validation (invalid - empty):', handler.validateFieldResponse('', complexRules));
  console.log('Complex validation (invalid - too short):', handler.validateFieldResponse('test', complexRules));
  console.log('Complex validation (invalid - missing @):', handler.validateFieldResponse('testtest.com', complexRules));
  console.log('Complex validation (invalid - missing .):', handler.validateFieldResponse('test@testcom', complexRules));
  console.log('Complex validation (valid):', handler.validateFieldResponse('test@test.com', complexRules));
}

// Run all tests
function runAllTests() {
  console.log('🧪 Enhanced Onboarding Handler Tests');
  console.log('=====================================');
  
  try {
    testValidation();
    testBranchingLogic();
    testQuestionGrouping();
    testStepCalculation();
    testComplexValidation();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testValidation,
  testBranchingLogic,
  testQuestionGrouping,
  testStepCalculation,
  testComplexValidation,
  runAllTests
};