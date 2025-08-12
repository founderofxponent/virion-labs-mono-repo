import { Media, Campaign } from '@/schemas';

export interface Client {
  id: string;
  documentId?: string;
  name: string;
  industry: string;
  logo?: Media;
  influencers?: number;
  client_status?: 'pending' | 'active' | 'inactive' | null;
  join_date?: string; // Date field from Strapi
  website?: string;
  primary_contact?: string;
  contact_email?: string;
  campaigns?: Campaign[];
  campaign_count?: number;
  created_at?: string;
  updated_at?: string;
}