// Enhanced Onboarding Configuration Example
// Copy this to config/enhanced-onboarding.js and customize as needed

module.exports = {
  // Feature flags
  features: {
    // Enable enhanced onboarding with validation and multi-step support
    enhanced_onboarding: true,
    
    // Enable branching logic
    enable_branching: true,
    
    // Enable individual question modals for large steps
    enable_question_flow: true,
    
    // Maximum questions per modal before switching to question flow
    max_questions_per_modal: 5,
  },

  // Validation settings
  validation: {
    // Enable real-time validation feedback
    enable_realtime_validation: true,
    
    // Maximum validation errors to show at once
    max_validation_errors: 3,
    
    // Default validation messages
    default_messages: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      min: 'Too short - minimum {value} characters required',
      max: 'Too long - maximum {value} characters allowed',
      numeric: 'Please enter a valid number',
      contains: 'Must contain "{value}"',
      greater_than: 'Must be greater than {value}',
      less_than: 'Must be less than {value}'
    }
  },

  // Multi-step flow settings
  multi_step: {
    // Enable step progress indicators
    show_progress: true,
    
    // Allow users to go back to previous steps
    allow_step_back: false,
    
    // Auto-advance to next step after completion
    auto_advance: true,
    
    // Timeout for step transitions (milliseconds)
    step_timeout: 300000, // 5 minutes
  },

  // Discord UI settings
  discord_ui: {
    // Embed colors for different states
    colors: {
      primary: '#6366f1',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    
    // Button styles
    buttons: {
      primary_style: 'Primary',
      secondary_style: 'Secondary',
      success_style: 'Success',
      danger_style: 'Danger'
    },
    
    // Embed settings
    embeds: {
      show_thumbnails: true,
      show_footers: true,
      include_timestamps: true,
      max_description_length: 2048
    }
  },

  // Caching settings
  cache: {
    // Cache timeout for onboarding questions (milliseconds)
    questions_cache_timeout: 1800000, // 30 minutes
    
    // Cache timeout for flow state (milliseconds)
    flow_state_timeout: 3600000, // 1 hour
    
    // Maximum cache entries
    max_cache_entries: 1000,
    
    // Clear cache on bot restart
    clear_on_restart: true
  },

  // Error handling
  error_handling: {
    // Retry attempts for failed validations
    validation_retry_attempts: 3,
    
    // Show detailed error messages in development
    show_detailed_errors: process.env.NODE_ENV === 'development',
    
    // Log validation failures
    log_validation_failures: true,
    
    // Fallback to basic onboarding on critical errors
    fallback_to_basic: true
  },

  // Email notifications
  email_notifications: {
    // Send completion emails
    send_completion_emails: true,
    
    // Send progress emails for multi-step flows
    send_progress_emails: false,
    
    // Admin notification settings
    admin_notifications: {
      enabled: true,
      events: ['onboarding_completed', 'validation_failed', 'flow_abandoned']
    }
  },

  // Analytics and logging
  analytics: {
    // Track onboarding completion rates
    track_completion_rates: true,
    
    // Track step abandonment
    track_step_abandonment: true,
    
    // Track validation failures
    track_validation_failures: true,
    
    // Track branching logic usage
    track_branching_usage: true
  },

  // Development settings
  development: {
    // Enable debug logging
    debug_logging: process.env.NODE_ENV === 'development',
    
    // Mock API responses for testing
    mock_api_responses: false,
    
    // Skip role assignments in development
    skip_role_assignments: process.env.NODE_ENV === 'development',
    
    // Test user override
    test_user_id: process.env.TEST_USER_ID || null
  },

  // Example campaign configurations
  example_campaigns: {
    // Simple single-step campaign
    simple_campaign: {
      id: 'simple_123',
      name: 'Simple Onboarding',
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
        }
      ]
    },

    // Multi-step campaign with branching
    advanced_campaign: {
      id: 'advanced_456',
      name: 'Advanced Multi-Step Onboarding',
      questions: [
        // Step 1: Basic Info
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
            },
            {
              condition: {
                field_key: 'user_type',
                operator: 'equals',
                value: 'Brand Representative'
              },
              action: 'skip_to_step',
              target_step: 3
            }
          ],
          discord_integration: {
            step_number: 1,
            component_type: 'select_menu'
          }
        },

        // Step 2: Creator-specific questions
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
            step_number: 2,
            component_type: 'text_input'
          }
        },
        {
          field_key: 'follower_count',
          field_label: 'Approximate follower count',
          field_type: 'number',
          is_required: true,
          validation_rules: [
            { type: 'required', value: true },
            { type: 'numeric', value: true },
            { type: 'greater_than', value: 0, message: 'Must be greater than 0' }
          ],
          discord_integration: {
            step_number: 2,
            component_type: 'text_input'
          }
        },

        // Step 3: Final questions
        {
          field_key: 'experience_level',
          field_label: 'How would you rate your experience level?',
          field_type: 'select',
          field_options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
          is_required: true,
          validation_rules: [
            { type: 'required', value: true }
          ],
          discord_integration: {
            step_number: 3,
            component_type: 'select_menu'
          }
        }
      ]
    }
  }
};