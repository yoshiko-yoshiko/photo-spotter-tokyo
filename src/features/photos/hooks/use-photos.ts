import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/utils/hooks/use-auth';

export function useSpotPhotos(spotId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spot-photos', spotId],
    queryFn: async () => {
      if (!spotId) return [];
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
        .from('photos')
        .select('*')
        .eq('spot_id', spotId)
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filter out blocked users
      return (data || []).filter(p => !blockedIds.includes(p.user_id));
    },
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
    mutationFn: async ({ photoId, isLiked }: { photoId: string; isLiked: boolean }) => {
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
    mutationFn: async ({ photoId, reporterId, reason, detail }: {
      photoId: string;
      reporterId: string;
      reason: string;
      detail?: string;
    }) => {
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
