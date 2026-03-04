import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { ProfileStats } from '../types';

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async (): Promise<ProfileStats> => {
      const [stampsRes, photosRes, rewardsRes] = await Promise.all([
        supabase.from('stamps').select('id, spot_id').eq('user_id', userId!),
        supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', userId!).is('deleted_at', null),
        supabase.from('user_rewards').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
      ]);

      const stamps = stampsRes.data || [];
      const uniqueSpots = new Set(stamps.map(s => s.spot_id));

      return {
        stampCount: stamps.length,
        photoCount: photosRes.count || 0,
        spotCount: uniqueSpots.size,
        rewardCount: rewardsRes.count || 0,
      };
    },
    enabled: !!userId,
  });
}
