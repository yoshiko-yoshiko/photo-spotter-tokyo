import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { UserProfile } from '../types';

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('nickname, avatar_url, bio')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
