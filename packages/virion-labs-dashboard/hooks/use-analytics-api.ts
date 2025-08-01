import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import api from "@/lib/api";

// Zod Schemas for validation
export const campaignExportStatsSchema = z.object({
  campaign_id: z.string(),
  campaign_name: z.string(),
  total_responses: z.number(),
  completed_responses: z.number(),
});

export const onboardingExportResponseSchema = z.object({
  download_url: z.string().url(),
  filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  expires_at: z.string().datetime(),
  campaigns_summary: z.array(campaignExportStatsSchema),
});

export const onboardingExportRequestSchema = z.object({
  select_mode: z.enum(['all', 'multiple', 'single']),
  campaign_ids: z.array(z.string()).optional(),
  file_format: z.enum(['csv', 'json']).default('csv'),
  date_range: z.enum(['7', '30', '90', '365', 'all']).default('all'),
});

// TypeScript Types
export type OnboardingExportRequest = z.infer<typeof onboardingExportRequestSchema>;
export type OnboardingExportResponse = z.infer<typeof onboardingExportResponseSchema>;
export type CampaignExportStats = z.infer<typeof campaignExportStatsSchema>;

// API Hook
export const useExportOnboardingData = () => {
  return useMutation<OnboardingExportResponse, Error, OnboardingExportRequest>({
    mutationFn: async (requestData: OnboardingExportRequest) => {
      const validatedData = onboardingExportRequestSchema.parse(requestData);

      const response = await api.post('/api/v1/analytics/export/onboarding-data', validatedData);

      if (response.status !== 202) {
        throw new Error(response.data.detail || 'Failed to export data.');
      }

      return onboardingExportResponseSchema.parse(response.data);
    },
  });
};