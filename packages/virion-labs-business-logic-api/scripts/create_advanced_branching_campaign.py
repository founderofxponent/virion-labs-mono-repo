#!/usr/bin/env python3
"""
Advanced Branching Campaign Creator

Creates a comprehensive branching onboarding campaign that demonstrates
dynamic step skipping and conditional field display based on user responses.

This script creates a campaign that:
- Skips steps based on experience level
- Shows/hides fields conditionally  
- Uses advanced branching operators
- Provides multiple user journey paths

Usage:
    python create_advanced_branching_campaign.py
    
Environment variables:
    STRAPI_BASE_URL: Base URL for Strapi (default: http://localhost:1337)
    STRAPI_API_TOKEN: API token for Strapi authentication
"""

import asyncio
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from core.strapi_client import StrapiClient
from schemas.strapi import StrapiCampaignOnboardingFieldCreate


async def create_advanced_branching_campaign(strapi_client: StrapiClient, campaign_document_id: str):
    """
    Create an advanced branching campaign with comprehensive decision logic
    """
    print(f"🚀 Creating Advanced Branching Campaign for document ID: {campaign_document_id}")
    
    # Get the numeric campaign ID from document ID
    try:
        numeric_campaign_id = await strapi_client.get_campaign_id_by_document_id(campaign_document_id)
        if not numeric_campaign_id:
            print(f"❌ Campaign not found for document ID: {campaign_document_id}")
            return []
        print(f"✅ Found numeric campaign ID: {numeric_campaign_id}")
    except Exception as e:
        print(f"❌ Error finding campaign: {e}")
        return []
    
    # Define the advanced branching onboarding fields
    advanced_fields = [
        # Step 1: Core Information with Advanced Branching
        {
            "field_key": "experience_level",
            "field_label": "What is your programming experience level?",
            "field_type": "select",
            "field_options": [
                {"label": "Complete Beginner (Never coded)", "value": "complete_beginner"},
                {"label": "Learning (Tutorials, courses)", "value": "learning"},
                {"label": "Intermediate (1-3 years)", "value": "intermediate"},
                {"label": "Advanced (3-7 years)", "value": "advanced"},
                {"label": "Expert (7+ years)", "value": "expert"}
            ],
            "field_placeholder": "Select your experience level",
            "field_description": "This determines your personalized onboarding path",
            "is_required": True,
            "is_enabled": True,
            "sort_order": 1,
            "step_number": 1,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # Expert/Advanced users skip to step 4 (leadership questions)
                {
                    "condition": {
                        "field_key": "experience_level",
                        "operator": "in_list",
                        "value": ["advanced", "expert"]
                    },
                    "actions": {
                        "set_next_step": {
                            "step_number": 4
                        }
                    },
                    "priority": 20,
                    "id": "skip_to_leadership_for_experienced",
                    "description": "Advanced/Expert users skip directly to leadership questions"
                },
                # Intermediate users go to step 3 (specialization)
                {
                    "condition": {
                        "field_key": "experience_level",
                        "operator": "equals",
                        "value": "intermediate"
                    },
                    "actions": {
                        "set_next_step": {
                            "step_number": 3
                        }
                    },
                    "priority": 15,
                    "id": "skip_to_specialization_for_intermediate",
                    "description": "Intermediate users skip to specialization questions"
                },
                # Beginners continue to step 2 (learning path)
                {
                    "condition_group": {
                        "operator": "OR",
                        "conditions": [
                            {
                                "field_key": "experience_level",
                                "operator": "equals",
                                "value": "complete_beginner"
                            },
                            {
                                "field_key": "experience_level",
                                "operator": "equals",
                                "value": "learning"
                            }
                        ]
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["learning_path", "time_commitment", "mentor_request"]
                        }
                    },
                    "priority": 10,
                    "id": "show_beginner_fields",
                    "description": "Show beginner-specific learning fields"
                }
            ],
            "campaign": numeric_campaign_id
        },
        {
            "field_key": "primary_languages",
            "field_label": "What programming languages do you know or want to learn?",
            "field_type": "multiselect",
            "field_options": [
                {"label": "JavaScript", "value": "javascript"},
                {"label": "Python", "value": "python"},
                {"label": "Java", "value": "java"},
                {"label": "C#", "value": "csharp"},
                {"label": "Go", "value": "go"},
                {"label": "Rust", "value": "rust"},
                {"label": "TypeScript", "value": "typescript"},
                {"label": "PHP", "value": "php"},
                {"label": "C++", "value": "cpp"},
                {"label": "Other", "value": "other"}
            ],
            "field_placeholder": "Select all that apply",
            "field_description": "This helps us recommend relevant channels and resources",
            "is_required": True,
            "is_enabled": True,
            "sort_order": 2,
            "step_number": 1,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # If no languages selected, ensure beginner path
                {
                    "condition": {
                        "field_key": "primary_languages",
                        "operator": "array_length_equals",
                        "value": 0
                    },
                    "actions": {
                        "set_field_values": {
                            "experience_level": {
                                "value": "complete_beginner"
                            }
                        },
                        "set_field_visibility": {
                            "visible": ["learning_path", "mentor_request"]
                        }
                    },
                    "priority": 25,
                    "id": "force_beginner_path_no_languages",
                    "description": "If no languages selected, force beginner experience level"
                },
                # Web developers get frontend/backend choice
                {
                    "condition_group": {
                        "operator": "OR",
                        "conditions": [
                            {
                                "field_key": "primary_languages",
                                "operator": "array_contains",
                                "value": "javascript"
                            },
                            {
                                "field_key": "primary_languages",
                                "operator": "array_contains",
                                "value": "typescript"
                            },
                            {
                                "field_key": "primary_languages",
                                "operator": "array_contains",
                                "value": "php"
                            }
                        ]
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["web_development_focus"]
                        }
                    },
                    "priority": 12,
                    "id": "show_web_dev_focus_for_web_langs",
                    "description": "Show web development focus for web developers"
                }
            ],
            "campaign": numeric_campaign_id
        },
        
        # Step 2: Beginner Learning Path
        {
            "field_key": "learning_path",
            "field_label": "Which learning path interests you most?",
            "field_type": "select",
            "field_options": [
                {"label": "Frontend Development (Websites, UIs)", "value": "frontend"},
                {"label": "Backend Development (APIs, Servers)", "value": "backend"},
                {"label": "Full-stack Development (Both)", "value": "fullstack"},
                {"label": "Mobile Development (Apps)", "value": "mobile"},
                {"label": "Data Science & Analytics", "value": "data_science"},
                {"label": "DevOps & Infrastructure", "value": "devops"},
                {"label": "I'm not sure yet", "value": "undecided"}
            ],
            "field_placeholder": "Choose your learning path",
            "field_description": "We'll provide resources and mentorship based on your choice",
            "is_required": True,
            "is_enabled": False,  # Only shown via branching logic
            "sort_order": 1,
            "step_number": 2,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # Undecided users get extra guidance
                {
                    "condition": {
                        "field_key": "learning_path",
                        "operator": "equals",
                        "value": "undecided"
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["career_goals", "interests_exploration"]
                        }
                    },
                    "priority": 10,
                    "id": "show_guidance_for_undecided",
                    "description": "Show career guidance for undecided learners"
                }
            ],
            "campaign": numeric_campaign_id
        },
        {
            "field_key": "time_commitment",
            "field_label": "How much time can you dedicate to learning per week?",
            "field_type": "select",
            "field_options": [
                {"label": "A few hours (2-5 hours)", "value": "few_hours"},
                {"label": "Part-time (5-15 hours)", "value": "part_time"},
                {"label": "Significant time (15-30 hours)", "value": "significant"},
                {"label": "Full-time learning (30+ hours)", "value": "full_time"}
            ],
            "field_placeholder": "Select your time commitment",
            "field_description": "This helps us recommend appropriate learning resources",
            "is_required": True,
            "is_enabled": False,  # Only shown via branching logic
            "sort_order": 2,
            "step_number": 2,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # High commitment learners get intensive options
                {
                    "condition_group": {
                        "operator": "OR",
                        "conditions": [
                            {
                                "field_key": "time_commitment",
                                "operator": "equals",
                                "value": "significant"
                            },
                            {
                                "field_key": "time_commitment",
                                "operator": "equals",
                                "value": "full_time"
                            }
                        ]
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["bootcamp_interest", "accelerated_program"]
                        }
                    },
                    "priority": 8,
                    "id": "show_intensive_options",
                    "description": "Show intensive learning options for dedicated learners"
                }
            ],
            "campaign": numeric_campaign_id
        },
        {
            "field_key": "mentor_request",
            "field_label": "Would you like to be paired with a mentor?",
            "field_type": "boolean",
            "field_placeholder": None,
            "field_description": "We can pair you with an experienced developer for guidance",
            "is_required": False,
            "is_enabled": False,  # Only shown via branching logic
            "sort_order": 3,
            "step_number": 2,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [],
            "campaign": numeric_campaign_id
        },
        
        # Step 3: Intermediate Specialization
        {
            "field_key": "specialization",
            "field_label": "What's your area of specialization?",
            "field_type": "select",
            "field_options": [
                {"label": "Frontend Development", "value": "frontend"},
                {"label": "Backend Development", "value": "backend"},
                {"label": "Full-Stack Development", "value": "fullstack"},
                {"label": "Mobile Development", "value": "mobile"},
                {"label": "DevOps & Infrastructure", "value": "devops"},
                {"label": "Data Engineering", "value": "data_engineering"},
                {"label": "Machine Learning", "value": "machine_learning"},
                {"label": "Cybersecurity", "value": "cybersecurity"}
            ],
            "field_placeholder": "Choose your specialization",
            "field_description": "This determines which specialized channels and resources you'll access",
            "is_required": True,
            "is_enabled": False,  # Only shown for intermediate users
            "sort_order": 1,
            "step_number": 3,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # Show portfolio field for client-facing roles
                {
                    "condition_group": {
                        "operator": "OR",
                        "conditions": [
                            {
                                "field_key": "specialization",
                                "operator": "equals",
                                "value": "frontend"
                            },
                            {
                                "field_key": "specialization",
                                "operator": "equals",
                                "value": "fullstack"
                            }
                        ]
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["portfolio_url", "github_username"]
                        }
                    },
                    "priority": 10,
                    "id": "show_portfolio_for_frontend",
                    "description": "Show portfolio fields for frontend/fullstack developers"
                }
            ],
            "campaign": numeric_campaign_id
        },
        {
            "field_key": "years_experience",
            "field_label": "How many years of professional development experience?",
            "field_type": "number",
            "field_placeholder": "Enter years of experience",
            "field_description": "This helps us match you with appropriate projects and peers",
            "is_required": True,
            "is_enabled": False,  # Only shown for intermediate users
            "sort_order": 2,
            "step_number": 3,
            "step_role_ids": None,
            "validation_rules": {"min": 0, "max": 50},
            "branching_logic": [
                # 2+ years experience shows senior opportunities
                {
                    "condition": {
                        "field_key": "years_experience",
                        "operator": "greater_than_or_equal",
                        "value": 2
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["leadership_interest", "mentoring_availability"]
                        }
                    },
                    "priority": 12,
                    "id": "show_senior_opportunities",
                    "description": "Show leadership opportunities for experienced developers"
                }
            ],
            "campaign": numeric_campaign_id
        },
        {
            "field_key": "portfolio_url",
            "field_label": "Portfolio or GitHub URL (optional)",
            "field_type": "url",
            "field_placeholder": "https://github.com/yourusername or https://yourportfolio.com",
            "field_description": "Share your work so we can better understand your skills",
            "is_required": False,
            "is_enabled": False,  # Only shown via branching logic
            "sort_order": 3,
            "step_number": 3,
            "step_role_ids": None,
            "validation_rules": {"pattern": "^https?://.*"},
            "branching_logic": [],
            "campaign": numeric_campaign_id
        },
        
        # Step 4: Advanced/Expert Leadership
        {
            "field_key": "leadership_experience",
            "field_label": "Do you have experience leading technical teams?",
            "field_type": "boolean",
            "field_placeholder": None,
            "field_description": "This includes formal management, tech lead roles, or project leadership",
            "is_required": True,
            "is_enabled": False,  # Only shown for advanced/expert users
            "sort_order": 1,
            "step_number": 4,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # Leaders get community leadership options
                {
                    "condition": {
                        "field_key": "leadership_experience",
                        "operator": "equals",
                        "value": True
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["community_leadership_interest", "speaking_interest"]
                        }
                    },
                    "priority": 15,
                    "id": "show_community_leadership",
                    "description": "Show community leadership options for experienced leaders"
                }
            ],
            "campaign": numeric_campaign_id
        },
        {
            "field_key": "mentoring_availability",
            "field_label": "Are you available to mentor other developers?",
            "field_type": "boolean",
            "field_placeholder": None,
            "field_description": "We're always looking for experienced developers to help guide newcomers",
            "is_required": False,
            "is_enabled": False,  # Only shown via branching logic
            "sort_order": 2,
            "step_number": 4,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # Mentors get additional mentor fields
                {
                    "condition": {
                        "field_key": "mentoring_availability",
                        "operator": "equals",
                        "value": True
                    },
                    "actions": {
                        "set_field_visibility": {
                            "visible": ["mentoring_areas", "mentoring_time_commitment"]
                        }
                    },
                    "priority": 10,
                    "id": "show_mentor_details",
                    "description": "Show detailed mentoring preferences for available mentors"
                }
            ],
            "campaign": numeric_campaign_id
        },
        {
            "field_key": "community_leadership_interest",
            "field_label": "Would you be interested in community leadership roles?",
            "field_type": "multiselect",
            "field_options": [
                {"label": "Event Organization", "value": "events"},
                {"label": "Content Creation", "value": "content"},
                {"label": "Code Review & Standards", "value": "code_review"},
                {"label": "New Member Onboarding", "value": "onboarding"},
                {"label": "Technical Discussions Moderation", "value": "moderation"},
                {"label": "Workshop & Tutorial Creation", "value": "education"}
            ],
            "field_placeholder": "Select areas of interest",
            "field_description": "Help us understand how you'd like to contribute to the community",
            "is_required": False,
            "is_enabled": False,  # Only shown via branching logic
            "sort_order": 3,
            "step_number": 4,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [],
            "campaign": numeric_campaign_id
        },
        
        # Step 5: Final Completion
        {
            "field_key": "completion_message",
            "field_label": "Thank you for completing the onboarding!",
            "field_type": "text",
            "field_placeholder": None,
            "field_description": "This message is customized based on your responses",
            "is_required": False,
            "is_enabled": False,  # Only shown via branching logic
            "sort_order": 1,
            "step_number": 5,
            "step_role_ids": None,
            "validation_rules": None,
            "branching_logic": [
                # Personalized completion message for all users
                {
                    "condition_group": {
                        "operator": "OR",
                        "conditions": [
                            {
                                "field_key": "experience_level",
                                "operator": "in_list",
                                "value": ["complete_beginner", "learning", "intermediate", "advanced", "expert"]
                            }
                        ]
                    },
                    "actions": {
                        "set_next_step": {
                            "step_number": None  # End onboarding
                        },
                        "set_field_values": {
                            "completion_message": {
                                "dynamic_value": {
                                    "template": "Welcome to our {{experience_level}} developer community! Based on your interests in {{primary_languages}}, we've prepared specialized resources and channels for you. Your onboarding journey is complete!",
                                    "variables": {
                                        "experience_level": "{{experience_level}}",
                                        "primary_languages": "{{primary_languages}}"
                                    }
                                }
                            }
                        },
                        "set_field_visibility": {
                            "visible": ["completion_message"]
                        }
                    },
                    "priority": 1,
                    "id": "personalized_completion",
                    "description": "Show personalized completion message for all users"
                }
            ],
            "campaign": numeric_campaign_id
        }
    ]
    
    # Create fields in Strapi
    created_fields = []
    for field_data in advanced_fields:
        try:
            print(f"📝 Creating field: {field_data['field_key']} (Step {field_data['step_number']})")
            strapi_field = StrapiCampaignOnboardingFieldCreate(**field_data)
            created_field = await strapi_client.create_onboarding_field(strapi_field)
            created_fields.append(created_field)
            print(f"✅ Created field: {created_field.field_key} (ID: {created_field.id})")
        except Exception as e:
            print(f"❌ Failed to create field {field_data['field_key']}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n🎉 Advanced Branching Campaign created with {len(created_fields)} fields!")
    print("\n📊 Campaign Structure:")
    print("   Step 1: Experience Level & Languages (All users)")
    print("   Step 2: Learning Path (Beginners only)")
    print("   Step 3: Specialization (Intermediate only)")
    print("   Step 4: Leadership (Advanced/Expert only)")
    print("   Step 5: Completion (All users)")
    print("\n🔀 Branching Logic:")
    print("   • Complete Beginners/Learning → Step 2 (Learning Path)")
    print("   • Intermediate → Step 3 (Specialization)")
    print("   • Advanced/Expert → Step 4 (Leadership)")
    print("   • Dynamic field visibility based on selections")
    print("   • Personalized completion messages")
    
    return created_fields


