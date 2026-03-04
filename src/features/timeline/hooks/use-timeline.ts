import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { TimelinePost } from '@/features/timeline/types';
import { PAGINATION } from '@/lib/constants';

const PAGE_SIZE = PAGINATION.PAGE_SIZE;

export function useTimeline() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['timeline'],
    queryFn: async ({ pageParam = 0 }) => {
      // Get blocked user ids
      let blockedIds: string[] = [];
      if (user) {
        const { data: blocks } = await supabase
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        blockedIds = (blocks || []).map(b => b.blocked_id);
      }

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('photos')
        .select('*, users:user_id(nickname, avatar_url)')
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Filter out blocked users and normalize bio field
      const posts = ((data || []) as unknown as TimelinePost[])
        .filter(p => !blockedIds.includes(p.user_id))
        .map(p => ({
          ...p,
          users: p.users
            ? { ...p.users, bio: (p.users as Record<string, unknown>).bio as string | null ?? null }
            : null,
        }));

      return {
        posts,
        nextCursor: data && data.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
}
