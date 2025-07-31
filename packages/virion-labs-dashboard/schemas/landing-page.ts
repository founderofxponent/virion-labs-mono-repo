import { Media, Campaign } from '@/schemas';

export interface LandingPageTemplate {
  id: number;
  name: string;
  Description: string;
  preview_image_url?: string;
  campaign_types: any;
  category?: string;
  template_structure: any;
  default_content: any;
  customizable_fields: any;
  default_offer_title?: string;
  default_offer_description?: string;
  default_offer_highlights?: any;
  default_offer_value?: string;
  default_hero_image_url?: string;
  default_video_url?: string;
  default_what_you_get?: string;
  default_how_it_works?: string;
  default_requirements?: string;
  default_support_info?: string;
  color_scheme?: any;
  layout_config?: any;
  is_active: boolean;
  is_default: boolean;
}

export interface CampaignLandingPage {
  id: number;
  offer_title?: any;
  offer_description?: string;
  offer_highlights?: any;
  offer_value?: string;
  offer_expiry_date?: string;
  hero_image_url?: Media;
  product_images?: any;
  video_url?: string;
  what_you_get?: string;
  how_it_works?: string;
  requirements?: string;
  support_info?: string;
  inherited_from_template?: boolean;
  landing_page_template?: LandingPageTemplate;
  campaign?: Campaign;
}