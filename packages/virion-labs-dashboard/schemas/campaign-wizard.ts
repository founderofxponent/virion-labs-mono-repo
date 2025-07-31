import { CampaignFormData, CampaignTemplate } from './campaign';
import { Client } from './client';
import { OnboardingQuestion } from './campaign-onboarding-field';

export type VitalsTabData = Pick<CampaignFormData, 'name' | 'client' | 'campaign_template' | 'description'>;

export interface VitalsTabProps {
  formData: VitalsTabData;
  handleFieldChange: (field: string, value: any) => void;
  handleTemplateSelect: (templateId: string) => void;
  clients: Client[];
  templates: CampaignTemplate[];
  clientsLoading: boolean;
  templatesLoading: boolean;
}

export type PlacementAndScheduleData = Pick<CampaignFormData, 'guild_id' | 'channel_id' | 'start_date' | 'end_date'>;

export interface PlacementAndScheduleTabProps {
    formData: PlacementAndScheduleData;
    handleFieldChange: (field: string, value: any) => void;
}

export type BotIdentityData = Pick<CampaignFormData, 'bot_name' | 'brand_logo_url' | 'brand_color' | 'bot_personality' | 'bot_response_style'>;

export interface BotIdentityTabProps {
    formData: BotIdentityData;
    handleFieldChange: (field: string, value: any) => void;
}

export type OnboardingFlowData = Pick<CampaignFormData, 'welcome_message'>;

export interface OnboardingFlowTabProps {
    formData: OnboardingFlowData;
    handleFieldChange: (field: string, value: any) => void;
    questions: OnboardingQuestion[];
    onQuestionsChange: (questions: OnboardingQuestion[]) => void;
}

export type AccessAndModerationData = Pick<CampaignFormData, 'auto_role_assignment' | 'target_role_ids' | 'moderation_enabled' | 'rate_limit_per_user'>;

export interface AccessAndModerationTabProps {
    formData: AccessAndModerationData;
    handleFieldChange: (field: string, value: any) => void;
}

export interface OnboardingQuestionsFormProps {
    questions: OnboardingQuestion[];
    onQuestionsChange: (questions: OnboardingQuestion[]) => void;
}