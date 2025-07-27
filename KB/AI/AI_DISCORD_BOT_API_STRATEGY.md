# API Strategy for AI-Powered Discord Bot
**Package Integration: `virion-labs-discord-bot-ai` ↔ `virion-labs-business-logic-api`**

**Date:** 2025-07-27  
**Status:** Technical Specification  
**Author:** Claude Code  

## Overview

This document outlines the comprehensive API strategy for integrating the new AI-powered Discord bot with the unified business logic API. The strategy focuses on extending the existing API architecture to support conversational AI workflows while maintaining compatibility with the current dashboard and MCP server integrations.

## API Architecture Extensions

### Current API Structure (Preserved)
```
/api/v1/
├── workflows/          # Multi-step business processes
├── operations/         # Single-step business actions  
├── integrations/       # External service communication
└── admin/             # Platform administration
```

### New AI-Specific Extensions
```
/api/v1/
├── workflows/
│   ├── ai-onboarding/          # AI-driven onboarding workflows
│   ├── ai-campaign-access/     # AI-processed access requests
│   └── ai-conversation/        # Conversation management workflows
├── operations/
│   ├── ai-bot/                 # AI bot-specific operations
│   ├── ai-analytics/           # AI performance monitoring
│   └── conversation/           # Conversation state management
└── integrations/
    └── ai-services/            # External AI service integrations
```

## Detailed API Endpoints

### 1. AI Conversation Management

#### Initialize Conversation
```http
POST /api/v1/workflows/ai-conversation/initialize
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "discord_user_id": "123456789012345678",
  "discord_username": "user#1234", 
  "channel_id": "987654321098765432",
  "initial_intent": "campaign_discovery",
  "context": {
    "channel_type": "join_campaigns",
    "user_roles": ["Verified"],
    "referral_code": "abc123"
  }
}
```

**Response:**
```json
{
  "conversation_id": "conv_abc123",
  "state": "initialized",
  "next_action": {
    "type": "bot_response",
    "message": "Hi! I'm here to help you discover campaigns. What type of campaigns interest you?",
    "suggested_responses": ["Fitness", "Beauty", "Tech", "Show me all"]
  }
}
```

#### Process User Message
```http
POST /api/v1/workflows/ai-conversation/process-message
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "conversation_id": "conv_abc123",
  "user_message": "I'm interested in fitness campaigns",
  "message_metadata": {
    "timestamp": "2025-07-27T10:30:00Z",
    "channel_id": "987654321098765432"
  }
}
```

**Response:**
```json
{
  "intent_recognition": {
    "intent": "campaign_discovery_fitness",
    "confidence": 0.95,
    "entities": {
      "category": "fitness",
      "interest_level": "high"
    }
  },
  "bot_response": {
    "message": "Great! I found 3 active fitness campaigns. Here are your options:\n\n1. **Summer Fitness Challenge** - $500 payout + bonuses\n2. **Healthy Living Brand** - $300 + product samples\n3. **Workout Gear Review** - $200 + free gear\n\nWhich one interests you most?",
    "action_buttons": [
      {"text": "Summer Fitness", "action": "select_campaign_1"},
      {"text": "Healthy Living", "action": "select_campaign_2"}, 
      {"text": "Workout Gear", "action": "select_campaign_3"},
      {"text": "Tell me more", "action": "get_details"}
    ]
  },
  "conversation_state": "campaign_selection",
  "next_expected_input": "campaign_selection"
}
```

#### Complete Conversation
```http
POST /api/v1/workflows/ai-conversation/complete
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "conversation_id": "conv_abc123",
  "completion_type": "application_submitted",
  "final_data": {
    "selected_campaign_id": "camp_xyz789",
    "application_responses": {
      "email": "user@example.com",
      "experience": "3 years fitness coaching",
      "social_metrics": {
        "instagram_followers": 50000,
        "engagement_rate": 0.045
      }
    }
  }
}
```

### 2. AI-Driven Onboarding Workflows

#### Start AI Onboarding
```http
POST /api/v1/workflows/ai-onboarding/start
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "discord_user_id": "123456789012345678",
  "campaign_id": "camp_xyz789",
  "conversation_id": "conv_abc123",
  "user_context": {
    "referral_source": "invite_link_abc",
    "channel_joined_from": "general",
    "previous_applications": 0
  }
}
```

**Response:**
```json
{
  "onboarding_session_id": "onb_def456",
  "required_fields": [
    {
      "field_id": "email",
      "field_type": "email",
      "prompt": "What's your email address?",
      "validation_rules": ["required", "email_format"]
    },
    {
      "field_id": "experience", 
      "field_type": "text",
      "prompt": "Tell me about your fitness background and experience",
      "validation_rules": ["required", "min_length:50"]
    }
  ],
  "current_field_index": 0,
  "total_fields": 8
}
```

