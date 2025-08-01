import { Media, Campaign } from '@/schemas';

export interface Client {
  id: number;
  documentId?: string;
  name: string;
  industry: string;
  logo?: Media;
  influencers?: number;
  client_status?: 'active' | 'inactive';
  join_date?: string; // Date field from Strapi
  website?: string;
  primary_contact?: string;
  contact_email?: string;
  campaigns?: Campaign[];
  campaign_count?: number;
}