async def main():
    """Main function to create the advanced branching campaign"""
    print("🚀 Advanced Branching Campaign Creator")
    print("=" * 50)
    
    # Configuration - StrapiClient uses settings from environment
    api_token = os.getenv('STRAPI_API_TOKEN')
    
    # Use the campaign document ID from the user's request
    campaign_document_id = "if97jzhenxoggtbuzlyostdf"
    
    if not api_token:
        print("❌ Error: Please provide STRAPI_API_TOKEN as environment variable or command line argument")
        print("Usage: STRAPI_API_TOKEN=your_token python create_advanced_branching_campaign.py")
        return
    
    # Set the API token and URL in environment for StrapiClient
    os.environ['STRAPI_API_TOKEN'] = api_token
    os.environ['STRAPI_URL'] = os.getenv('STRAPI_BASE_URL', 'http://localhost:1337')
    
    print(f"🔗 Connecting to Strapi")
    print(f"🎯 Target campaign document ID: {campaign_document_id}")
    
    try:
        # Initialize Strapi client - it reads from environment variables
        strapi_client = StrapiClient()
        print("✅ Connected to Strapi successfully")
        
        # Create the advanced branching campaign
        created_fields = await create_advanced_branching_campaign(strapi_client, campaign_document_id)
        
        if created_fields:
            print(f"\n🎉 Successfully created {len(created_fields)} onboarding fields!")
            print("\n🧪 Testing Recommendations:")
            print("1. Test with 'Complete Beginner' → Should show Step 2 (Learning Path)")
            print("2. Test with 'Intermediate' → Should skip to Step 3 (Specialization)")  
            print("3. Test with 'Advanced/Expert' → Should skip to Step 4 (Leadership)")
            print("4. Verify conditional field visibility works")
            print("5. Check personalized completion messages")
            
            print(f"\n🔧 Next Steps:")
            print("1. Test the campaign using Discord bot /join command")
            print("2. Verify branching logic works as expected")
            print("3. Check that steps are skipped properly based on experience level")
        else:
            print("❌ No fields were created successfully")
        
    except Exception as e:
        print(f"❌ Error creating advanced branching campaign: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Allow API token to be passed as command line argument
    if len(sys.argv) > 1:
        os.environ['STRAPI_API_TOKEN'] = sys.argv[1]
    
    asyncio.run(main())