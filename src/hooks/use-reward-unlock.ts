import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface NewReward {
  id: string;
  name: string;
  type: string;
  badge_image_url: string | null;
  description: string | null;
}

/**
 * After a stamp is created, check if new rewards were unlocked.
 * Returns a function to trigger the check and state for newly unlocked rewards.
 */
export function useRewardUnlock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newRewards, setNewRewards] = useState<NewReward[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const checkNewRewards = useCallback(async (previousRewardIds: string[]) => {
    if (!user) return;

    // Wait a moment for the trigger to fire
    await new Promise(r => setTimeout(r, 800));

    // Fetch current user_rewards
    const { data: currentUserRewards } = await supabase
      .from('user_rewards')
      .select('reward_id, reward:rewards(id, name, type, badge_image_url, description)')
      .eq('user_id', user.id);

    if (!currentUserRewards) return;

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
    }
  }, [user, queryClient]);

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
