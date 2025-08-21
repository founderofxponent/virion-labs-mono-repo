# Enhanced Onboarding System

The Enhanced Onboarding System provides advanced validation, branching logic, and multi-modal support for Discord bot campaign onboarding flows.

## Features

### ✅ Validation System
- **15 validation types**: required, min/max length, email, URL, numeric, contains, regex, and more
- **Custom error messages**: Personalized feedback for validation failures
- **Case sensitivity control**: For text-based validations
- **Real-time validation**: Immediate feedback during form submission

### 🔀 Branching Logic
- **Conditional field visibility**: Show/hide fields based on user responses
- **Step skipping**: Jump to different steps based on conditions
- **Complex conditions**: Multiple operators (equals, contains, greater than, etc.)
- **Multi-condition support**: Multiple branching rules per field

### 📋 Multi-Modal Support
- **Automatic step grouping**: Questions automatically grouped by step number
- **Sequential modals**: For flows with >5 questions per step
- **Individual question flow**: For very large steps (>5 questions)
- **Progress tracking**: Visual progress indicators and step completion

### 🎯 Discord Integration
- **Smart modal handling**: Respects Discord's 5-question limit per modal
- **Component-based alternatives**: Buttons and select menus for complex interactions
- **Enhanced UI**: Rich embeds with progress indicators and step information
- **Role assignment**: Automatic role assignment upon completion

## Implementation Overview

### Core Components

1. **Enhanced Schema** (`packages/virion-labs-dashboard/schemas/campaign-onboarding-field.ts`)
   - Extended field definitions with validation and branching
   - Type-safe interfaces for all components
   - Flow state management types

2. **Validation Library** (`packages/virion-labs-dashboard/lib/onboarding-validation.ts`)
   - Comprehensive validation functions
   - Branching logic evaluation
   - Flow state calculations

3. **Enhanced Handler** (`packages/virion-labs-discord-bot-mvp/src/handlers/EnhancedOnboardingHandler.js`)
   - Multi-step flow management
   - Validation enforcement
   - Discord interaction handling

4. **UI Components** (`packages/virion-labs-dashboard/components/campaign-wizard/ValidationRulesEditor.tsx`)
   - Visual rule editor for admins
   - Drag-and-drop interface
   - Real-time preview

## Usage Guide

### Basic Setup

1. **Enable Enhanced Onboarding**
   ```javascript
   // config/enhanced-onboarding.js
   module.exports = {
     features: {
       enhanced_onboarding: true,
       enable_branching: true,
       max_questions_per_modal: 5
     }
   };
   ```

2. **Configure Validation Rules**
   ```typescript
   const validationRules: OnboardingFieldValidation[] = [
     {
       type: 'required',
       value: true,
       message: 'This field is required'
     },
     {
       type: 'min',
       value: 3,
       message: 'Minimum 3 characters required'
     },
     {
       type: 'email',
       value: true,
       message: 'Please enter a valid email address'
     }
   ];
   ```

3. **Set Up Branching Logic**
   ```typescript
   const branchingLogic: OnboardingFieldBranching[] = [
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
         field_key: 'experience_level',
         operator: 'equals',
         value: 'Beginner'
       },
       action: 'skip_to_step',
       target_step: 3
     }
   ];
   ```

### Validation Types

| Type | Description | Value Type | Example |
|------|-------------|------------|---------|
| `required` | Field must not be empty | boolean | `{ type: 'required', value: true }` |
| `min` | Minimum character length | number | `{ type: 'min', value: 5 }` |
| `max` | Maximum character length | number | `{ type: 'max', value: 100 }` |
| `email` | Valid email format | boolean | `{ type: 'email', value: true }` |
| `url` | Valid URL format | boolean | `{ type: 'url', value: true }` |
| `numeric` | Must be a number | boolean | `{ type: 'numeric', value: true }` |
| `contains` | Must contain text | string | `{ type: 'contains', value: '@' }` |
| `not_contains` | Must not contain text | string | `{ type: 'not_contains', value: 'spam' }` |
| `greater_than` | Number greater than value | number | `{ type: 'greater_than', value: 18 }` |
| `less_than` | Number less than value | number | `{ type: 'less_than', value: 100 }` |
| `equals` | Must equal specific value | any | `{ type: 'equals', value: 'yes' }` |
| `not_equals` | Must not equal value | any | `{ type: 'not_equals', value: 'no' }` |
| `regex` | Must match regex pattern | string | `{ type: 'regex', value: '^[A-Za-z]+$' }` |
| `empty` | Must be empty | boolean | `{ type: 'empty', value: true }` |
| `not_empty` | Must not be empty | boolean | `{ type: 'not_empty', value: true }` |

### Branching Operators

| Operator | Description | Use Case |
|----------|-------------|----------|
| `equals` | Exact match | User type selection |
| `not_equals` | Not equal to | Exclude specific values |
| `contains` | Contains substring | Text analysis |
| `not_contains` | Doesn't contain | Content filtering |
| `greater_than` | Numeric comparison | Age verification |
| `less_than` | Numeric comparison | Limit checking |
| `greater_than_or_equal` | Numeric comparison | Minimum thresholds |
| `less_than_or_equal` | Numeric comparison | Maximum limits |
| `empty` | Field is empty | Optional field logic |
| `not_empty` | Field has value | Required field dependencies |

