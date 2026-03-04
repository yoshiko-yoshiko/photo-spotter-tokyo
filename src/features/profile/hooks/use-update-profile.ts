import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { toast } from 'sonner';

export function useUpdateNickname() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nickname: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('users')
        .update({ nickname: nickname.trim() })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('表示名を更新しました');
    },
    onError: () => {
      toast.error('表示名の更新に失敗しました');
    },
  });
}

export function useUpdateBio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bio: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('users')
        .update({ bio: bio.trim() || null })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('自己紹介を更新しました');
    },
    onError: () => {
      toast.error('自己紹介の更新に失敗しました');
    },
  });
}
