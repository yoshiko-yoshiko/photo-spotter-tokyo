import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRewardUnlock } from '@/features/rewards/hooks/use-reward-unlock';
import { toast } from 'sonner';

export function usePhotoUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { newRewards, showCelebration, checkNewRewards, dismissCelebration } = useRewardUnlock();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (file: File, spotId: string, caption: string) => {
    if (!user) {
      setError('ログインが必要です');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Capture current reward IDs before stamp creation
      const { data: prevRewards } = await supabase
        .from('user_rewards')
        .select('reward_id')
        .eq('user_id', user.id);
      const prevRewardIds = (prevRewards || []).map(r => r.reward_id);

      // Upload to Storage
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

      // Insert photo record
      const { data: photo, error: photoError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          spot_id: spotId,
          image_url: publicUrl,
          storage_path: path,
          caption: caption.trim() || null,
          is_public: true,
        })
        .select()
        .single();

      if (photoError) throw photoError;

      // Create stamp
      const { error: stampError } = await supabase
        .from('stamps')
        .insert({
          user_id: user.id,
          spot_id: spotId,
          photo_id: photo.id,
          method: 'photo',
        });

      if (stampError && !stampError.message.includes('duplicate')) throw stampError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['stamps'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });

      // Check for newly unlocked rewards
      checkNewRewards(prevRewardIds);

      toast.success('写真を投稿しました！スタンプを獲得 🎉');
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const msg = 'アップロードに失敗しました';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [user, queryClient, checkNewRewards]);

  return {
    uploadPhoto,
    isUploading,
    error,
    newRewards,
    showCelebration,
    dismissCelebration,
  };
}
