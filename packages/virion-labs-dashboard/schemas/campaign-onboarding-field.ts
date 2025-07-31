import { Campaign } from "@/schemas";

/**
 * Base interface for all onboarding field variations.
 */
export interface BaseOnboardingField {
  documentId: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'email' | 'number' | 'boolean' | 'url' | 'select' | 'multiselect';
  field_placeholder?: string;
  field_description?: string;
  field_options?: any;
  validation_rules?: any;
  discord_integration?: any;
}

/**
 * Represents a single field in the campaign onboarding process.
 * Aligned with the Strapi schema for campaign_onboarding_fields.
 */
export interface CampaignOnboardingField extends BaseOnboardingField {
  id: number;
  is_required?: boolean;
  is_enabled?: boolean;
  sort_order?: number;
  campaign?: Campaign;
}

/**
 * Represents an onboarding question in the Campaign Wizard form.
 * It is a variation of the CampaignOnboardingField, used for local state management.
 */
export interface OnboardingQuestion extends Omit<BaseOnboardingField, 'documentId'> {
  id?: string;
  is_required: boolean;
  is_enabled: boolean;
  sort_order: number;
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
  key: string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'url' | 'boolean'
  placeholder?: string
  description?: string
  options?: string[]
  required: boolean
  enabled: boolean
  sort_order: number
  discord_integration?: {
    collect_in_dm: boolean
    show_in_embed: boolean
    trigger_after?: string
  }
}