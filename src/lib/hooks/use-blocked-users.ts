import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';

export function useBlockedUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      return (data || []).map(b => b.blocked_id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
