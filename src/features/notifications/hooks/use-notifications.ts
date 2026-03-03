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
      const { data, error } = await supabase
        .from('notifications')
        .select('*, photos:photo_id(spot_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []).map((n) => ({
        ...n,
        spot_id: (n.photos as { spot_id: string | null } | null)?.spot_id ?? null,
      })) as Notification[];
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