### Multi-Step Flow Examples

#### Simple 2-Step Flow
```typescript
const questions = [
  {
    field_key: 'username',
    field_label: 'Username',
    field_type: 'text',
    discord_integration: { step_number: 1 },
    validation_rules: [
      { type: 'required', value: true },
      { type: 'min', value: 3 }
    ]
  },
  {
    field_key: 'bio',
    field_label: 'Tell us about yourself',
    field_type: 'textarea',
    discord_integration: { step_number: 2 },
    validation_rules: [
      { type: 'max', value: 500 }
    ]
  }
];
```

#### Advanced Branching Flow
```typescript
const advancedQuestions = [
  {
    field_key: 'user_type',
    field_label: 'What type of user are you?',
    field_type: 'select',
    field_options: ['Creator', 'Brand', 'Agency'],
    discord_integration: { step_number: 1 },
    branching_logic: [
      {
        condition: { field_key: 'user_type', operator: 'equals', value: 'Creator' },
        action: 'show',
        target_fields: ['platforms', 'followers']
      },
      {
        condition: { field_key: 'user_type', operator: 'equals', value: 'Brand' },
        action: 'skip_to_step',
        target_step: 3
      }
    ]
  },
  {
    field_key: 'platforms',
    field_label: 'Which platforms do you use?',
    field_type: 'multiselect',
    discord_integration: { step_number: 2 },
    validation_rules: [
      { type: 'required', value: true }
    ]
  }
];
```

## Discord Interaction Flow

### Single Modal Flow (≤5 questions)
1. User clicks "Start Onboarding"
2. Bot shows modal with all questions
3. User submits responses
4. Validation occurs
5. Roles assigned upon success

### Multi-Step Flow (>5 questions or with branching)
1. User clicks "Start Onboarding"
2. Bot shows step overview
3. User clicks "Begin Step 1"
4. Bot shows modal for step 1 questions
5. User submits step responses
6. Validation and branching logic applied
7. Bot shows next step or completion

### Question Flow (>5 questions per step)
1. User starts step
2. Bot shows "Question 1 of N"
3. User answers in individual modal
4. Bot shows progress and next question
5. Continues until step complete

## Configuration Options

### Feature Flags
```javascript
features: {
  enhanced_onboarding: true,        // Enable enhanced system
  enable_branching: true,           // Enable branching logic
  enable_question_flow: true,       // Enable individual questions
  max_questions_per_modal: 5        // Modal question limit
}
```

### Validation Settings
```javascript
validation: {
  enable_realtime_validation: true, // Immediate feedback
  max_validation_errors: 3,         // Error display limit
  default_messages: {               // Fallback messages
    required: 'This field is required',
    email: 'Please enter a valid email',
    // ... more defaults
  }
}
```

### UI Customization
```javascript
discord_ui: {
  colors: {
    primary: '#6366f1',
    success: '#10b981',
    error: '#ef4444'
  },
  embeds: {
    show_thumbnails: true,
    include_timestamps: true,
    max_description_length: 2048
  }
}
```

## Testing

Run the test suite to verify functionality:

```bash
cd packages/virion-labs-discord-bot-mvp
node test/enhanced-onboarding.test.js
```

### Test Coverage
- ✅ All validation types
- ✅ Branching logic evaluation  
- ✅ Question grouping
- ✅ Step calculation
- ✅ Complex validation chains
- ✅ Edge cases and error handling

## Migration from Basic Onboarding

The enhanced system is backward compatible. To migrate:

1. **Enable feature flag**: Set `enhanced_onboarding: true`
2. **Add validation rules**: Existing fields work without rules
3. **Configure step numbers**: Default is step 1 for all questions
4. **Test thoroughly**: Verify existing flows still work
5. **Add branching gradually**: Start with simple show/hide logic

## Troubleshooting

### Common Issues

1. **Questions not grouping correctly**
   - Check `discord_integration.step_number` values
   - Ensure step numbers are sequential

2. **Validation not working**
   - Verify `validation_rules` array format
   - Check rule types match documentation

3. **Branching logic not firing**
   - Confirm `field_key` references are correct
   - Check condition values match user responses

4. **Modals timing out**
   - Reduce questions per step
   - Enable `enable_question_flow` for large steps

### Debug Mode

Enable debug logging:
```javascript
development: {
  debug_logging: true,
  show_detailed_errors: true
}
```

## Performance Considerations

- **Caching**: Questions and flow state are cached for 30 minutes
- **Memory usage**: Cache is limited to 1000 entries
- **Validation**: Client-side validation reduces API calls
- **Branching**: Logic evaluation is optimized for performance

## Security Notes

- **Input validation**: All user input is validated server-side
- **XSS prevention**: Text inputs are sanitized
- **Rate limiting**: Built into Discord's interaction system
- **Data privacy**: Responses are encrypted in transit

## Future Enhancements

- 🔄 **Flow versioning**: A/B testing different onboarding flows
- 📊 **Analytics integration**: Track completion rates and drop-off points
- 🌐 **Internationalization**: Multi-language support
- 🔌 **Plugin system**: Custom validation types and actions
- 📱 **Mobile optimization**: Improved mobile Discord experience