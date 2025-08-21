import { 
  OnboardingFieldValidation, 
  OnboardingFieldBranching,
  ValidationResult,
  OnboardingFlowState,
  EnhancedOnboardingQuestion
} from '@/schemas/campaign-onboarding-field';

/**
 * Validates a field response against its validation rules
 */
export function validateFieldResponse(
  value: any,
  validationRules: OnboardingFieldValidation[]
): ValidationResult {
  if (!validationRules || !Array.isArray(validationRules) || validationRules.length === 0) {
    return { valid: true };
  }

  const errors: string[] = [];

  for (const rule of validationRules) {
    const result = validateSingleRule(value, rule);
    if (!result.valid) {
      errors.push(result.message || 'Validation failed');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0 ? errors[0] : undefined
  };
}

/**
 * Validates a single validation rule
 */
function validateSingleRule(value: any, rule: OnboardingFieldValidation): ValidationResult {
  const stringValue = String(value || '');
  const numericValue = Number(value);
  
  switch (rule.type) {
    case 'required':
      if (!value || stringValue.trim() === '') {
        return { valid: false, message: rule.message || 'This field is required' };
      }
      break;

    case 'min':
      if (stringValue.length < Number(rule.value)) {
        return { 
          valid: false, 
          message: rule.message || `Minimum ${rule.value} characters required` 
        };
      }
      break;

    case 'max':
      if (stringValue.length > Number(rule.value)) {
        return { 
          valid: false, 
          message: rule.message || `Maximum ${rule.value} characters allowed` 
        };
      }
      break;

    case 'contains':
      const searchValue = rule.case_sensitive ? stringValue : stringValue.toLowerCase();
      const targetValue = rule.case_sensitive ? String(rule.value) : String(rule.value).toLowerCase();
      if (!searchValue.includes(targetValue)) {
        return { 
          valid: false, 
          message: rule.message || `Must contain "${rule.value}"` 
        };
      }
      break;

    case 'not_contains':
      const searchValueNot = rule.case_sensitive ? stringValue : stringValue.toLowerCase();
      const targetValueNot = rule.case_sensitive ? String(rule.value) : String(rule.value).toLowerCase();
      if (searchValueNot.includes(targetValueNot)) {
        return { 
          valid: false, 
          message: rule.message || `Must not contain "${rule.value}"` 
        };
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return { 
          valid: false, 
          message: rule.message || 'Must be a valid email address' 
        };
      }
      break;

    case 'url':
      try {
        new URL(stringValue);
      } catch {
        return { 
          valid: false, 
          message: rule.message || 'Must be a valid URL' 
        };
      }
      break;

    case 'numeric':
      if (isNaN(numericValue)) {
        return { 
          valid: false, 
          message: rule.message || 'Must be a valid number' 
        };
      }
      break;

    case 'greater_than':
      if (isNaN(numericValue) || numericValue <= Number(rule.value)) {
        return { 
          valid: false, 
          message: rule.message || `Must be greater than ${rule.value}` 
        };
      }
      break;

    case 'less_than':
      if (isNaN(numericValue) || numericValue >= Number(rule.value)) {
        return { 
          valid: false, 
          message: rule.message || `Must be less than ${rule.value}` 
        };
      }
      break;

    case 'equals':
      const compareValue = rule.case_sensitive ? stringValue : stringValue.toLowerCase();
      const ruleValue = rule.case_sensitive ? String(rule.value) : String(rule.value).toLowerCase();
      if (compareValue !== ruleValue) {
        return { 
          valid: false, 
          message: rule.message || `Must equal "${rule.value}"` 
        };
      }
      break;

    case 'not_equals':
      const compareValueNot = rule.case_sensitive ? stringValue : stringValue.toLowerCase();
      const ruleValueNot = rule.case_sensitive ? String(rule.value) : String(rule.value).toLowerCase();
      if (compareValueNot === ruleValueNot) {
        return { 
          valid: false, 
          message: rule.message || `Must not equal "${rule.value}"` 
        };
      }
      break;

    case 'empty':
      if (stringValue.trim() !== '') {
        return { 
          valid: false, 
          message: rule.message || 'Must be empty' 
        };
      }
      break;

    case 'not_empty':
      if (stringValue.trim() === '') {
        return { 
          valid: false, 
          message: rule.message || 'Must not be empty' 
        };
      }
      break;

    case 'regex':
      try {
        const regex = new RegExp(String(rule.value));
        if (!regex.test(stringValue)) {
          return { 
            valid: false, 
            message: rule.message || 'Invalid format' 
          };
        }
      } catch {
        return { 
          valid: false, 
          message: 'Invalid regex pattern in validation rule' 
        };
      }
      break;

    default:
      console.warn(`Unknown validation rule type: ${rule.type}`);
  }

  return { valid: true };
}

/**
 * Evaluates branching logic to determine which fields should be visible
 */
export function evaluateBranchingLogic(
  responses: Record<string, any>,
  branchingRules: OnboardingFieldBranching[]
): { visibleFields: string[], nextStep?: number } {
  const visibleFields: Set<string> = new Set();
  let nextStep: number | undefined;

  for (const rule of branchingRules) {
    const conditionMet = evaluateCondition(responses, rule.condition);
    
    if (conditionMet) {
      switch (rule.action) {
        case 'show':
          rule.target_fields?.forEach(field => visibleFields.add(field));
          break;
        case 'hide':
          rule.target_fields?.forEach(field => visibleFields.delete(field));
          break;
        case 'skip_to_step':
          if (rule.target_step !== undefined) {
            nextStep = rule.target_step;
          }
          break;
      }
    }
  }

  return {
    visibleFields: Array.from(visibleFields),
    nextStep
  };
}

/**
 * Evaluates a single branching condition
 */
function evaluateCondition(
  responses: Record<string, any>,
  condition: OnboardingFieldBranching['condition']
): boolean {
  const fieldValue = responses[condition.field_key];
  const stringValue = String(fieldValue || '');
  const numericValue = Number(fieldValue);

  switch (condition.operator) {
    case 'equals':
      const compareValue = condition.case_sensitive ? stringValue : stringValue.toLowerCase();
      const conditionValue = condition.case_sensitive ? String(condition.value) : String(condition.value).toLowerCase();
      return compareValue === conditionValue;

    case 'not_equals':
      const compareValueNot = condition.case_sensitive ? stringValue : stringValue.toLowerCase();
      const conditionValueNot = condition.case_sensitive ? String(condition.value) : String(condition.value).toLowerCase();
      return compareValueNot !== conditionValueNot;

    case 'contains':
      const searchValue = condition.case_sensitive ? stringValue : stringValue.toLowerCase();
      const targetValue = condition.case_sensitive ? String(condition.value) : String(condition.value).toLowerCase();
      return searchValue.includes(targetValue);

    case 'not_contains':
      const searchValueNot = condition.case_sensitive ? stringValue : stringValue.toLowerCase();
      const targetValueNot = condition.case_sensitive ? String(condition.value) : String(condition.value).toLowerCase();
      return !searchValueNot.includes(targetValueNot);

    case 'greater_than':
      return !isNaN(numericValue) && numericValue > Number(condition.value);

    case 'less_than':
      return !isNaN(numericValue) && numericValue < Number(condition.value);

    case 'greater_than_or_equal':
      return !isNaN(numericValue) && numericValue >= Number(condition.value);

    case 'less_than_or_equal':
      return !isNaN(numericValue) && numericValue <= Number(condition.value);

    case 'empty':
      return stringValue.trim() === '';

    case 'not_empty':
      return stringValue.trim() !== '';

    default:
      console.warn(`Unknown condition operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Groups questions by step number for sequential modal display
 */
export function groupQuestionsByStep(questions: EnhancedOnboardingQuestion[]): Map<number, EnhancedOnboardingQuestion[]> {
  const grouped = new Map<number, EnhancedOnboardingQuestion[]>();
  
  questions.forEach(question => {
    const step = question.step_number || 1;
    if (!grouped.has(step)) {
      grouped.set(step, []);
    }
    grouped.get(step)!.push(question);
  });

  return grouped;
}

/**
 * Calculates the next step based on current responses and branching logic
 */
export function calculateNextStep(
  currentStep: number,
  responses: Record<string, any>,
  allQuestions: EnhancedOnboardingQuestion[]
): number | null {
  // Check if any questions in current step have branching logic that affects next step
  const currentStepQuestions = allQuestions.filter(q => q.step_number === currentStep);
  
  for (const question of currentStepQuestions) {
    if (question.branching_logic) {
      const result = evaluateBranchingLogic(responses, question.branching_logic);
      if (result.nextStep !== undefined) {
        return result.nextStep;
      }
    }
  }

  // Default: move to next sequential step
  const maxStep = Math.max(...allQuestions.map(q => q.step_number || 1));
  return currentStep < maxStep ? currentStep + 1 : null;
}

/**
 * Validates all responses for a complete onboarding flow
 */
export function validateOnboardingFlow(
  responses: Record<string, any>,
  questions: EnhancedOnboardingQuestion[]
): ValidationResult {
  const errors: string[] = [];

  for (const question of questions) {
    if (question.validation_rules && Array.isArray(question.validation_rules) && question.validation_rules.length > 0) {
      const value = responses[question.field_key];
      const result = validateFieldResponse(value, question.validation_rules);
      
      if (!result.valid && result.errors) {
        errors.push(`${question.field_label}: ${result.errors.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0 ? `Validation failed: ${errors.join('; ')}` : undefined
  };
}