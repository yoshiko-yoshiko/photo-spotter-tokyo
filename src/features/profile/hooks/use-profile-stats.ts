import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Tables, queryOrThrow } from '@/lib/supabase/helpers';
import type { ProfileStats } from '../types';

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async (): Promise<ProfileStats> => {
      const [stamps, photosRes, rewardsRes] = await Promise.all([
        queryOrThrow(
          supabase.from(Tables.STAMPS).select('id, spot_id').eq('user_id', userId!),
        ),
        supabase
          .from(Tables.PHOTOS)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .is('deleted_at', null),
        supabase
          .from('user_rewards')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
      ]);

      if (photosRes.error) throw photosRes.error;
      if (rewardsRes.error) throw rewardsRes.error;

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
