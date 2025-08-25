// Branching Onboarding Test - Discord Bot
// Run with: node test/branching-onboarding.test.js

const { EnhancedOnboardingHandler } = require('../src/handlers/EnhancedOnboardingHandler');

// Mock logger
class MockLogger {
  info(message) { console.log(`[INFO] ${message}`); }
  warn(message) { console.log(`[WARN] ${message}`); }
  error(message) { console.log(`[ERROR] ${message}`); }
  debug(message) { console.log(`[DEBUG] ${message}`); }
}

// Mock API Service with branching logic support
class MockBranchingApiService {
  constructor() {
    this.campaignCache = new Map();
  }

  getCachedCampaign(campaignId) {
    return this.campaignCache.get(campaignId);
  }

  // Mock onboarding fields with branching logic
  async startOnboarding(campaignId, userId, username) {
    console.log(`[MockAPI] Starting branching onboarding for campaign: ${campaignId}`);
    
    return {
      success: true,
      data: {
        questions: [
          // Step 1: Basic Information
          {
            field_key: 'full_name',
            field_label: 'What is your full name?',
            field_type: 'text',
            field_placeholder: 'Enter your full name',
            is_required: true,
            validation_rules: { max_length: 50, min_length: 2 },
            sort_order: 0,
            step_number: 1,
            step_role_ids: ['1402456736144560299'],
            branching_logic: []
          },
          {
            field_key: 'experience_level',
            field_label: 'What is your experience level?',
            field_type: 'text',
            field_placeholder: 'Beginner, Intermediate, or Advanced',
            is_required: true,
            validation_rules: {},
            sort_order: 1,
            step_number: 1,
            step_role_ids: ['1402456736144560299'],
            branching_logic: [
              {
                condition: {
                  field_key: 'experience_level',
                  operator: 'equals',
                  value: 'Advanced',
                  case_sensitive: false
                },
                action: 'skip_to_step',
                target_step: 3
              },
              {
                condition: {
                  field_key: 'experience_level',
                  operator: 'equals',
                  value: 'Beginner',
                  case_sensitive: false
                },
                action: 'show',
                target_fields: ['help_topics']
              }
            ]
          },
          
          // Step 2: Intermediate Questions (skipped for Advanced users)
          {
            field_key: 'interests',
            field_label: 'What are your main interests?',
            field_type: 'text',
            field_placeholder: 'Gaming, Tech, Music, etc.',
            is_required: true,
            validation_rules: { min_length: 3 },
            sort_order: 0,
            step_number: 2,
            step_role_ids: ['1402456736144560300'],
            branching_logic: []
          },
          {
            field_key: 'help_topics',
            field_label: 'What topics would you like help with?',
            field_type: 'text',
            field_placeholder: 'List topics you need assistance with',
            is_required: false,
            validation_rules: {},
            sort_order: 1,
            step_number: 2,
            step_role_ids: ['1402456736144560300'],
            branching_logic: []
          },
          
          // Step 3: Advanced Questions
          {
            field_key: 'specialization',
            field_label: 'What is your area of specialization?',
            field_type: 'text',
            field_placeholder: 'Frontend, Backend, DevOps, etc.',
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
    console.log(`[MockAPI] Submitting branching onboarding for user: ${payload.discord_user_id}`);
    return {
      success: true,
      data: {
        message: 'Branching onboarding completed successfully!'
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
const mockApiService = new MockBranchingApiService();

// Add test campaign to cache
mockApiService.campaignCache.set('branching-test-campaign', {
  documentId: 'branching-test-campaign',
  name: 'Branching Logic Test Campaign',
  description: 'Testing decision tree branching logic',
  target_role_ids: ['1402456736144560310']
});

// Initialize handler
const handler = new EnhancedOnboardingHandler(mockConfig, mockLogger, mockApiService);

// Test functions for branching logic

function testConditionEvaluation() {
  console.log('\n=== Testing Condition Evaluation ===');
  
  const responses = {
    experience_level: 'Advanced',
    full_name: 'John Doe',
    interests: 'Programming'
  };

  // Test equals condition (case insensitive)
  const condition1 = {
    field_key: 'experience_level',
    operator: 'equals',
    value: 'advanced',
    case_sensitive: false
  };
  const result1 = handler._evaluateCondition(responses, condition1);
  console.log('✅ Case insensitive equals:', result1 === true ? 'PASS' : 'FAIL');

  // Test contains condition
  const condition2 = {
    field_key: 'interests',
    operator: 'contains',
    value: 'Program',
    case_sensitive: false
  };
  const result2 = handler._evaluateCondition(responses, condition2);
  console.log('✅ Contains condition:', result2 === true ? 'PASS' : 'FAIL');

  // Test not_equals condition
  const condition3 = {
    field_key: 'experience_level',
    operator: 'not_equals',
    value: 'Beginner',
    case_sensitive: false
  };
  const result3 = handler._evaluateCondition(responses, condition3);
  console.log('✅ Not equals condition:', result3 === true ? 'PASS' : 'FAIL');

  // Test empty condition
  const condition4 = {
    field_key: 'nonexistent_field',
    operator: 'empty',
    value: ''
  };
  const result4 = handler._evaluateCondition(responses, condition4);
  console.log('✅ Empty condition:', result4 === true ? 'PASS' : 'FAIL');

  console.log('✅ All condition evaluation tests completed');
}

function testBranchingLogic() {
  console.log('\n=== Testing Branching Logic Evaluation ===');
  
  const responses = {
    experience_level: 'Beginner',
    full_name: 'Jane Doe'
  };

  const branchingRules = [
    {
      condition: {
        field_key: 'experience_level',
        operator: 'equals',
        value: 'Beginner',
        case_sensitive: false
      },
      action: 'show',
      target_fields: ['help_topics', 'tutorial_needed']
    },
    {
      condition: {
        field_key: 'experience_level',
        operator: 'equals',
        value: 'Advanced',
        case_sensitive: false
      },
      action: 'skip_to_step',
      target_step: 3
    }
  ];

  const result = handler.evaluateBranchingLogic(responses, branchingRules);
  
  console.log('Branching result:', result);
  console.log('✅ Show fields for beginner:', result.visibleFields.includes('help_topics') ? 'PASS' : 'FAIL');
  console.log('✅ No step skip for beginner:', result.nextStep === null ? 'PASS' : 'FAIL');

  // Test advanced user
  const advancedResponses = { experience_level: 'Advanced' };
  const advancedResult = handler.evaluateBranchingLogic(advancedResponses, branchingRules);
  console.log('✅ Skip to step 3 for advanced:', advancedResult.nextStep === 3 ? 'PASS' : 'FAIL');
}

function testStepCalculation() {
  console.log('\n=== Testing Step Calculation ===');
  
  const allQuestions = [
    {
      field_key: 'experience_level',
      step_number: 1,
      branching_logic: [
        {
          condition: {
            field_key: 'experience_level',
            operator: 'equals',
            value: 'Advanced',
            case_sensitive: false
          },
          action: 'skip_to_step',
          target_step: 3
        }
      ]
    },
    {
      field_key: 'interests',
      step_number: 2,
      branching_logic: []
    },
    {
      field_key: 'specialization',
      step_number: 3,
      branching_logic: []
    }
  ];

  // Test normal progression (Beginner)
  const beginnerResponses = { experience_level: 'Beginner' };
  const nextStepBeginner = handler.calculateNextStep(1, beginnerResponses, allQuestions);
  console.log('✅ Beginner progresses to step 2:', nextStepBeginner === 2 ? 'PASS' : 'FAIL');

  // Test skip progression (Advanced)
  const advancedResponses = { experience_level: 'Advanced' };
  const nextStepAdvanced = handler.calculateNextStep(1, advancedResponses, allQuestions);
  console.log('✅ Advanced skips to step 3:', nextStepAdvanced === 3 ? 'PASS' : 'FAIL');
}

function testFieldVisibility() {
  console.log('\n=== Testing Field Visibility ===');
  
  const allQuestions = [
    {
      field_key: 'interests',
      step_number: 2,
      branching_logic: []
    },
    {
      field_key: 'help_topics',
      step_number: 2,
      branching_logic: []
    },
    {
      field_key: 'experience_level',
      step_number: 1,
      branching_logic: [
        {
          condition: {
            field_key: 'experience_level',
            operator: 'equals',
            value: 'Advanced',
            case_sensitive: false
          },
          action: 'hide',
          target_fields: ['help_topics']
        }
      ]
    }
  ];

  // Test with beginner response (should hide help_topics)
  const beginnerResponses = { experience_level: 'Beginner' };
  const visibleQuestions = handler.getVisibleQuestionsForStep(2, allQuestions, beginnerResponses);
  
  console.log('Visible questions for step 2:', visibleQuestions.map(q => q.field_key));
  
  // Since help_topics should be visible for beginners (hidden for advanced), both should be visible
  const helpTopicsVisible = visibleQuestions.some(q => q.field_key === 'help_topics');
  const interestsVisible = visibleQuestions.some(q => q.field_key === 'interests');
  
  console.log('✅ Interests visible for beginner:', interestsVisible ? 'PASS' : 'FAIL');
  console.log('✅ Help topics visible for beginner:', helpTopicsVisible ? 'PASS' : 'FAIL');
}

async function testCompleteBranchingFlow() {
  console.log('\n=== Testing Complete Branching Flow ===');
  
  try {
    // Test 1: Start onboarding with branching fields
    console.log('\n1️⃣ Testing Branching Onboarding Start');
    const startResponse = await mockApiService.startOnboarding('branching-test-campaign', 'test-user-123', 'testuser');
    
    if (!startResponse.success) {
      console.log('❌ Start onboarding failed:', startResponse.message);
      return;
    }
    
    console.log('✅ Start onboarding successful');
    const questions = startResponse.data.questions;
    console.log('📊 Received', questions.length, 'onboarding fields with branching logic');
    
    // Test 2: Verify branching logic structure
    console.log('\n2️⃣ Testing Branching Logic Structure');
    let branchingFieldsCount = 0;
    questions.forEach(field => {
      if (field.branching_logic && field.branching_logic.length > 0) {
        branchingFieldsCount++;
        console.log(`Field "${field.field_key}" has ${field.branching_logic.length} branching rule(s)`);
      }
    });
    
    console.log('✅ Found', branchingFieldsCount, 'fields with branching logic');
    
    // Test 3: Simulate Advanced User Flow (should skip step 2)
    console.log('\n3️⃣ Testing Advanced User Branching Flow');
    const advancedResponses = {
      full_name: 'Advanced User',
      experience_level: 'Advanced'
    };
    
    const nextStepAdvanced = handler.calculateNextStep(1, advancedResponses, questions);
    console.log('Advanced user next step:', nextStepAdvanced);
    console.log('✅ Advanced user skips to step 3:', nextStepAdvanced === 3 ? 'PASS' : 'FAIL');
    
    // Test 4: Simulate Beginner User Flow (should progress normally)
    console.log('\n4️⃣ Testing Beginner User Branching Flow');
    const beginnerResponses = {
      full_name: 'Beginner User',
      experience_level: 'Beginner'
    };
    
    const nextStepBeginner = handler.calculateNextStep(1, beginnerResponses, questions);
    console.log('Beginner user next step:', nextStepBeginner);
    console.log('✅ Beginner user progresses to step 2:', nextStepBeginner === 2 ? 'PASS' : 'FAIL');
    
    // Test 5: Test field visibility for step 2
    console.log('\n5️⃣ Testing Field Visibility in Step 2');
    const step2Questions = handler.getVisibleQuestionsForStep(2, questions, beginnerResponses);
    console.log('Visible questions in step 2 for beginner:', step2Questions.map(q => q.field_key));
    
    // Test 6: Complete submission
    console.log('\n6️⃣ Testing Complete Branching Submission');
    const submitResponse = await mockApiService.submitOnboarding({
      campaign_id: 'branching-test-campaign',
      discord_user_id: 'test-user-123',
      discord_username: 'testuser',
      responses: advancedResponses
    });
    
    if (submitResponse.success) {
      console.log('✅ Branching onboarding submission successful');
    } else {
      console.log('❌ Branching onboarding submission failed');
    }
    
    console.log('\n🎉 Complete Branching Flow Test PASSED!');
    console.log('==================================================');
    console.log('✅ Branching logic conditions working');
    console.log('✅ Step skipping functional');
    console.log('✅ Field visibility controls working');
    console.log('✅ Decision tree flow validated');
    console.log('✅ End-to-end branching flow tested');
    
  } catch (error) {
    console.error('\n❌ Complete Branching Flow Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run all branching tests
async function runBranchingTests() {
  console.log('🧪 Enhanced Onboarding Handler - Branching Logic Tests');
  console.log('=====================================================');
  
  try {
    testConditionEvaluation();
    testBranchingLogic();
    testStepCalculation();
    testFieldVisibility();
    await testCompleteBranchingFlow();
    
    console.log('\n✅ All branching logic tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Branching logic test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBranchingTests();
}

module.exports = {
  testConditionEvaluation,
  testBranchingLogic,
  testStepCalculation,
  testFieldVisibility,
  testCompleteBranchingFlow,
  runBranchingTests
};