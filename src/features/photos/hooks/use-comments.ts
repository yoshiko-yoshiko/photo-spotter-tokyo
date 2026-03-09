import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Tables, queryOrThrow } from '@/lib/supabase/helpers';
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
        .from(Tables.PHOTO_COMMENTS)
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
      const { data: users, error: usersError } = await supabase
        .from(Tables.USERS)
        .select('id, nickname, avatar_url')
        .in('id', userIds);

      if (usersError) {
        if (import.meta.env.DEV) console.debug('Failed to fetch user info:', usersError);
        return rawComments.map(c => ({ ...c, users: null })) as CommentWithUser[];
      }

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

      await queryOrThrow(
        supabase
          .from(Tables.PHOTO_COMMENTS)
          .insert({ photo_id: photoId, user_id: user.id, body })
          .select()
      );

      // Notify photo owner (skip if commenting on own photo)
      try {
        const { data: photo, error: photoErr } = await supabase
          .from(Tables.PHOTOS).select('user_id').eq('id', photoId).single();
        if (photoErr) throw photoErr;
        if (photo && photo.user_id !== user.id) {
          const { data: commenter, error: commenterErr } = await supabase
            .from(Tables.USERS).select('nickname').eq('id', user.id).single();
          if (commenterErr) throw commenterErr;
          const nickname = commenter?.nickname || 'ユーザー';
          const preview = body.length > 30 ? body.slice(0, 30) + '...' : body;
          await supabase.from(Tables.NOTIFICATIONS).insert({
            user_id: photo.user_id,
            actor_id: user.id,
            photo_id: photoId,
            type: 'comment',
            title: `${nickname}さんがコメントしました`,
            body: preview,
          });
        }
      } catch (err: unknown) {
        // Notification failure should not block comment submission
        if (import.meta.env.DEV) console.debug('Notification send error:', err);
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
      await queryOrThrow(
        supabase
          .from(Tables.PHOTO_COMMENTS)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', commentId)
          .select()
      );
      return { photoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', result.photoId] });
      queryClient.invalidateQueries({ queryKey: ['spot-photos'] });
    },
  });
}
