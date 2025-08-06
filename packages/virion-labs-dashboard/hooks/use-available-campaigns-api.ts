import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Campaign } from '@/schemas/campaign';
import api from '@/lib/api';

// Extended interface for available campaigns that includes access status
interface AvailableCampaign extends Campaign {
  has_access?: boolean
  request_status?: 'pending' | 'approved' | 'denied'
  discord_server_name?: string
}

export const useAvailableCampaignsApi = () => {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([]);
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