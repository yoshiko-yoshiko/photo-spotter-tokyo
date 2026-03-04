import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { ToggleLikeParams, ReportPhotoParams } from '@/features/photos/types';

const PAGE_SIZE = 20;

export function useSpotPhotos(spotId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spot-photos', spotId],
    queryFn: async () => {
      if (!spotId) return [];
      let blockedIds: string[] = [];
      if (user) {
        const { data: blocks } = await supabase
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        blockedIds = (blocks || []).map(b => b.blocked_id);
      }

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('spot_id', spotId)
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).filter(p => !blockedIds.includes(p.user_id));
    },
    enabled: !!spotId,
  });
}

export function useInfiniteSpotPhotos(spotId: string | undefined) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['spot-photos-infinite', spotId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!spotId) return { photos: [], nextOffset: null };

      let blockedIds: string[] = [];
      if (user) {
        const { data: blocks } = await supabase
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        blockedIds = (blocks || []).map(b => b.blocked_id);
      }

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('spot_id', spotId)
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) throw error;

      const filtered = (data || []).filter(p => !blockedIds.includes(p.user_id));
      const nextOffset = (data || []).length === PAGE_SIZE ? pageParam + PAGE_SIZE : null;

      return { photos: filtered, nextOffset };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!spotId,
  });
}

export function usePhotoLikes(photoId: string | undefined) {
  const { user } = useAuth();

  const { data: isLiked = false } = useQuery({
    queryKey: ['photo-like', photoId, user?.id],
    queryFn: async () => {
      if (!user || !photoId) return false;
      const { data } = await supabase
        .from('photo_likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!photoId,
  });

  return isLiked;
}

export function useToggleLike() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, isLiked }: ToggleLikeParams) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('photo_likes')
          .insert({ photo_id: photoId, user_id: user.id });
      }
    },
    onSuccess: (_, { photoId }) => {
      queryClient.invalidateQueries({ queryKey: ['photo-like', photoId] });
      queryClient.invalidateQueries({ queryKey: ['spot-photos'] });
    },
  });
}

export function useReportPhoto() {
  return useMutation({
    mutationFn: async ({ photoId, reporterId, reason, detail }: ReportPhotoParams) => {
      const { error } = await supabase
        .from('photo_reports')
        .insert({
          photo_id: photoId,
          reporter_id: reporterId,
          reason,
          detail: detail || null,
        });
      if (error) throw error;
    },
  });
}

export function useBlockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: user.id, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot-photos'] });
    },
  });
}
