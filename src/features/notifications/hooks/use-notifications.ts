import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { Tables, queryOrThrow } from '@/lib/supabase/helpers';
import type { Notification } from '@/features/notifications/types';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: Tables.NOTIFICATIONS,
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Stage 1: fetch notifications
      const raw = await queryOrThrow(
        supabase
          .from(Tables.NOTIFICATIONS)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30)
      );
      if (raw.length === 0) return [];

      // Stage 2: resolve photo → spot → slug
      const photoIds = [...new Set(raw.filter(n => n.photo_id).map(n => n.photo_id as string))];
      let photoSpotMap = new Map<string, { spot_id: string; slug: string }>();

      if (photoIds.length > 0) {
        const photos = await queryOrThrow(
          supabase
            .from(Tables.PHOTOS)
            .select('id, spot_id')
            .in('id', photoIds)
        );

        if (photos.length > 0) {
          const spotIds = [...new Set(photos.filter(p => p.spot_id).map(p => p.spot_id))];
          const spots = await queryOrThrow(
            supabase
              .from(Tables.SPOTS)
              .select('id, slug')
              .in('id', spotIds)
          );

          const spotMap = new Map(spots.map(s => [s.id, s.slug]));

          for (const p of photos) {
            if (p.spot_id && spotMap.has(p.spot_id)) {
              photoSpotMap.set(p.id, { spot_id: p.spot_id, slug: spotMap.get(p.spot_id)! });
            }
          }
        }
      }

      return raw.map(n => {
        const resolved = n.photo_id ? photoSpotMap.get(n.photo_id) : null;
        return {
          ...n,
          spot_id: resolved?.spot_id ?? null,
          spot_slug: resolved?.slug ?? null,
        };
      }) as Notification[];
    },
    enabled: !!user,
  });
}

export function useUnreadCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter(n => !n.is_read).length;
}

export function useMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      if (!user) return;

      let readState = true;

      // Toggle single notification
      if (notificationIds && notificationIds.length === 1) {
        const cached = queryClient.getQueryData<Notification[]>(['notifications', user.id]);
        const n = cached?.find(t => t.id === notificationIds[0]);
        readState = n ? !n.is_read : true;
      }

      let query = supabase
        .from(Tables.NOTIFICATIONS)
        .update({ is_read: readState })
        .eq('user_id', user.id);

      if (notificationIds && notificationIds.length === 1) {
        query = query.eq('id', notificationIds[0]);
      } else if (notificationIds) {
        query = query.in('id', notificationIds);
      } else {
        query = query.eq('is_read', false);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
