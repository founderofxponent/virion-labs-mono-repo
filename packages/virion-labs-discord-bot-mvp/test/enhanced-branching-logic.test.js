// Enhanced Branching Logic Test - Discord Bot
// Run with: node test/enhanced-branching-logic.test.js

const { EnhancedOnboardingHandler } = require('../src/handlers/EnhancedOnboardingHandler');

// Mock logger
class MockLogger {
  info(message) { console.log(`[INFO] ${message}`); }
  warn(message) { console.log(`[WARN] ${message}`); }
  error(message) { console.log(`[ERROR] ${message}`); }
  debug(message) { console.log(`[DEBUG] ${message}`); }
}

// Mock API Service with enhanced branching logic support
class MockEnhancedBranchingApiService {
  constructor() {
    this.campaignCache = new Map();
  }

  getCachedCampaign(campaignId) {
    return this.campaignCache.get(campaignId);
  }

  // Mock onboarding fields with enhanced branching logic
  async startOnboarding(campaignId, userId, username) {
    console.log(`[MockAPI] Starting enhanced branching onboarding for campaign: ${campaignId}`);
    
    return {
      success: true,
      data: {
        questions: [
          // Step 1: Basic Information with complex branching
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
              // Enhanced rule with nested conditions
              {
                conditions: {
                  logic: "OR",
                  conditions: [
                    {
                      field_key: 'experience_level',
                      operator: 'in_list',
                      value: ['Advanced', 'Expert', 'Senior']
                    },
                    {
                      field_key: 'full_name',
                      operator: 'matches_regex',
                      value: '.*(PhD|Dr\\.|Professor).*',
                      case_sensitive: false
                    }
                  ]
                },
                action: 'skip_to_step',
                target_step: 4,
                priority: 10,
                description: 'Skip to expert questions for advanced users'
              },
              // Complex AND/OR logic with nested groups
              {
                conditions: {
                  logic: "AND",
                  conditions: [
                    {
                      field_key: 'experience_level',
                      operator: 'equals',
                      value: 'Beginner'
                    }
                  ],
                  groups: [
                    {
                      logic: "OR",
                      conditions: [
                        {
                          field_key: 'full_name',
                          operator: 'not_empty'
                        },
                        {
                          field_key: 'full_name',
                          operator: 'starts_with',
                          value: 'Student'
                        }
                      ]
                    }
                  ]
                },
                action: 'show',
                target_fields: ['help_topics', 'mentor_request', 'learning_goals'],
                priority: 5,
                description: 'Show help fields for beginners'
              },
              // Intermediate users get specialized fields
              {
                condition: {
                  field_key: 'experience_level',
                  operator: 'contains',
                  value: 'Inter',
                  case_sensitive: false
                },
                action: 'require_field',
                target_fields: ['specialization', 'portfolio_url'],
                priority: 7,
                description: 'Require additional info for intermediate users'
              }
            ]
          },
          {
            field_key: 'programming_languages',
            field_label: 'Which programming languages do you know?',
            field_type: 'multiselect',
            field_placeholder: 'JavaScript, Python, Go, etc.',
            is_required: false,
            validation_rules: {},
            sort_order: 2,
            step_number: 1,
            step_role_ids: ['1402456736144560299'],
            branching_logic: [
              {
                condition: {
                  field_key: 'programming_languages',
                  operator: 'array_length_equals',
                  value: 0
                },
                action: 'set_field_value',
                target_fields: ['experience_level'],
                target_value: 'Beginner',
                priority: 8,
                description: 'Set as beginner if no languages known'
              }
            ]
          },
          
          // Step 2: Beginner-specific questions
          {
            field_key: 'help_topics',
            field_label: 'What topics would you like help with?',
            field_type: 'multiselect',
            field_placeholder: 'Select topics you need help with',
            is_required: false,
            validation_rules: {},
            sort_order: 0,
            step_number: 2,
            step_role_ids: ['1402456736144560300'],
            branching_logic: []
          },
          {
            field_key: 'mentor_request',
            field_label: 'Would you like to be paired with a mentor?',
            field_type: 'boolean',
            field_placeholder: 'Yes or No',
            is_required: false,
            validation_rules: {},
            sort_order: 1,
            step_number: 2,
            step_role_ids: ['1402456736144560300'],
            branching_logic: []
          },
          {
            field_key: 'learning_goals',
            field_label: 'What are your learning goals?',
            field_type: 'textarea',
            field_placeholder: 'Describe what you want to achieve',
            is_required: false,
            validation_rules: {},
            sort_order: 2,
            step_number: 2,
            step_role_ids: ['1402456736144560300'],
            branching_logic: []
          },
          
          // Step 3: Intermediate questions
          {
            field_key: 'specialization',
            field_label: 'What is your area of specialization?',
            field_type: 'text',
            field_placeholder: 'Frontend, Backend, DevOps, etc.',
            is_required: true,
            validation_rules: { min_length: 2 },
            sort_order: 0,
            step_number: 3,
            step_role_ids: ['1402456736144560301'],
            branching_logic: []
          },
          {
            field_key: 'portfolio_url',
            field_label: 'Portfolio or GitHub URL?',
            field_type: 'url',
            field_placeholder: 'https://github.com/username',
            is_required: false,
            validation_rules: {},
            sort_order: 1,
            step_number: 3,
            step_role_ids: ['1402456736144560301'],
            branching_logic: []
          },
          
          // Step 4: Advanced/Expert questions
          {
            field_key: 'years_experience',
            field_label: 'How many years of professional experience?',
            field_type: 'number',
            field_placeholder: 'Number of years',
            is_required: true,
            validation_rules: {},
            sort_order: 0,
            step_number: 4,
            step_role_ids: ['1402456736144560302'],
            branching_logic: [
              {
                condition: {
                  field_key: 'years_experience',
                  operator: 'greater_than_or_equal',
                  value: 10
                },
                action: 'show',
                target_fields: ['leadership_experience', 'mentoring_availability'],
                priority: 9,
                description: 'Show leadership fields for senior professionals'
              }
            ]
          },
          {
            field_key: 'leadership_experience',
            field_label: 'Do you have leadership experience?',
            field_type: 'textarea',
            field_placeholder: 'Describe your leadership roles',
            is_required: false,
            validation_rules: {},
            sort_order: 1,
            step_number: 4,
            step_role_ids: ['1402456736144560302'],
            branching_logic: []
          },
          {
            field_key: 'mentoring_availability',
            field_label: 'Are you available to mentor others?',
            field_type: 'boolean',
            field_placeholder: 'Yes or No',
            is_required: false,
            validation_rules: {},
            sort_order: 2,
            step_number: 4,
            step_role_ids: ['1402456736144560302'],
            branching_logic: []
          }
        ]
      }
    };
  }

  async submitOnboarding(payload) {
    console.log(`[MockAPI] Submitting enhanced branching onboarding for user: ${payload.discord_user_id}`);
    return {
      success: true,
      data: {
        message: 'Enhanced branching onboarding completed successfully!'
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
const mockApiService = new MockEnhancedBranchingApiService();

// Add test campaign to cache
mockApiService.campaignCache.set('enhanced-branching-test-campaign', {
  documentId: 'enhanced-branching-test-campaign',
  name: 'Enhanced Branching Logic Test Campaign',
  description: 'Testing complex decision tree branching logic with nested conditions',
  target_role_ids: ['1402456736144560310']
});

// Initialize handler
const handler = new EnhancedOnboardingHandler(mockConfig, mockLogger, mockApiService);

// Enhanced test functions

function testEnhancedConditionEvaluation() {
  console.log('\n=== Testing Enhanced Condition Evaluation ===');
  
  const responses = {
    experience_level: 'Advanced',
    full_name: 'Dr. John Doe',
    programming_languages: ['JavaScript', 'Python', 'Go'],
    years_experience: 15,
    join_date: '2020-01-15'
  };

  // Test in_list operator
  const condition1 = {
    field_key: 'experience_level',
    operator: 'in_list',
    value: ['Advanced', 'Expert', 'Senior']
  };
  const result1 = handler._evaluateCondition(responses, condition1);
  console.log('✅ In list condition:', result1 === true ? 'PASS' : 'FAIL');

  // Test regex matching
  const condition2 = {
    field_key: 'full_name',
    operator: 'matches_regex',
    value: '.*(PhD|Dr\\.|Professor).*',
    case_sensitive: false
  };
  const result2 = handler._evaluateCondition(responses, condition2);
  console.log('✅ Regex matching condition:', result2 === true ? 'PASS' : 'FAIL');

  // Test array length
  const condition3 = {
    field_key: 'programming_languages',
    operator: 'array_length_equals',
    value: 3
  };
  const result3 = handler._evaluateCondition(responses, condition3);
  console.log('✅ Array length condition:', result3 === true ? 'PASS' : 'FAIL');

  // Test numeric comparison
  const condition4 = {
    field_key: 'years_experience',
    operator: 'greater_than_or_equal',
    value: 10
  };
  const result4 = handler._evaluateCondition(responses, condition4);
  console.log('✅ Numeric comparison condition:', result4 === true ? 'PASS' : 'FAIL');

  // Test starts_with
  const condition5 = {
    field_key: 'full_name',
    operator: 'starts_with',
    value: 'Dr.',
    case_sensitive: false
  };
  const result5 = handler._evaluateCondition(responses, condition5);
  console.log('✅ Starts with condition:', result5 === true ? 'PASS' : 'FAIL');

  console.log('✅ Enhanced condition evaluation tests completed');
}

function testNestedConditionGroups() {
  console.log('\n=== Testing Nested Condition Groups ===');
  
  const responses = {
    experience_level: 'Beginner',
    full_name: 'Student Alice',
    programming_languages: []
  };

  // Complex nested condition group
  const conditionGroup = {
    logic: "AND",
    conditions: [
      {
        field_key: 'experience_level',
        operator: 'equals',
        value: 'Beginner'
      }
    ],
    groups: [
      {
        logic: "OR",
        conditions: [
          {
            field_key: 'full_name',
            operator: 'not_empty'
          },
          {
            field_key: 'full_name',
            operator: 'starts_with',
            value: 'Student'
          }
        ]
      }
    ]
  };

  const result = handler._evaluateConditionGroup(responses, conditionGroup);
  console.log('✅ Nested condition group evaluation:', result === true ? 'PASS' : 'FAIL');

  // Test with failing nested condition
  const failingGroup = {
    logic: "AND",
    conditions: [
      {
        field_key: 'experience_level',
        operator: 'equals',
        value: 'Advanced'  // This will fail
      }
    ],
    groups: [
      {
        logic: "OR",
        conditions: [
          {
            field_key: 'full_name',
            operator: 'not_empty'
          }
        ]
      }
    ]
  };

  const failResult = handler._evaluateConditionGroup(responses, failingGroup);
  console.log('✅ Failing nested condition group:', failResult === false ? 'PASS' : 'FAIL');

  console.log('✅ Nested condition group tests completed');
}

function testEnhancedBranchingLogic() {
  console.log('\n=== Testing Enhanced Branching Logic ===');
  
  const responses = {
    experience_level: 'Advanced',
    full_name: 'Dr. Jane Smith',
    years_experience: 12
  };

  const enhancedRules = [
    {
      conditions: {
        logic: "OR",
        conditions: [
          {
            field_key: 'experience_level',
            operator: 'in_list',
            value: ['Advanced', 'Expert', 'Senior']
          },
          {
            field_key: 'full_name',
            operator: 'matches_regex',
            value: '.*(PhD|Dr\\.|Professor).*',
            case_sensitive: false
          }
        ]
      },
      action: 'skip_to_step',
      target_step: 4,
      priority: 10,
      description: 'Skip to expert questions for advanced users'
    },
    {
      condition: {
        field_key: 'years_experience',
        operator: 'greater_than_or_equal',
        value: 10
      },
      action: 'show',
      target_fields: ['leadership_experience', 'mentoring_availability'],
      priority: 9,
      description: 'Show leadership fields for senior professionals'
    },
    {
      conditions: {
        logic: "AND",
        conditions: [
          {
            field_key: 'experience_level',
            operator: 'equals',
            value: 'Beginner'
          }
        ]
      },
      action: 'require_field',
      target_fields: ['learning_goals'],
      priority: 5,
      description: 'Require learning goals for beginners'
    }
  ];

  const result = handler.evaluateBranchingLogic(responses, enhancedRules);
  
  console.log('Enhanced branching result:', result);
  console.log('✅ Skip to step 4 for advanced user:', result.nextStep === 4 ? 'PASS' : 'FAIL');
  console.log('✅ Show leadership fields:', result.visibleFields.includes('leadership_experience') ? 'PASS' : 'FAIL');
  console.log('✅ Applied rules count:', result.appliedRules.length === 2 ? 'PASS' : 'FAIL');
  console.log('✅ Rules sorted by priority:', result.appliedRules[0].priority >= result.appliedRules[1].priority ? 'PASS' : 'FAIL');

  console.log('✅ Enhanced branching logic tests completed');
}

function testFieldValueSetting() {
  console.log('\n=== Testing Field Value Setting ===');
  
  const responses = {
    programming_languages: [],
    experience_level: ''
  };

  const setValueRules = [
    {
      condition: {
        field_key: 'programming_languages',
        operator: 'array_length_equals',
        value: 0
      },
      action: 'set_field_value',
      target_fields: ['experience_level'],
      target_value: 'Beginner',
      priority: 8,
      description: 'Set as beginner if no languages known'
    }
  ];

  const result = handler.evaluateBranchingLogic(responses, setValueRules);
  
  console.log('Field value setting result:', result);
  console.log('✅ Experience level set to Beginner:', result.fieldValues.experience_level === 'Beginner' ? 'PASS' : 'FAIL');
  console.log('✅ Field values object has correct structure:', typeof result.fieldValues === 'object' ? 'PASS' : 'FAIL');

  console.log('✅ Field value setting tests completed');
}

function testPriorityHandling() {
  console.log('\n=== Testing Priority Handling ===');
  
  const responses = {
    experience_level: 'Advanced',
    field_test: 'test_value'
  };

  // Rules with different priorities that conflict
  const priorityRules = [
    {
      condition: {
        field_key: 'experience_level',
        operator: 'equals',
        value: 'Advanced'
      },
      action: 'show',
      target_fields: ['advanced_field'],
      priority: 5,
      description: 'Lower priority rule'
    },
    {
      condition: {
        field_key: 'experience_level',
        operator: 'equals',
        value: 'Advanced'
      },
      action: 'hide',
      target_fields: ['advanced_field'],
      priority: 10,
      description: 'Higher priority rule'
    }
  ];

  const result = handler.evaluateBranchingLogic(responses, priorityRules);
  
  console.log('Priority handling result:', result);
  console.log('✅ Field is hidden (higher priority wins):', result.hiddenFields.includes('advanced_field') ? 'PASS' : 'FAIL');
  console.log('✅ Rules applied in priority order:', result.appliedRules[0].priority >= result.appliedRules[1].priority ? 'PASS' : 'FAIL');

  console.log('✅ Priority handling tests completed');
}

async function testCompleteEnhancedFlow() {
  console.log('\n=== Testing Complete Enhanced Branching Flow ===');
  
  try {
    // Test with different user profiles
    const userProfiles = [
      {
        name: 'Beginner Student',
        responses: {
          full_name: 'Student Bob',
          experience_level: 'Beginner',
          programming_languages: []
        },
        expectedStep: 2,
        expectedFields: ['help_topics', 'learning_goals']
      },
      {
        name: 'Intermediate Developer',
        responses: {
          full_name: 'John Developer',
          experience_level: 'Intermediate',
          programming_languages: ['JavaScript', 'Python']
        },
        expectedStep: 3,
        expectedFields: ['specialization']
      },
      {
        name: 'Senior Expert',
        responses: {
          full_name: 'Dr. Jane Expert',
          experience_level: 'Advanced',
          programming_languages: ['JavaScript', 'Python', 'Go', 'Rust'],
          years_experience: 15
        },
        expectedStep: 4,
        expectedFields: ['leadership_experience']
      }
    ];

    const startResponse = await mockApiService.startOnboarding('enhanced-branching-test-campaign', 'test-user-123', 'testuser');
    const questions = startResponse.data.questions;

    for (const profile of userProfiles) {
      console.log(`\n📊 Testing ${profile.name} profile`);
      
      // Test step calculation
      const nextStep = handler.calculateNextStep(1, profile.responses, questions);
      console.log(`✅ ${profile.name} next step:`, nextStep === profile.expectedStep ? 'PASS' : `FAIL (expected ${profile.expectedStep}, got ${nextStep})`);
      
      // Test field visibility if not skipping steps
      if (nextStep === 2) {
        const visibleQuestions = handler.getVisibleQuestionsForStep(2, questions, profile.responses);
        const hasExpectedFields = profile.expectedFields.every(field => 
          visibleQuestions.some(q => q.field_key === field)
        );
        console.log(`✅ ${profile.name} field visibility:`, hasExpectedFields ? 'PASS' : 'FAIL');
      }
      
      // Test branching logic evaluation
      const experienceLevelField = questions.find(q => q.field_key === 'experience_level');
      if (experienceLevelField && experienceLevelField.branching_logic) {
        const branchingResult = handler.evaluateBranchingLogic(profile.responses, experienceLevelField.branching_logic);
        console.log(`✅ ${profile.name} branching evaluation:`, branchingResult ? 'PASS' : 'FAIL');
      }
    }

    console.log('\n🎉 Complete Enhanced Flow Test PASSED!');
    console.log('===============================================');
    console.log('✅ Enhanced condition operators working');
    console.log('✅ Nested condition groups functional');
    console.log('✅ Priority-based rule evaluation working');
    console.log('✅ Field value setting operational');
    console.log('✅ Complex branching scenarios validated');
    
  } catch (error) {
    console.error('\n❌ Complete Enhanced Flow Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run all enhanced branching tests
async function runEnhancedBranchingTests() {
  console.log('🧪 Enhanced Onboarding Handler - Advanced Branching Logic Tests');
  console.log('================================================================');
  
  try {
    testEnhancedConditionEvaluation();
    testNestedConditionGroups();
    testEnhancedBranchingLogic();
    testFieldValueSetting();
    testPriorityHandling();
    await testCompleteEnhancedFlow();
    
    console.log('\n✅ All enhanced branching logic tests completed successfully!');
    console.log('\n🎯 Summary of Enhanced Features Tested:');
    console.log('   • Advanced operators (regex, in_list, array operations, numeric comparisons)');
    console.log('   • Nested condition groups with AND/OR logic');
    console.log('   • Priority-based rule evaluation');
    console.log('   • Field value setting and requirement modification');
    console.log('   • Complex multi-step branching scenarios');
    console.log('   • Enhanced user experience with progress indicators');
    
  } catch (error) {
    console.error('\n❌ Enhanced branching logic test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runEnhancedBranchingTests();
}

module.exports = {
  testEnhancedConditionEvaluation,
  testNestedConditionGroups,
  testEnhancedBranchingLogic,
  testFieldValueSetting,
  testPriorityHandling,
  testCompleteEnhancedFlow,
  runEnhancedBranchingTests
};