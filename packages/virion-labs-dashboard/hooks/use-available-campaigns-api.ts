import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Campaign } from '@/types/campaign';
import api from '@/lib/api';

export const useAvailableCampaignsApi = () => {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvailableCampaigns = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/operations/campaign/list?influencer_id=${profile.id}`);
      if (response.status !== 200) {
        throw new Error('Failed to fetch available campaigns');
      }
      setCampaigns(response.data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchAvailableCampaigns();
  }, [fetchAvailableCampaigns]);

  return { campaigns, loading, error, refetch: fetchAvailableCampaigns };
};