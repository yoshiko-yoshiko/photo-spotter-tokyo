import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useBlockedUsers } from '@/lib/hooks/use-blocked-users';
import type { TimelinePost } from '@/features/timeline/types';
import { PAGINATION } from '@/lib/constants';

const PAGE_SIZE = PAGINATION.PAGE_SIZE;

export function useTimeline() {
  const { data: blockedIds = [] } = useBlockedUsers();

  const query = useInfiniteQuery({
    queryKey: ['timeline'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('photos')
        .select('*, users:user_id(nickname, avatar_url, bio)')
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        posts: (data || []) as unknown as TimelinePost[],
        nextCursor: data && data.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  const filteredPages = query.data?.pages.map(page => ({
    ...page,
    posts: page.posts.filter(p => !blockedIds.includes(p.user_id)),
  }));

  return {
    ...query,
    data: query.data ? { ...query.data, pages: filteredPages! } : undefined,
  };
}
