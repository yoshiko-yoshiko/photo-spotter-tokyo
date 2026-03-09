import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { Tables, queryOrThrow } from '@/lib/supabase/helpers';

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: () =>
      queryOrThrow(
        supabase
          .from(Tables.REWARDS)
          .select('*')
          .eq('is_active', true)
          .order('required_count'),
      ),
  });
}

export function useUserRewards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_rewards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return queryOrThrow(
        supabase
          .from('user_rewards')
          .select('*, reward:rewards(*)')
          .eq('user_id', user.id),
      );
    },
    enabled: !!user,
  });
}
