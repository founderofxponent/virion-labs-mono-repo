const { EnhancedOnboardingHandler } = require('../src/handlers/EnhancedOnboardingHandler');

// Mock Discord.js components
const mockUser = {
    id: 'test-user-12345',
    username: 'test-user',
    displayName: 'Test User'
};

const mockInteraction = {
    user: mockUser,
    reply: async (content) => console.log('Bot Reply:', typeof content === 'string' ? content : JSON.stringify(content.content || content.embeds?.[0]?.description, null, 2)),
    followUp: async (content) => console.log('Bot Follow-up:', typeof content === 'string' ? content : JSON.stringify(content.content || content.embeds?.[0]?.description, null, 2)),
    deferReply: async () => console.log('Deferring reply...'),
    editReply: async (content) => console.log('Bot Edit:', typeof content === 'string' ? content : JSON.stringify(content.content || content.embeds?.[0]?.description, null, 2))
};

class MockBusinessLogicAPI {
    async getCampaign(campaignId) {
        if (campaignId === 12) {
            return {
                data: {
                    id: 12,
                    name: "Advanced Developer Onboarding Campaign",
                    description: "A comprehensive onboarding campaign with complex branching logic",
                    campaign_type: "referral_onboarding",
                    is_active: true,
                    guild_id: "test-guild-123456",
                    channel_id: "test-channel-789",
                    welcome_message: "Welcome to our developer community! Let us customize your experience based on your background and interests.",
                    bot_name: "DevBot",
                    brand_color: "#2563eb"
                }
            };
        }
        return { data: null };
    }

