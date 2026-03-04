import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
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
          table: 'notifications',
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
      const { data: raw, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      if (!raw || raw.length === 0) return [];

      // Stage 2: resolve photo → spot → slug
      const photoIds = [...new Set(raw.filter(n => n.photo_id).map(n => n.photo_id as string))];
      let photoSpotMap = new Map<string, { spot_id: string; slug: string }>();

      if (photoIds.length > 0) {
        const { data: photos } = await supabase
          .from('photos')
          .select('id, spot_id')
          .in('id', photoIds);

        if (photos && photos.length > 0) {
          const spotIds = [...new Set(photos.filter(p => p.spot_id).map(p => p.spot_id))];
          const { data: spots } = await supabase
            .from('spots')
            .select('id, slug')
            .in('id', spotIds);

          const spotMap = new Map((spots || []).map(s => [s.id, s.slug]));

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

      if (notificationIds && notificationIds.length === 1) {
        // Toggle single notification
        const target = queryClient.getQueryData<Notification[]>(['notifications', user.id]);
        const n = target?.find(t => t.id === notificationIds[0]);
        const newReadState = n ? !n.is_read : true;

        const { error } = await supabase
          .from('notifications')
          .update({ is_read: newReadState })
          .eq('user_id', user.id)
          .eq('id', notificationIds[0]);
        if (error) throw error;
      } else if (notificationIds) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .in('id', notificationIds);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
