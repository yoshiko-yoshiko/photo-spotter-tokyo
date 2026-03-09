import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useBlockedUsers } from '@/lib/hooks/use-blocked-users';
import { Tables, queryOrThrow } from '@/lib/supabase/helpers';
import type { ToggleLikeParams, ReportPhotoParams } from '@/features/photos/types';
import { PAGINATION } from '@/lib/constants';

const PAGE_SIZE = PAGINATION.PAGE_SIZE;

/** Base query for public, non-deleted spot photos ordered by newest first. */
function spotPhotosBase(spotId: string, columns = '*') {
  return supabase
    .from(Tables.PHOTOS)
    .select(columns)
    .eq('spot_id', spotId)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
}

export function useSpotPhotos(spotId: string | undefined) {
  const { data: blockedIds = [] } = useBlockedUsers();

  const query = useQuery({
    queryKey: ['spot-photos', spotId],
    queryFn: async () => {
      if (!spotId) return [];
      const data = await queryOrThrow(
        spotPhotosBase(spotId, '*, users:user_id(nickname, avatar_url, bio)'),
      );
      return data;
    },
    enabled: !!spotId,
  });

  const filtered = query.data?.filter(p => !blockedIds.includes(p.user_id));
  return { ...query, data: filtered };
}

export function useInfiniteSpotPhotos(spotId: string | undefined) {
  const { data: blockedIds = [] } = useBlockedUsers();

  const query = useInfiniteQuery({
    queryKey: ['spot-photos-infinite', spotId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!spotId) return { photos: [], nextOffset: null };

      const data = await queryOrThrow(
        spotPhotosBase(spotId).range(pageParam, pageParam + PAGE_SIZE - 1),
      );

      const nextOffset = data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null;
      return { photos: data, nextOffset };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!spotId,
  });

  const filteredPages = query.data?.pages.map(page => ({
    ...page,
    photos: page.photos.filter(p => !blockedIds.includes(p.user_id)),
  }));

  return {
    ...query,
    data: query.data ? { ...query.data, pages: filteredPages! } : undefined,
  };
}

export function usePhotoLikes(photoId: string | undefined) {
  const { user } = useAuth();

  const { data: isLiked = false } = useQuery({
    queryKey: ['photo-like', photoId, user?.id],
    queryFn: async () => {
      if (!user || !photoId) return false;
      const { data, error } = await supabase
        .from(Tables.PHOTO_LIKES)
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
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
        const { error } = await supabase
          .from(Tables.PHOTO_LIKES)
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(Tables.PHOTO_LIKES)
          .insert({ photo_id: photoId, user_id: user.id });
        if (error) throw error;
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

export function useDeletePhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from(Tables.PHOTOS)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', photoId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spot-photos'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['user-photos'] });
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
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['spot-photos'] });
    },
  });
}