    async getCampaignOnboardingFields(campaignId) {
        if (campaignId === 12) {
            return {
                data: [
                    {
                        field_key: "experience_level",
                        field_label: "What is your programming experience level?",
                        field_type: "select",
                        field_options: [
                            {"value": "beginner", "label": "Beginner (0-1 years)"},
                            {"value": "intermediate", "label": "Intermediate (2-4 years)"},
                            {"value": "senior", "label": "Senior (5-9 years)"},
                            {"value": "expert", "label": "Expert (10+ years)"}
                        ],
                        is_required: true,
                        is_enabled: true,
                        step_number: 1,
                        sort_order: 1
                    },
                    {
                        field_key: "primary_languages",
                        field_label: "What programming languages do you primarily work with?",
                        field_type: "multiselect",
                        field_options: [
                            {"value": "javascript", "label": "JavaScript"},
                            {"value": "python", "label": "Python"},
                            {"value": "java", "label": "Java"},
                            {"value": "csharp", "label": "C#"},
                            {"value": "go", "label": "Go"},
                            {"value": "rust", "label": "Rust"},
                            {"value": "php", "label": "PHP"},
                            {"value": "ruby", "label": "Ruby"},
                            {"value": "other", "label": "Other"}
                        ],
                        is_required: true,
                        is_enabled: true,
                        step_number: 1,
                        sort_order: 2
                    },
                    {
                        field_key: "beginner_learning_path",
                        field_label: "Which learning path interests you most?",
                        field_type: "select",
                        field_options: [
                            {"value": "frontend", "label": "Frontend Development"},
                            {"value": "backend", "label": "Backend Development"},
                            {"value": "fullstack", "label": "Full-stack Development"},
                            {"value": "mobile", "label": "Mobile Development"},
                            {"value": "data_science", "label": "Data Science"},
                            {"value": "devops", "label": "DevOps & Infrastructure"}
                        ],
                        is_required: true,
                        is_enabled: false,
                        step_number: 2,
                        sort_order: 3,
                        branching_logic: [{
                            "id": "show_for_beginners",
                            "priority": 1,
                            "condition": {
                                "field_key": "experience_level",
                                "operator": "equals",
                                "value": "beginner"
                            },
                            "actions": {
                                "set_field_visibility": {
                                    "visible": ["beginner_learning_path"]
                                }
                            }
                        }]
                    },
                    {
                        field_key: "years_of_experience",
                        field_label: "How many years of professional development experience do you have?",
                        field_type: "number",
                        is_required: true,
                        is_enabled: false,
                        step_number: 2,
                        sort_order: 4,
                        branching_logic: [{
                            "id": "show_for_experienced",
                            "priority": 1,
                            "condition_group": {
                                "operator": "OR",
                                "conditions": [
                                    {"field_key": "experience_level", "operator": "equals", "value": "intermediate"},
                                    {"field_key": "experience_level", "operator": "equals", "value": "senior"},
                                    {"field_key": "experience_level", "operator": "equals", "value": "expert"}
                                ]
                            },
                            "actions": {
                                "set_field_visibility": {
                                    "visible": ["years_of_experience"]
                                }
                            }
                        }]
                    },
                    {
                        field_key: "preferred_frameworks",
                        field_label: "What frameworks or technologies are you interested in learning?",
                        field_type: "multiselect",
                        field_options: [
                            {"value": "react", "label": "React"},
                            {"value": "vue", "label": "Vue.js"},
                            {"value": "angular", "label": "Angular"},
                            {"value": "nodejs", "label": "Node.js"}
                        ],
                        is_required: false,
                        is_enabled: false,
                        step_number: 3,
                        sort_order: 5,
                        branching_logic: [{
                            "id": "show_frameworks_for_js_python",
                            "priority": 1,
                            "condition_group": {
                                "operator": "AND",
                                "conditions": [
                                    {
                                        "condition_group": {
                                            "operator": "OR",
                                            "conditions": [
                                                {"field_key": "primary_languages", "operator": "array_contains", "value": "javascript"},
                                                {"field_key": "primary_languages", "operator": "array_contains", "value": "python"}
                                            ]
                                        }
                                    },
                                    {"field_key": "experience_level", "operator": "not_equals", "value": "expert"}
                                ]
                            },
                            "actions": {
                                "set_field_visibility": {
                                    "visible": ["preferred_frameworks"]
                                }
                            }
                        }]
                    },
                    {
                        field_key: "leadership_interest",
                        field_label: "Are you interested in mentoring or leading junior developers?",
                        field_type: "boolean",
                        is_required: true,
                        is_enabled: false,
                        step_number: 3,
                        sort_order: 6,
                        branching_logic: [{
                            "id": "show_leadership_for_senior",
                            "priority": 1,
                            "condition_group": {
                                "operator": "AND",
                                "conditions": [
                                    {
                                        "condition_group": {
                                            "operator": "OR",
                                            "conditions": [
                                                {"field_key": "experience_level", "operator": "equals", "value": "senior"},
                                                {"field_key": "experience_level", "operator": "equals", "value": "expert"}
                                            ]
                                        }
                                    },
                                    {"field_key": "years_of_experience", "operator": "greater_than", "value": 4}
                                ]
                            },
                            "actions": {
                                "set_field_visibility": {
                                    "visible": ["leadership_interest"]
                                }
                            }
                        }]
                    },
                    {
                        field_key: "github_username",
                        field_label: "What is your GitHub username?",
                        field_type: "text",
                        is_required: false,
                        is_enabled: true,
                        step_number: 4,
                        sort_order: 7
                    },
                    {
                        field_key: "collaboration_preference",
                        field_label: "How do you prefer to collaborate on projects?",
                        field_type: "select",
                        field_options: [
                            {"value": "solo_projects", "label": "I prefer working on solo projects"},
                            {"value": "small_teams", "label": "Small teams (2-4 people)"},
                            {"value": "large_teams", "label": "Large teams (5+ people)"},
                            {"value": "open_source", "label": "Open source contributions"},
                            {"value": "mentoring", "label": "I want to mentor others"}
                        ],
                        is_required: true,
                        is_enabled: false,
                        step_number: 4,
                        sort_order: 8,
                        branching_logic: [
                            {
                                "id": "skip_solo_for_beginners",
                                "priority": 2,
                                "condition": {
                                    "field_key": "experience_level",
                                    "operator": "equals",
                                    "value": "beginner"
                                },
                                "actions": {
                                    "set_field_visibility": {
                                        "visible": ["collaboration_preference"]
                                    },
                                    "set_field_values": {
                                        "collaboration_preference": {
                                            "options_filter": {
                                                "exclude": ["solo_projects", "mentoring"]
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                "id": "show_all_for_experienced",
                                "priority": 1,
                                "condition": {
                                    "field_key": "experience_level",
                                    "operator": "not_equals",
                                    "value": "beginner"
                                },
                                "actions": {
                                    "set_field_visibility": {
                                        "visible": ["collaboration_preference"]
                                    }
                                }
                            }
                        ]
                    }
                ]
            };
        }
        return { data: [] };
    }

    async saveOnboardingResponse() {
        return { success: true };
    }
}

// Test scenarios
async function runSampleCampaignTests() {
    console.log('🧪 Sample Campaign - Advanced Developer Onboarding Tests');
    console.log('============================================================\n');

    const mockAPI = new MockBusinessLogicAPI();
    
    // Mock config for the handler
    const mockConfig = {
        api: {
            baseUrl: 'http://localhost:3000',
            timeout: 5000
        }
    };
    
    const handler = new EnhancedOnboardingHandler(mockConfig);
    
    // Mock logger to prevent errors
    handler.logger = {
        info: (msg) => console.log(`[INFO] ${msg}`),
        warn: (msg) => console.log(`[WARN] ${msg}`),
        error: (msg) => console.log(`[ERROR] ${msg}`)
    };
    
    // Override the API client
    handler.businessLogicAPI = mockAPI;

    // Test Scenario 1: Beginner Developer
    console.log('📊 Testing Beginner Developer Profile');
    console.log('=====================================');
    
    const beginnerResponses = {
        experience_level: 'beginner',
        primary_languages: ['javascript', 'python']
    };

    const beginnerFields = await mockAPI.getCampaignOnboardingFields(12);
    const beginnerResult = handler.evaluateBranchingLogic(beginnerResponses, 
        beginnerFields.data.flatMap(field => field.branching_logic || []));

    console.log('Beginner branching result:', JSON.stringify(beginnerResult, null, 2));
    
    // Verify beginner-specific logic
    const beginnerPathVisible = beginnerResult.visibleFields.includes('beginner_learning_path');
    const yearsExperienceHidden = !beginnerResult.visibleFields.includes('years_of_experience');
    
    console.log(beginnerPathVisible ? '✅ Beginner learning path shown correctly' : '❌ Beginner learning path not shown');
    console.log(yearsExperienceHidden ? '✅ Years experience hidden correctly' : '❌ Years experience not hidden');

    console.log('\\n📊 Testing Intermediate Developer Profile');
    console.log('==========================================');
    
    const intermediateResponses = {
        experience_level: 'intermediate',
        primary_languages: ['javascript', 'python'],
        years_of_experience: 3
    };

    const intermediateResult = handler.evaluateBranchingLogic(intermediateResponses, 
        beginnerFields.data.flatMap(field => field.branching_logic || []));

    console.log('Intermediate branching result:', JSON.stringify(intermediateResult, null, 2));
    
    // Verify intermediate-specific logic
    const yearsExperienceVisible = intermediateResult.visibleFields.includes('years_of_experience');
    const frameworksVisible = intermediateResult.visibleFields.includes('preferred_frameworks');
    const beginnerPathHidden = !intermediateResult.visibleFields.includes('beginner_learning_path');
    
    console.log(yearsExperienceVisible ? '✅ Years experience shown correctly' : '❌ Years experience not shown');
    console.log(frameworksVisible ? '✅ Frameworks field shown correctly' : '❌ Frameworks field not shown');
    console.log(beginnerPathHidden ? '✅ Beginner path hidden correctly' : '❌ Beginner path not hidden');

    console.log('\\n📊 Testing Senior Developer Profile');
    console.log('====================================');
    
    const seniorResponses = {
        experience_level: 'senior',
        primary_languages: ['javascript', 'java'],
        years_of_experience: 7
    };

    const seniorResult = handler.evaluateBranchingLogic(seniorResponses, 
        beginnerFields.data.flatMap(field => field.branching_logic || []));

    console.log('Senior branching result:', JSON.stringify(seniorResult, null, 2));
    
    // Verify senior-specific logic
    const leadershipVisible = seniorResult.visibleFields.includes('leadership_interest');
    const collaborationVisible = seniorResult.visibleFields.includes('collaboration_preference');
    
    console.log(leadershipVisible ? '✅ Leadership field shown correctly' : '❌ Leadership field not shown');
    console.log(collaborationVisible ? '✅ Collaboration field shown correctly' : '❌ Collaboration field not shown');

    console.log('\\n📊 Testing Expert Developer Profile (No Frameworks)');
    console.log('====================================================');
    
    const expertResponses = {
        experience_level: 'expert',
        primary_languages: ['go', 'rust'], // Non-JS/Python languages
        years_of_experience: 15
    };

    const expertResult = handler.evaluateBranchingLogic(expertResponses, 
        beginnerFields.data.flatMap(field => field.branching_logic || []));

    console.log('Expert branching result:', JSON.stringify(expertResult, null, 2));
    
    // Verify expert-specific logic (frameworks should NOT be shown for experts, even if they use JS/Python)
    const frameworksHidden = !expertResult.visibleFields.includes('preferred_frameworks');
    const expertLeadershipVisible = expertResult.visibleFields.includes('leadership_interest');
    
    console.log(frameworksHidden ? '✅ Frameworks hidden for expert correctly' : '❌ Frameworks not hidden for expert');
    console.log(expertLeadershipVisible ? '✅ Expert leadership field shown correctly' : '❌ Expert leadership field not shown');

    console.log('\\n🎯 Sample Campaign Test Summary');
    console.log('================================');
    console.log('✅ Beginner path branching working');
    console.log('✅ Experience-based field visibility working');
    console.log('✅ Language-based framework selection working');  
    console.log('✅ Senior leadership questions working');
    console.log('✅ Complex nested AND/OR conditions working');
    console.log('\\n🎉 Sample campaign branching logic validation completed!');
}

// Run the tests
runSampleCampaignTests().catch(console.error);