#### Process Onboarding Response
```http
POST /api/v1/workflows/ai-onboarding/process-response
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "onboarding_session_id": "onb_def456",
  "field_id": "email",
  "user_response": "my email is john.doe@gmail.com",
  "raw_message": "my email is john.doe@gmail.com"
}
```

**Response:**
```json
{
  "validation_result": {
    "is_valid": true,
    "extracted_value": "john.doe@gmail.com",
    "confidence": 0.98
  },
  "next_field": {
    "field_id": "experience",
    "field_type": "text", 
    "prompt": "Perfect! Now tell me about your fitness background and experience",
    "validation_rules": ["required", "min_length:50"]
  },
  "progress": {
    "current_field": 2,
    "total_fields": 8,
    "completion_percentage": 25
  }
}
```

#### Complete AI Onboarding
```http
POST /api/v1/workflows/ai-onboarding/submit-application
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "onboarding_session_id": "onb_def456",
  "final_responses": {
    "email": "john.doe@gmail.com",
    "experience": "I'm a certified personal trainer with 3 years experience...",
    "social_metrics": {
      "instagram": "@johndoe_fitness",
      "followers": 50000,
      "engagement_rate": 0.045
    },
    "portfolio": ["https://instagram.com/johndoe_fitness", "https://youtube.com/johndoe"]
  },
  "conversation_transcript": [
    {"speaker": "bot", "message": "What's your email?", "timestamp": "2025-07-27T10:30:00Z"},
    {"speaker": "user", "message": "my email is john.doe@gmail.com", "timestamp": "2025-07-27T10:30:15Z"}
  ]
}
```

**Response:**
```json
{
  "application_id": "app_ghi789",
  "status": "pending_review",
  "estimated_review_time": "24 hours",
  "admin_notification_sent": true,
  "user_confirmation_message": "Thank you for your application! Our team will review it within 24 hours and get back to you."
}
```

### 3. AI Bot Operations

#### Parse Intent
```http
POST /api/v1/operations/ai-bot/parse-intent
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "user_message": "I want to apply for fitness campaigns",
  "context": {
    "conversation_history": [],
    "user_profile": {
      "discord_roles": ["Verified"],
      "previous_applications": 0
    },
    "channel_context": "join_campaigns"
  }
}
```

**Response:**
```json
{
  "primary_intent": {
    "name": "campaign_application",
    "confidence": 0.92,
    "subcategory": "fitness"
  },
  "entities": {
    "category": "fitness",
    "action": "apply"
  },
  "suggested_response_type": "campaign_discovery",
  "confidence_threshold_met": true
}
```

#### Get Available Campaigns
```http
GET /api/v1/operations/ai-bot/available-campaigns
Authorization: Bearer {bot_token}
Query Parameters:
- user_id: 123456789012345678
- category: fitness
- user_level: beginner
- channel_context: join_campaigns

```

**Response:**
```json
{
  "campaigns": [
    {
      "id": "camp_xyz789",
      "title": "Summer Fitness Challenge",
      "description": "Join our 30-day fitness transformation campaign",
      "payout": "$500 + performance bonuses",
      "requirements": {
        "min_followers": 10000,
        "content_type": ["video", "images"],
        "experience_level": "intermediate"
      },
      "match_score": 0.85,
      "match_reasons": ["Category match", "Follower count suitable"]
    }
  ],
  "total_matches": 3,
  "personalized_message": "Based on your fitness background, these campaigns would be perfect for you!"
}
```

#### Update Conversation State
```http
PUT /api/v1/operations/ai-bot/conversation-state/{conversation_id}
Authorization: Bearer {bot_token}
Content-Type: application/json

{
  "state_update": {
    "current_flow": "onboarding",
    "collected_data": {
      "email": "john.doe@gmail.com",
      "category_preference": "fitness"
    },
    "next_expected_input": "experience_description",
    "context": {
      "selected_campaign": "camp_xyz789",
      "application_started": true
    }
  }
}
```

### 4. Admin Review & Management (MCP Integration)

#### Get Pending AI Applications
```http
GET /api/v1/operations/admin/ai-applications/pending
Authorization: Bearer {admin_token}
Query Parameters:
- status: pending
- campaign_id: optional
- date_range: optional
- limit: 50
```

**Response:**
```json
{
  "applications": [
    {
      "application_id": "app_ghi789",
      "applicant": {
        "discord_user_id": "123456789012345678",
        "discord_username": "johndoe#1234"
      },
      "campaign": {
        "id": "camp_xyz789", 
        "title": "Summer Fitness Challenge"
      },
      "application_data": {
        "email": "john.doe@gmail.com",
        "experience": "I'm a certified personal trainer...",
        "social_metrics": {
          "followers": 50000,
          "engagement_rate": 0.045
        }
      },
      "conversation_summary": {
        "total_messages": 12,
        "completion_time": "8 minutes",
        "ai_confidence_scores": [0.95, 0.88, 0.92]
      },
      "submitted_at": "2025-07-27T10:45:00Z",
      "auto_score": 8.5
    }
  ],
  "total_pending": 15,
  "priority_applications": 3
}
```

