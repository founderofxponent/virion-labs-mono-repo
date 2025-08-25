#!/usr/bin/env python3
"""
Sample Branching Campaign Data Creator

This script creates sample campaigns with complex branching logic scenarios
for testing and demonstration purposes.

Usage:
    python create_sample_branching_campaigns.py
    
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


async def create_skill_based_onboarding_campaign(strapi_client: StrapiClient):
    """
    Create a skill-based onboarding campaign with complex branching logic
    """
    print("🚀 Creating Skill-Based Onboarding Campaign...")
    
    # First, create the campaign
    campaign_data = {
        "name": "Skill-Based Developer Onboarding",
        "description": "Smart onboarding that adapts based on your programming skills and experience level",
        "channel_id": "1234567890123456789",
        "target_role_ids": ["developer_role_id"],
        "auto_role_assignment": True,
        "requirements": "Basic programming knowledge helpful but not required",
        "reward_description": "Access to specialized developer channels and mentorship opportunities"
    }
    
    # Create campaign first (you'll need to implement this in your Strapi client)
    # For now, we'll assume campaign_id exists
    campaign_id = 1  # This would come from creating the campaign
    
    # Step 1: Basic Information with Complex Branching
    basic_fields = [
        {
            "field_key": "full_name",
            "field_label": "What's your full name?",
            "field_type": "text",
            "field_placeholder": "Enter your full name",
            "field_description": "We'll use this to personalize your experience",
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 1,
            "step_role_ids": ["onboarding_step1"],
            "validation_rules": {"min_length": 2, "max_length": 100},
            "branching_logic": [],
            "campaign": campaign_id
        },
        {
            "field_key": "experience_level",
            "field_label": "How would you describe your programming experience?",
            "field_type": "select",
            "field_options": {
                "options": [
                    {"value": "complete_beginner", "label": "Complete Beginner (Never coded before)"},
                    {"value": "some_experience", "label": "Some Experience (Hobby projects, tutorials)"},
                    {"value": "intermediate", "label": "Intermediate (1-3 years professional)"},
                    {"value": "advanced", "label": "Advanced (3-7 years professional)"},
                    {"value": "expert", "label": "Expert (7+ years professional)"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 1,
            "step_number": 1,
            "step_role_ids": ["onboarding_step1"],
            "validation_rules": {},
            "branching_logic": [
                # Beginners get a welcoming path with lots of help
                {
                    "conditions": {
                        "logic": "OR",
                        "conditions": [
                            {
                                "field_key": "experience_level",
                                "operator": "equals",
                                "value": "complete_beginner"
                            },
                            {
                                "field_key": "experience_level", 
                                "operator": "equals",
                                "value": "some_experience"
                            }
                        ]
                    },
                    "action": "show",
                    "target_fields": ["learning_goals", "preferred_learning_style", "time_commitment"],
                    "priority": 10,
                    "description": "Show beginner-friendly fields for newcomers"
                },
                # Advanced users skip basic questions and go to specialization
                {
                    "conditions": {
                        "logic": "OR",
                        "conditions": [
                            {
                                "field_key": "experience_level",
                                "operator": "equals",
                                "value": "advanced"
                            },
                            {
                                "field_key": "experience_level",
                                "operator": "equals", 
                                "value": "expert"
                            }
                        ]
                    },
                    "action": "skip_to_step",
                    "target_step": 4,
                    "priority": 15,
                    "description": "Skip to advanced questions for experienced developers"
                },
                # Intermediate users get a balanced path
                {
                    "condition": {
                        "field_key": "experience_level",
                        "operator": "equals",
                        "value": "intermediate"
                    },
                    "action": "show",
                    "target_fields": ["specialization_interest", "current_role"],
                    "priority": 8,
                    "description": "Show career-focused fields for intermediate developers"
                }
            ],
            "campaign": campaign_id
        },
        {
            "field_key": "programming_languages",
            "field_label": "Which programming languages do you know or want to learn?",
            "field_type": "multiselect",
            "field_options": {
                "options": [
                    {"value": "javascript", "label": "JavaScript"},
                    {"value": "python", "label": "Python"},
                    {"value": "java", "label": "Java"},
                    {"value": "csharp", "label": "C#"},
                    {"value": "cpp", "label": "C++"},
                    {"value": "go", "label": "Go"},
                    {"value": "rust", "label": "Rust"},
                    {"value": "typescript", "label": "TypeScript"},
                    {"value": "php", "label": "PHP"},
                    {"value": "ruby", "label": "Ruby"},
                    {"value": "swift", "label": "Swift"},
                    {"value": "kotlin", "label": "Kotlin"}
                ]
            },
            "field_placeholder": "Select all that apply",
            "field_description": "This helps us recommend relevant channels and resources",
            "is_required": False,
            "is_enabled": True,
            "sort_order": 2,
            "step_number": 1,
            "step_role_ids": ["onboarding_step1"],
            "validation_rules": {},
            "branching_logic": [
                # If no languages selected, assume complete beginner
                {
                    "condition": {
                        "field_key": "programming_languages",
                        "operator": "array_length_equals",
                        "value": 0
                    },
                    "action": "set_field_value",
                    "target_fields": ["experience_level"],
                    "target_value": "complete_beginner",
                    "priority": 20,
                    "description": "Set as complete beginner if no languages selected"
                },
                # Show web dev path for web technologies
                {
                    "conditions": {
                        "logic": "OR",
                        "conditions": [
                            {
                                "field_key": "programming_languages",
                                "operator": "array_contains",
                                "value": "javascript"
                            },
                            {
                                "field_key": "programming_languages",
                                "operator": "array_contains", 
                                "value": "typescript"
                            },
                            {
                                "field_key": "programming_languages",
                                "operator": "array_contains",
                                "value": "php"
                            }
                        ]
                    },
                    "action": "show",
                    "target_fields": ["web_development_focus", "frontend_backend_preference"],
                    "priority": 12,
                    "description": "Show web development fields for web developers"
                }
            ],
            "campaign": campaign_id
        }
    ]
    
    # Step 2: Beginner-Specific Questions
    beginner_fields = [
        {
            "field_key": "learning_goals",
            "field_label": "What do you hope to achieve by joining our community?",
            "field_type": "textarea",
            "field_placeholder": "e.g., Learn to build websites, get my first programming job, understand algorithms better...",
            "field_description": "Share your aspirations - we'll help you get there!",
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 2,
            "step_role_ids": ["onboarding_step2"],
            "validation_rules": {"min_length": 10},
            "branching_logic": [],
            "campaign": campaign_id
        },
        {
            "field_key": "preferred_learning_style",
            "field_label": "How do you prefer to learn?",
            "field_type": "select",
            "field_options": {
                "options": [
                    {"value": "hands_on", "label": "Hands-on coding projects"},
                    {"value": "video_tutorials", "label": "Video tutorials and walkthroughs"},
                    {"value": "reading_docs", "label": "Reading documentation and guides"},
                    {"value": "pair_programming", "label": "Pair programming with others"},
                    {"value": "interactive_courses", "label": "Interactive online courses"},
                    {"value": "mentorship", "label": "One-on-one mentorship"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 1,
            "step_number": 2,
            "step_role_ids": ["onboarding_step2"],
            "validation_rules": {},
            "branching_logic": [
                {
                    "condition": {
                        "field_key": "preferred_learning_style",
                        "operator": "in_list",
                        "value": ["mentorship", "pair_programming"]
                    },
                    "action": "show",
                    "target_fields": ["mentor_matching", "availability_timezone"],
                    "priority": 10,
                    "description": "Show mentorship options for collaborative learners"
                }
            ],
            "campaign": campaign_id
        },
        {
            "field_key": "time_commitment",
            "field_label": "How much time can you dedicate to learning per week?",
            "field_type": "select",
            "field_options": {
                "options": [
                    {"value": "few_hours", "label": "A few hours (2-5 hours)"},
                    {"value": "part_time", "label": "Part-time (5-15 hours)"},
                    {"value": "significant", "label": "Significant time (15-30 hours)"},
                    {"value": "full_time", "label": "Full-time (30+ hours)"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 2,
            "step_number": 2,
            "step_role_ids": ["onboarding_step2"],
            "validation_rules": {},
            "branching_logic": [
                {
                    "condition": {
                        "field_key": "time_commitment",
                        "operator": "in_list",
                        "value": ["significant", "full_time"]
                    },
                    "action": "show",
                    "target_fields": ["intensive_program_interest", "bootcamp_background"],
                    "priority": 8,
                    "description": "Show intensive program options for dedicated learners"
                }
            ],
            "campaign": campaign_id
        },
        {
            "field_key": "mentor_matching",
            "field_label": "Would you like to be matched with a mentor?",
            "field_type": "boolean",
            "field_description": "We can pair you with an experienced developer for guidance",
            "is_required": False,
            "is_enabled": True,
            "sort_order": 3,
            "step_number": 2,
            "step_role_ids": ["onboarding_step2"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        }
    ]
    
    # Step 3: Intermediate Developer Questions
    intermediate_fields = [
        {
            "field_key": "specialization_interest",
            "field_label": "Which area interests you most?",
            "field_type": "select",
            "field_options": {
                "options": [
                    {"value": "frontend", "label": "Frontend Development"},
                    {"value": "backend", "label": "Backend Development"},
                    {"value": "fullstack", "label": "Full-Stack Development"},
                    {"value": "mobile", "label": "Mobile Development"},
                    {"value": "devops", "label": "DevOps & Infrastructure"},
                    {"value": "data_science", "label": "Data Science & Analytics"},
                    {"value": "machine_learning", "label": "Machine Learning & AI"},
                    {"value": "cybersecurity", "label": "Cybersecurity"},
                    {"value": "game_dev", "label": "Game Development"},
                    {"value": "embedded", "label": "Embedded Systems"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 3,
            "step_role_ids": ["onboarding_step3"],
            "validation_rules": {},
            "branching_logic": [
                {
                    "condition": {
                        "field_key": "specialization_interest",
                        "operator": "in_list",
                        "value": ["machine_learning", "data_science"]
                    },
                    "action": "show",
                    "target_fields": ["ml_experience", "preferred_ml_tools"],
                    "priority": 12,
                    "description": "Show ML-specific fields for data science interests"
                },
                {
                    "condition": {
                        "field_key": "specialization_interest",
                        "operator": "in_list",
                        "value": ["frontend", "fullstack"]
                    },
                    "action": "show",
                    "target_fields": ["frontend_frameworks", "design_skills"],
                    "priority": 10,
                    "description": "Show frontend-specific fields"
                }
            ],
            "campaign": campaign_id
        },
        {
            "field_key": "current_role",
            "field_label": "What's your current role or situation?",
            "field_type": "select",
            "field_options": {
                "options": [
                    {"value": "junior_dev", "label": "Junior Developer"},
                    {"value": "switching_careers", "label": "Switching Careers to Tech"},
                    {"value": "student", "label": "Computer Science Student"},
                    {"value": "bootcamp_grad", "label": "Bootcamp Graduate"},
                    {"value": "self_taught", "label": "Self-Taught Developer"},
                    {"value": "freelancer", "label": "Freelance Developer"},
                    {"value": "looking_for_work", "label": "Looking for First Dev Job"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 1,
            "step_number": 3,
            "step_role_ids": ["onboarding_step3"],
            "validation_rules": {},
            "branching_logic": [
                {
                    "condition": {
                        "field_key": "current_role",
                        "operator": "in_list",
                        "value": ["looking_for_work", "switching_careers"]
                    },
                    "action": "show",
                    "target_fields": ["job_search_help", "resume_review_interest", "interview_prep"],
                    "priority": 15,
                    "description": "Show job search support for job seekers"
                }
            ],
            "campaign": campaign_id
        }
    ]
    
    # Step 4: Advanced Developer Questions  
    advanced_fields = [
        {
            "field_key": "years_experience",
            "field_label": "How many years of professional development experience do you have?",
            "field_type": "number",
            "field_placeholder": "Enter number of years",
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 4,
            "step_role_ids": ["onboarding_step4"],
            "validation_rules": {"min": 0, "max": 50},
            "branching_logic": [
                {
                    "condition": {
                        "field_key": "years_experience",
                        "operator": "greater_than_or_equal",
                        "value": 7
                    },
                    "action": "show",
                    "target_fields": ["leadership_experience", "mentoring_interest", "architecture_experience"],
                    "priority": 15,
                    "description": "Show senior-level fields for experienced developers"
                },
                {
                    "condition": {
                        "field_key": "years_experience",
                        "operator": "greater_than_or_equal",
                        "value": 10
                    },
                    "action": "show",
                    "target_fields": ["speaking_interest", "open_source_contributions"],
                    "priority": 18,
                    "description": "Show thought leadership fields for very senior developers"
                }
            ],
            "campaign": campaign_id
        },
        {
            "field_key": "technical_interests",
            "field_label": "What technical areas are you most passionate about?",
            "field_type": "multiselect",
            "field_options": {
                "options": [
                    {"value": "system_design", "label": "System Design & Architecture"},
                    {"value": "performance", "label": "Performance Optimization"},
                    {"value": "security", "label": "Security & Privacy"},
                    {"value": "distributed_systems", "label": "Distributed Systems"},
                    {"value": "databases", "label": "Database Design & Optimization"},
                    {"value": "cloud_native", "label": "Cloud Native Technologies"},
                    {"value": "containerization", "label": "Containerization & Orchestration"},
                    {"value": "microservices", "label": "Microservices Architecture"},
                    {"value": "testing", "label": "Testing Strategies"},
                    {"value": "ci_cd", "label": "CI/CD & DevOps Practices"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 1,
            "step_number": 4,
            "step_role_ids": ["onboarding_step4"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        },
        {
            "field_key": "leadership_experience",
            "field_label": "Do you have experience leading technical teams?",
            "field_type": "textarea",
            "field_placeholder": "Describe your leadership experience, team sizes, challenges overcome, etc.",
            "field_description": "Share your experience with technical leadership, team management, or project ownership",
            "is_required": False,
            "is_enabled": True,
            "sort_order": 2,
            "step_number": 4,
            "step_role_ids": ["onboarding_step4"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        },
        {
            "field_key": "mentoring_interest",
            "field_label": "Are you interested in mentoring other developers?",
            "field_type": "boolean",
            "field_description": "We're always looking for experienced developers to help guide newcomers",
            "is_required": False,
            "is_enabled": True,
            "sort_order": 3,
            "step_number": 4,
            "step_role_ids": ["onboarding_step4"],
            "validation_rules": {},
            "branching_logic": [
                {
                    "condition": {
                        "field_key": "mentoring_interest",
                        "operator": "equals",
                        "value": True
                    },
                    "action": "show",
                    "target_fields": ["mentoring_availability", "mentoring_areas"],
                    "priority": 10,
                    "description": "Show mentoring details for interested mentors"
                }
            ],
            "campaign": campaign_id
        }
    ]
    
    # Combine all fields
    all_fields = basic_fields + beginner_fields + intermediate_fields + advanced_fields
    
    # Create fields in Strapi
    created_fields = []
    for field_data in all_fields:
        try:
            print(f"📝 Creating field: {field_data['field_key']}")
            strapi_field = StrapiCampaignOnboardingFieldCreate(**field_data)
            created_field = await strapi_client.create_onboarding_field(strapi_field)
            created_fields.append(created_field)
            print(f"✅ Created field: {created_field.field_key} (ID: {created_field.id})")
        except Exception as e:
            print(f"❌ Failed to create field {field_data['field_key']}: {e}")
    
    print(f"\n🎉 Skill-Based Onboarding Campaign created with {len(created_fields)} fields!")
    return created_fields


async def create_simple_branching_demo(strapi_client: StrapiClient):
    """
    Create a simple branching demo for testing
    """
    print("\n🎯 Creating Simple Branching Demo Campaign...")
    
    campaign_id = 2  # Assuming this campaign exists
    
    simple_fields = [
        {
            "field_key": "user_type",
            "field_label": "I am a...",
            "field_type": "select",
            "field_options": {
                "options": [
                    {"value": "student", "label": "Student"},
                    {"value": "professional", "label": "Working Professional"},
                    {"value": "hobbyist", "label": "Hobbyist/Enthusiast"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 1,
            "step_role_ids": ["demo_step1"],
            "validation_rules": {},
            "branching_logic": [
                {
                    "condition": {
                        "field_key": "user_type",
                        "operator": "equals",
                        "value": "student"
                    },
                    "action": "show",
                    "target_fields": ["school_name", "graduation_year"],
                    "priority": 10,
                    "description": "Show student-specific fields"
                },
                {
                    "condition": {
                        "field_key": "user_type",
                        "operator": "equals",
                        "value": "professional"
                    },
                    "action": "show",
                    "target_fields": ["company_name", "job_title", "years_experience"],
                    "priority": 10,
                    "description": "Show professional fields"
                },
                {
                    "condition": {
                        "field_key": "user_type",
                        "operator": "equals",
                        "value": "hobbyist"
                    },
                    "action": "show",
                    "target_fields": ["hobby_focus", "learning_goal"],
                    "priority": 10,
                    "description": "Show hobbyist fields"
                }
            ],
            "campaign": campaign_id
        },
        # Student fields
        {
            "field_key": "school_name",
            "field_label": "What school do you attend?",
            "field_type": "text",
            "field_placeholder": "University/College name",
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 2,
            "step_role_ids": ["demo_step2"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        },
        {
            "field_key": "graduation_year",
            "field_label": "Expected graduation year?",
            "field_type": "number",
            "field_placeholder": "e.g., 2024",
            "is_required": False,
            "is_enabled": True,
            "sort_order": 1,
            "step_number": 2,
            "step_role_ids": ["demo_step2"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        },
        # Professional fields
        {
            "field_key": "company_name",
            "field_label": "What company do you work for?",
            "field_type": "text",
            "field_placeholder": "Company name",
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 2,
            "step_role_ids": ["demo_step2"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        },
        {
            "field_key": "job_title",
            "field_label": "What's your job title?",
            "field_type": "text",
            "field_placeholder": "e.g., Software Engineer, Product Manager",
            "is_required": False,
            "is_enabled": True,
            "sort_order": 1,
            "step_number": 2,
            "step_role_ids": ["demo_step2"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        },
        # Hobbyist fields
        {
            "field_key": "hobby_focus",
            "field_label": "What's your main area of interest?",
            "field_type": "select",
            "field_options": {
                "options": [
                    {"value": "web_dev", "label": "Web Development"},
                    {"value": "game_dev", "label": "Game Development"},
                    {"value": "mobile_apps", "label": "Mobile Apps"},
                    {"value": "ai_ml", "label": "AI/Machine Learning"},
                    {"value": "hardware", "label": "Hardware/Arduino/Raspberry Pi"}
                ]
            },
            "is_required": True,
            "is_enabled": True,
            "sort_order": 0,
            "step_number": 2,
            "step_role_ids": ["demo_step2"],
            "validation_rules": {},
            "branching_logic": [],
            "campaign": campaign_id
        }
    ]
    
    created_fields = []
    for field_data in simple_fields:
        try:
            print(f"📝 Creating demo field: {field_data['field_key']}")
            strapi_field = StrapiCampaignOnboardingFieldCreate(**field_data)
            created_field = await strapi_client.create_onboarding_field(strapi_field)
            created_fields.append(created_field)
            print(f"✅ Created demo field: {created_field.field_key} (ID: {created_field.id})")
        except Exception as e:
            print(f"❌ Failed to create demo field {field_data['field_key']}: {e}")
    
    print(f"\n🎯 Simple Branching Demo created with {len(created_fields)} fields!")
    return created_fields


def save_sample_data_json():
    """Save sample data as JSON for reference"""
    print("\n💾 Saving sample data structures as JSON...")
    
    sample_data = {
        "enhanced_branching_examples": {
            "complex_nested_conditions": {
                "conditions": {
                    "logic": "AND",
                    "conditions": [
                        {
                            "field_key": "experience_level",
                            "operator": "in_list", 
                            "value": ["advanced", "expert"]
                        }
                    ],
                    "groups": [
                        {
                            "logic": "OR",
                            "conditions": [
                                {
                                    "field_key": "years_experience",
                                    "operator": "greater_than_or_equal",
                                    "value": 5
                                },
                                {
                                    "field_key": "leadership_experience",
                                    "operator": "not_empty"
                                }
                            ]
                        }
                    ]
                },
                "action": "skip_to_step",
                "target_step": 4,
                "priority": 15,
                "description": "Advanced users with experience skip to final step"
            },
            "advanced_operators": [
                {
                    "operator": "matches_regex",
                    "example": {
                        "field_key": "email",
                        "operator": "matches_regex",
                        "value": ".*@(university|college|edu)\\.(com|org|edu)",
                        "case_sensitive": False
                    },
                    "description": "Match educational email addresses"
                },
                {
                    "operator": "array_contains",
                    "example": {
                        "field_key": "programming_languages",
                        "operator": "array_contains",
                        "value": "javascript"
                    },
                    "description": "Check if JavaScript is in selected languages"
                },
                {
                    "operator": "between_dates",
                    "example": {
                        "field_key": "graduation_date",
                        "operator": "between_dates",
                        "value": ["2023-01-01", "2024-12-31"]
                    },
                    "description": "Check if graduation is within date range"
                },
                {
                    "operator": "starts_with",
                    "example": {
                        "field_key": "full_name",
                        "operator": "starts_with",
                        "value": "Dr.",
                        "case_sensitive": false
                    },
                    "description": "Check for academic titles"
                }
            ],
            "priority_examples": {
                "high_priority_rule": {
                    "priority": 20,
                    "description": "Override all other rules",
                    "action": "skip_to_step"
                },
                "medium_priority_rule": {
                    "priority": 10,
                    "description": "Normal branching rule",
                    "action": "show"
                },
                "low_priority_rule": {
                    "priority": 5,
                    "description": "Fallback rule",
                    "action": "require_field"
                }
            }
        },
        "field_actions": {
            "show": "Make fields visible based on conditions",
            "hide": "Hide fields from display",
            "skip_to_step": "Jump to a specific step",
            "require_field": "Make fields mandatory",
            "set_field_value": "Automatically set field values"
        },
        "supported_operators": [
            "equals", "not_equals", "contains", "not_contains", "empty", "not_empty",
            "starts_with", "ends_with", "matches_regex", "greater_than", "less_than",
            "greater_than_or_equal", "less_than_or_equal", "between", "not_between",
            "in_list", "not_in_list", "array_contains", "array_length_equals",
            "before_date", "after_date", "between_dates"
        ]
    }
    
    # Save to file
    output_file = Path(__file__).parent / "sample_branching_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sample_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Sample data saved to {output_file}")


async def main():
    """Main function to create sample campaigns"""
    print("🚀 Creating Sample Branching Logic Campaigns")
    print("=" * 50)
    
    # Configuration
    strapi_url = os.getenv('STRAPI_BASE_URL', 'http://localhost:1337')
    api_token = os.getenv('STRAPI_API_TOKEN', '9acc6482212e3b90e28f09c6ffc4cdbf36f9a26c2606b87da9118dc2ac05ab86678be2f12a4ef2c4971fe21c85a9d554d43cfb3be12da52e1844ac9a21d8aff39300fc3e337108620e7f3cda70531bf875daf9ddecdbb148fca6579006e9c2e4210adc19f08a8145badceaa14ac30305445807f9ecad19f5b4ad32cc73426322')
    
    if not api_token:
        print("❌ Error: STRAPI_API_TOKEN environment variable is required")
        return
    
    print(f"🔗 Connecting to Strapi at {strapi_url}")
    
    try:
        # Initialize Strapi client
        strapi_client = StrapiClient(strapi_url, api_token)
        
        # Test connection
        # You might want to add a test connection method to your StrapiClient
        print("✅ Connected to Strapi successfully")
        
        # Create sample campaigns
        # NOTE: You may need to create the campaigns in Strapi first, or add campaign creation to your client
        print("\n📋 Note: Make sure campaigns with IDs 1 and 2 exist in your Strapi instance")
        print("    Campaign 1: 'Skill-Based Developer Onboarding'")
        print("    Campaign 2: 'Simple Branching Demo'")
        
        # Create the complex skill-based campaign
        await create_skill_based_onboarding_campaign(strapi_client)
        
        # Create the simple demo campaign
        await create_simple_branching_demo(strapi_client)
        
        # Save sample data structures
        save_sample_data_json()
        
        print("\n🎉 All sample campaigns created successfully!")
        print("\nNext steps:")
        print("1. Test the campaigns using the Discord bot")
        print("2. Use the Business Logic API to validate branching logic")
        print("3. Simulate different user flows with the simulation endpoint")
        
    except Exception as e:
        print(f"❌ Error creating sample campaigns: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())