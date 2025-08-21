import { Campaign } from "@/schemas";

/**
 * Validation rule for onboarding field
 */
export interface OnboardingFieldValidation {
  type: 'min' | 'max' | 'contains' | 'not_contains' | 'regex' | 'required' | 'email' | 'url' | 'numeric' | 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'empty' | 'not_empty';
  value: string | number | boolean;
  message?: string;
  case_sensitive?: boolean;
}

/**
 * Branching logic for conditional questions
 */
export interface OnboardingFieldBranching {
  condition: {
    field_key: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'empty' | 'not_empty';
    value: any;
    case_sensitive?: boolean;
  };
  action: 'show' | 'hide' | 'skip_to_step';
  target_fields?: string[]; // field_keys to show/hide
  target_step?: number; // step to skip to
}

/**
 * Discord-specific integration settings
 */
export interface DiscordIntegration {
  collect_in_dm?: boolean;
  show_in_embed?: boolean;
  step_number?: number;
  modal_group?: string;
  component_type?: 'text_input' | 'select_menu' | 'button' | 'modal';
}

/**
 * Base interface for all onboarding field variations.
 */
export interface BaseOnboardingField {
  documentId: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'email' | 'number' | 'boolean' | 'url' | 'select' | 'multiselect' | 'textarea';
  field_placeholder?: string;
  field_description?: string;
  field_options?: any;
  validation_rules?: OnboardingFieldValidation[];
  branching_logic?: OnboardingFieldBranching[];
  discord_integration?: DiscordIntegration;
}

/**
 * Represents a single field in the campaign onboarding process.
 * Aligned with the Strapi schema for campaign_onboarding_fields.
 */
export interface CampaignOnboardingField extends BaseOnboardingField {
  documentId: string;
  id: number;
  field_key: string;
  field_label: string;
  field_type: string;
  field_placeholder?: string;
  field_description?: string;
  field_options?: any;
  is_required?: boolean;
  is_enabled?: boolean;
  sort_order?: number;
  step_number?: number;
  step_role_ids?: string[];
  campaign?: Campaign;
}

/**
 * Represents an onboarding question in the Campaign Wizard form.
 * It is a variation of the CampaignOnboardingField, used for local state management.
 */
export interface OnboardingQuestion extends Omit<BaseOnboardingField, 'documentId' | 'id'> {
  id?: string;
  field_key: string;
  field_label: string;
  field_type: string;
  field_placeholder?: string;
  field_description?: string;
  field_options?: any;
  is_required: boolean;
  is_enabled: boolean;
  sort_order: number;
  step_number?: number;
  step_role_ids?: string[];
  validation_rules?: OnboardingFieldValidation[];
  branching_logic?: OnboardingFieldBranching[];
}

/**
 * Data structure for updating an onboarding field.
 */
export type UpdateOnboardingFieldData = Partial<Omit<CampaignOnboardingField, 'id' | 'campaign'>>;

/**
 * Data structure for creating a new onboarding field.
 */
export type CreateOnboardingFieldData = Omit<CampaignOnboardingField, 'id' | 'campaign' | 'documentId'> & { campaign_id: string };
export interface OnboardingTemplate {
  id: string
  template_name: string
  template_description?: string
  field_config: OnboardingFieldConfig[]
  is_default: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface OnboardingFieldConfig {
  id: string
  question: string
  type: string
  required: boolean
  enabled: boolean
  sort_order: number
  validation_rules?: OnboardingFieldValidation[]
  branching_logic?: OnboardingFieldBranching[]
  discord_integration?: DiscordIntegration
}

/**
 * Validation result for field responses
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
  errors?: string[];
}

/**
 * Onboarding flow state for multi-step processes
 */
export interface OnboardingFlowState {
  campaign_id: string;
  user_id: string;
  current_step: number;
  responses: Record<string, any>;
  visible_fields: string[];
  completed_steps: number[];
  total_steps: number;
}

/**
 * Enhanced onboarding question with step grouping
 */
export interface EnhancedOnboardingQuestion extends OnboardingQuestion {
  step_number: number;
  modal_group?: string;
  depends_on?: string[];
}