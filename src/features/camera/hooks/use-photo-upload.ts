import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Tables } from '@/lib/supabase/helpers';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRewardUnlock } from '@/features/rewards/hooks/use-reward-unlock';
import { toast } from 'sonner';

/** Upload file to Supabase Storage and return the public URL + storage path */
async function uploadToStorage(file: File, userId: string) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(Tables.PHOTOS)
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(Tables.PHOTOS)
    .getPublicUrl(path);

  return { publicUrl, path };
}

/** Insert photo record and return the created photo */
async function insertPhotoRecord(userId: string, spotId: string, publicUrl: string, storagePath: string, caption: string) {
  const { data, error } = await supabase
    .from(Tables.PHOTOS)
    .insert({
      user_id: userId,
      spot_id: spotId,
      image_url: publicUrl,
      storage_path: storagePath,
      caption: caption.trim() || null,
      is_public: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Create stamp, silently ignore duplicates */
async function createStamp(userId: string, spotId: string, photoId: string) {
  const { error } = await supabase
    .from(Tables.STAMPS)
    .insert({
      user_id: userId,
      spot_id: spotId,
      photo_id: photoId,
      method: 'photo',
    });

  if (error) {
    const msg = 'message' in error && typeof error.message === 'string' ? error.message : '';
    if (!msg.includes('duplicate')) throw error;
  }
}

/** Fetch current reward IDs for comparison after stamp creation */
async function fetchCurrentRewardIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_rewards')
    .select('reward_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(r => r.reward_id);
}

const INVALIDATE_KEYS = [['stamps'], ['photos'], ['timeline'], ['spot-photos']] as const;

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
      const prevRewardIds = await fetchCurrentRewardIds(user.id);

      const { publicUrl, path } = await uploadToStorage(file, user.id);
      const photo = await insertPhotoRecord(user.id, spotId, publicUrl, path, caption);
      await createStamp(user.id, spotId, photo.id);

      for (const key of INVALIDATE_KEYS) {
        queryClient.invalidateQueries({ queryKey: [...key] });
      }

      checkNewRewards(prevRewardIds);
      toast.success('写真を投稿しました！スタンプを獲得 🎉');
    } catch (err: unknown) {
      const msg = 'アップロードに失敗しました';
      const detail = err instanceof Error ? err.message : String(err);
      if (import.meta.env.DEV) console.error('Photo upload error:', err);
      setError(msg);
      toast.error(msg);
      throw new Error(`${msg}: ${detail}`);
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
