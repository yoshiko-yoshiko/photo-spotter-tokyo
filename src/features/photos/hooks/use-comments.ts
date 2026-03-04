import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useBlockedUsers } from '@/lib/hooks/use-blocked-users';

export interface CommentWithUser {
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
  const { data: blockedIds = [] } = useBlockedUsers();

  const query = useQuery({
    queryKey: ['photo-comments', photoId],
    queryFn: async () => {
      // Stage 1: fetch comments (no JOIN — FK points to auth.users, not public.users)
      const { data: rawComments, error } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('photo_id', photoId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.code === 'PGRST204') {
          return [];
        }
        throw error;
      }

      if (!rawComments || rawComments.length === 0) return [];

      // Stage 2: fetch user info separately
      const userIds = [...new Set(rawComments.map(c => c.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds);

      const userMap = new Map((users || []).map(u => [u.id, u]));

      return rawComments.map(c => ({
        ...c,
        users: userMap.get(c.user_id) ?? null,
      })) as CommentWithUser[];
    },
    enabled: !!photoId,
    retry: false,
  });

  const filtered = query.data?.filter(c => !blockedIds.includes(c.user_id));
  return { ...query, data: filtered };
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

      // Notify photo owner (skip if commenting on own photo)
      try {
        const { data: photo } = await supabase
          .from('photos').select('user_id').eq('id', photoId).single();
        if (photo && photo.user_id !== user.id) {
          const { data: commenter } = await supabase
            .from('users').select('nickname').eq('id', user.id).single();
          const nickname = commenter?.nickname || 'ユーザー';
          const preview = body.length > 30 ? body.slice(0, 30) + '...' : body;
          await supabase.from('notifications').insert({
            user_id: photo.user_id,
            actor_id: user.id,
            photo_id: photoId,
            type: 'comment',
            title: `${nickname}さんがコメントしました`,
            body: preview,
          });
        }
      } catch {
        // Notification failure should not block comment submission
      }
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
