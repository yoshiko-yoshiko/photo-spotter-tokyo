import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { NewReward } from '@/features/rewards/types';

const REWARD_CHECK_INTERVAL_MS = 500;
const MAX_REWARD_CHECK_RETRIES = 3;

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * After a stamp is created, check if new rewards were unlocked.
 * Uses retry logic to wait for the DB trigger to fire.
 */
export function useRewardUnlock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newRewards, setNewRewards] = useState<NewReward[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchUserRewards = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_rewards')
      .select('reward_id, reward:rewards(id, name, type, badge_image_url, description)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }, []);

  const checkNewRewards = useCallback(async (previousRewardIds: string[]) => {
    if (!user) return;

    for (let attempt = 1; attempt <= MAX_REWARD_CHECK_RETRIES; attempt++) {
      await wait(REWARD_CHECK_INTERVAL_MS);

      const currentUserRewards = await fetchUserRewards(user.id);
      if (!currentUserRewards) continue;

      const newlyUnlocked = currentUserRewards.filter(
        ur => !previousRewardIds.includes(ur.reward_id)
      );

      if (newlyUnlocked.length > 0) {
        const rewards = newlyUnlocked
          .map(ur => ur.reward as unknown as NewReward)
          .filter(Boolean);

        setNewRewards(rewards);
        setShowCelebration(true);
        queryClient.invalidateQueries({ queryKey: ['user_rewards'] });
        return;
      }
    }
  }, [user, queryClient, fetchUserRewards]);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    setNewRewards([]);
  }, []);

  return {
    newRewards,
    showCelebration,
    checkNewRewards,
    dismissCelebration,
  };
}
