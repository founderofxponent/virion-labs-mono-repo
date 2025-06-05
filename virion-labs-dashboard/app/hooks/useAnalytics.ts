import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface CampaignOverview {
  campaign_id: string;
  campaign_name: string;
  client_name: string;
  total_users_started: number;
  total_users_completed: number;
  completion_rate: number;
  total_fields: number;
  required_fields: number;
  active_fields: number;
  avg_field_completion_rate: number;
  responses_last_7_days: number;
}

interface DailyMetric {
  date: string;
  campaign_id: string;
  unique_users_started: number;
  unique_users_completed: number;
  total_responses: number;
  avg_completion_time_minutes: number;
}

interface FieldPerformance {
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  sort_order: number;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  drop_off_rate: number;
  common_values?: Array<{
    value: string;
    count: number;
    percentage: number;
  }>;
}

interface UserJourney {
  campaign_id: string;
  discord_user_id: string;
  discord_username: string;
  journey_start: string;
  journey_latest_update: string;
  journey_duration_minutes: number;
  fields_completed: number;
  journey_completed: boolean;
  referral_id?: string;
  referral_link_id?: string;
}

interface JourneyInsights {
  summary: {
    total_journeys: number;
    completed_journeys: number;
    completion_rate: number;
    avg_duration_minutes: number;
    median_duration_minutes: number;
    avg_fields_completed: number;
  };
  duration_distribution: Array<{
    duration_bucket: string;
    user_count: number;
    completed_count: number;
    completion_rate: number;
  }>;
}

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campaign Overview Data
  const [campaignOverviews, setCampaignOverviews] = useState<CampaignOverview[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);

  // Field Performance Data
  const [fieldPerformance, setFieldPerformance] = useState<FieldPerformance[]>([]);

  // User Journey Data
  const [journeyInsights, setJourneyInsights] = useState<JourneyInsights | null>(null);
  const [recentJourneys, setRecentJourneys] = useState<UserJourney[]>([]);

  const fetchCampaignOverview = useCallback(async (campaignId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (campaignId) {
        params.append('campaignId', campaignId);
      }

      const response = await fetch(`/api/analytics/campaign-overview?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaign overview');
      }

      const data = await response.json();
      
      if (data.success) {
        setCampaignOverviews(data.data.overview?.campaigns || []);
        setDailyMetrics(data.data.dailyMetrics || []);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaign overview';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFieldPerformance = useCallback(async (campaignId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/field-performance?campaignId=${campaignId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch field performance');
      }

      const data = await response.json();
      
      if (data.success) {
        setFieldPerformance(data.data.fieldPerformance?.field_performance || []);
      } else {
        throw new Error(data.error || 'Failed to fetch field performance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch field performance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserJourneyInsights = useCallback(async (campaignId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/user-journey?campaignId=${campaignId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user journey insights');
      }

      const data = await response.json();
      
      if (data.success) {
        setJourneyInsights(data.data.insights || null);
        setRecentJourneys(data.data.recentJourneys || []);
      } else {
        throw new Error(data.error || 'Failed to fetch journey insights');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user journey insights';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAllAnalytics = useCallback(async (campaignId?: string) => {
    if (campaignId) {
      await Promise.all([
        fetchCampaignOverview(campaignId),
        fetchFieldPerformance(campaignId),
        fetchUserJourneyInsights(campaignId)
      ]);
    } else {
      await fetchCampaignOverview();
    }
  }, [fetchCampaignOverview, fetchFieldPerformance, fetchUserJourneyInsights]);

  return {
    // State
    loading,
    error,
    campaignOverviews,
    dailyMetrics,
    fieldPerformance,
    journeyInsights,
    recentJourneys,

    // Actions
    fetchCampaignOverview,
    fetchFieldPerformance,
    fetchUserJourneyInsights,
    refreshAllAnalytics,
    
    // Utility
    clearError: () => setError(null),
  };
}; 