import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRewardUnlock } from '@/features/rewards/hooks/use-reward-unlock';
import { useDebugGps } from '@/features/debug/hooks/use-debug-gps';
import { getDistanceMeters } from '@/features/map/lib/map-utils';
import { toast } from 'sonner';

function getGeoPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  );
}

async function getPositionWithFallback(): Promise<GeolocationPosition> {
  try {
    return await getGeoPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  } catch {
    return await getGeoPosition({ enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
  }
}

export function useCheckin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { newRewards, showCelebration, checkNewRewards, dismissCelebration } = useRewardUnlock();
  const { getCurrentPosition, isDebugMode } = useDebugGps();
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkin = useCallback(async (spotId: string, spotLat: number, spotLng: number, radiusM: number) => {
    if (!user) {
      setError('ログインが必要です');
      return;
    }

    setIsCheckinLoading(true);
    setError(null);

    try {
      // Capture current reward IDs before stamp creation
      const { data: prevRewards } = await supabase
        .from('user_rewards')
        .select('reward_id')
        .eq('user_id', user.id);
      const prevRewardIds = (prevRewards || []).map(r => r.reward_id);

      // Get current position (debug mode uses mock, otherwise 2-stage fallback)
      const pos = isDebugMode ? await getCurrentPosition() : await getPositionWithFallback();

      // Check distance
      const dist = getDistanceMeters(
        pos.coords.latitude, pos.coords.longitude,
        spotLat, spotLng
      );

      if (dist > radiusM) {
        const msg = `スポットから${Math.round(dist)}m離れています（${radiusM}m以内でチェックインできます）`;
        setError(msg);
        toast.error(msg);
        return;
      }

      // Insert stamp (debug mode uses 'manual' method)
      const { error: stampError } = await supabase
        .from('stamps')
        .insert({
          user_id: user.id,
          spot_id: spotId,
          method: isDebugMode ? 'manual' : 'gps',
        });

      if (stampError) {
        if (stampError.message.includes('duplicate')) {
          toast.info('すでにチェックイン済みです');
        } else {
          throw stampError;
        }
      } else {
        toast.success('チェックイン成功！スタンプを獲得 🎉');
        queryClient.invalidateQueries({ queryKey: ['stamps'] });
        checkNewRewards(prevRewardIds);
      }
    } catch (err: unknown) {
      const geoErr = err as GeolocationPositionError | undefined;
      let msg: string;
      if (geoErr?.code === 1) {
        msg = '位置情報の許可が必要です。設定から有効にしてください。';
      } else if (geoErr?.code === 2 || geoErr?.code === 3) {
        msg = '位置情報を取得できませんでした。電波の良い場所で再度お試しください。';
      } else {
        msg = 'チェックインに失敗しました';
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setIsCheckinLoading(false);
    }
  }, [user, queryClient, checkNewRewards, getCurrentPosition, isDebugMode]);

  return {
    checkin,
    isCheckinLoading,
    error,
    newRewards,
    showCelebration,
    dismissCelebration,
  };
}
