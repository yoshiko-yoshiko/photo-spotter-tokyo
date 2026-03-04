import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';

interface CommentWithUser {
  id: string;
  photo_id: string;
  user_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  users: {
    nickname: string;
    avatar_url: string | null;
  } | null;
}

export function usePhotoComments(photoId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['photo-comments', photoId],
    queryFn: async () => {
      // Get blocked user ids
      let blockedIds: string[] = [];
      if (user) {
        const { data: blocks } = await supabase
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        blockedIds = (blocks || []).map(b => b.blocked_id);
      }

      const { data, error } = await supabase
        .from('photo_comments')
        .select('*, users:user_id(nickname, avatar_url)')
        .eq('photo_id', photoId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        // photo_comments table may not exist yet — return empty instead of crashing
        if (error.code === '42P01' || error.message?.includes('relation') || error.code === 'PGRST204') {
          return [];
        }
        throw error;
      }

      const comments = (data || []) as unknown as CommentWithUser[];
      return comments.filter(c => !blockedIds.includes(c.user_id));
    },
    enabled: !!photoId,
    retry: false,
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, body }: { photoId: string; body: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('photo_comments')
        .insert({ photo_id: photoId, user_id: user.id, body });

      if (error) throw error;
    },
    onSuccess: (_, { photoId }) => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photoId] });
      queryClient.invalidateQueries({ queryKey: ['spot-photos'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, photoId }: { commentId: string; photoId: string }) => {
      const { error } = await supabase
        .from('photo_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
      return { photoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', result.photoId] });
      queryClient.invalidateQueries({ queryKey: ['spot-photos'] });
    },
  });
}