#### Process AI Application
```http
POST /api/v1/workflows/admin/process-ai-application
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "application_id": "app_ghi789",
  "decision": "approve",
  "admin_notes": "Strong fitness background, good engagement metrics",
  "approval_details": {
    "role_to_assign": "Fitness_Influencer",
    "campaign_access_level": "standard",
    "welcome_message_template": "fitness_welcome",
    "onboarding_bonus": 50
  }
}
```

**Response:**
```json
{
  "processing_result": {
    "status": "success",
    "actions_completed": [
      "Application status updated to approved",
      "Discord role 'Fitness_Influencer' assigned",
      "Campaign access granted",
      "Welcome DM sent to user",
      "Onboarding bonus of $50 credited"
    ],
    "user_notification_sent": true,
    "processing_time": "2.3 seconds"
  }
}
```

### 5. AI Analytics & Monitoring

#### Get Conversation Analytics
```http
GET /api/v1/operations/ai-analytics/conversation-metrics
Authorization: Bearer {admin_token}
Query Parameters:
- time_range: last_7_days
- metric_type: completion_rate,intent_accuracy,user_satisfaction
```

**Response:**
```json
{
  "metrics": {
    "conversation_completion_rate": 0.87,
    "intent_recognition_accuracy": 0.93,
    "average_conversation_duration": "6.5 minutes",
    "user_satisfaction_score": 4.2,
    "total_conversations": 1247,
    "successful_applications": 892
  },
  "trends": {
    "completion_rate_trend": "+5.2%",
    "accuracy_improvement": "+2.1%"
  }
}
```

#### Get AI Performance Report
```http
GET /api/v1/operations/ai-analytics/performance-report
Authorization: Bearer {admin_token}
Query Parameters:
- campaign_id: optional
- date_range: last_30_days
```

## API Authentication & Security

### Bot Authentication
```http
Authorization: Bearer {bot_token}
X-Discord-Guild-ID: {guild_id}
X-Bot-Version: 2.0.0-ai
```

### Admin Authentication
```http
Authorization: Bearer {admin_jwt_token}
X-Admin-Role: platform_administrator
X-MCP-Session-ID: {mcp_session_id}
```

### Rate Limiting
- **AI Bot Operations**: 100 requests/minute per bot instance
- **Conversation Processing**: 10 requests/second per user
- **Admin Operations**: 1000 requests/minute per admin
- **Analytics Endpoints**: 50 requests/minute per admin

### Security Measures
1. **Request Validation**: All requests validated against schema
2. **User Context Verification**: Discord user ID verification required
3. **Conversation Integrity**: Conversation state tampering protection
4. **Data Encryption**: All conversation data encrypted in transit and at rest
5. **Audit Logging**: Complete audit trail for all admin actions

## Error Handling & Responses

### Standard Error Response Format
```json
{
  "error": {
    "code": "INTENT_RECOGNITION_FAILED",
    "message": "Unable to understand user intent",
    "details": {
      "confidence_score": 0.45,
      "fallback_action": "transfer_to_human",
      "suggested_responses": ["Could you rephrase that?", "Would you like to speak with a human?"]
    },
    "timestamp": "2025-07-27T10:30:00Z",
    "conversation_id": "conv_abc123"
  }
}
```

### Common Error Codes
- `INTENT_RECOGNITION_FAILED`: AI unable to parse user intent
- `CONVERSATION_STATE_INVALID`: Conversation state corruption
- `VALIDATION_FAILED`: User input validation failure
- `CAMPAIGN_NOT_AVAILABLE`: Selected campaign no longer available
- `USER_NOT_ELIGIBLE`: User doesn't meet campaign requirements
- `API_RATE_LIMIT_EXCEEDED`: Too many requests
- `ADMIN_PERMISSION_DENIED`: Insufficient admin permissions

## Implementation Considerations

### Performance Optimization
1. **Conversation State Caching**: Redis-based state management
2. **Intent Recognition Caching**: Cache common intent patterns
3. **Campaign Data Caching**: Cache frequently accessed campaign data
4. **Async Processing**: Queue-based processing for heavy operations

### Scalability Planning
1. **Horizontal Scaling**: Stateless API design for easy scaling
2. **Database Optimization**: Indexed queries for conversation retrieval
3. **Load Balancing**: Multiple bot instances with shared state
4. **AI Service Integration**: External AI service with fallback options

### Monitoring & Observability
1. **Real-time Metrics**: Conversation success rates, response times
2. **Alert System**: Automated alerts for AI accuracy drops
3. **Performance Dashboards**: Admin dashboards for system health
4. **User Feedback**: Built-in feedback collection for continuous improvement

This API strategy provides a comprehensive foundation for implementing the AI-powered Discord bot while maintaining compatibility with existing systems and enabling sophisticated admin management through MCP server integration.