import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Tables } from '@/lib/supabase/helpers';
import { useAuth } from '@/lib/hooks/use-auth';
import { toast } from 'sonner';

interface FieldConfig<T> {
  field: string;
  transform: (value: T) => unknown;
  labels: { success: string; error: string };
}

function useUpdateUserField<T>({ field, transform, labels }: FieldConfig<T>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: T) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from(Tables.USERS)
        .update({ [field]: transform(value) })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success(labels.success);
    },
    onError: () => {
      toast.error(labels.error);
    },
  });
}

export function useUpdateNickname() {
  return useUpdateUserField<string>({
    field: 'nickname',
    transform: (v) => v.trim(),
    labels: { success: '表示名を更新しました', error: '表示名の更新に失敗しました' },
  });
}

export function useUpdateBio() {
  return useUpdateUserField<string>({
    field: 'bio',
    transform: (v) => v.trim() || null,
    labels: { success: '自己紹介を更新しました', error: '自己紹介の更新に失敗しました' },
  });
}
