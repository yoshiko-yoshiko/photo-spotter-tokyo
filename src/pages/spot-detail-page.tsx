import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Camera, Clock, MapPin, Check, Navigation, Loader2 } from 'lucide-react';
import { PhotoGallery } from '@/components/photos/photo-gallery';
import { useSpot } from '@/hooks/use-spots';
import { useUserStamps } from '@/hooks/use-user-stamps';
import { useAuth } from '@/hooks/use-auth';
import { AuthPromptModal } from '@/components/auth/auth-prompt-modal';
import { ConfettiCanvas } from '@/components/rewards/confetti-canvas';
import { RewardUnlockOverlay } from '@/components/rewards/reward-unlock-overlay';
import { useRewardUnlock } from '@/hooks/use-reward-unlock';
import { CATEGORY_COLORS, getRouteUrl } from '@/lib/map-utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SpotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: spot, isLoading } = useSpot(id);
  const { data: stamps = [] } = useUserStamps();
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const { newRewards, showCelebration, checkNewRewards, dismissCelebration } = useRewardUnlock();

  const isVisited = stamps.some(s => s.spot_id === id);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-muted-foreground">スポットが見つかりません</p>
        <button onClick={() => navigate('/map')} className="text-primary text-sm mt-3">地図に戻る</button>
      </div>
    );
  }

  const color = CATEGORY_COLORS[spot.category] || '#0D9488';

  const handleCheckin = async () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    if (isVisited || !user) return;

    setCheckingIn(true);
    try {
      // Capture current reward IDs before stamp creation
      const { data: prevRewards } = await supabase
        .from('user_rewards')
        .select('reward_id')
        .eq('user_id', user.id);
      const prevRewardIds = (prevRewards || []).map(r => r.reward_id);

      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      );

      const dist = getDistanceMeters(
        pos.coords.latitude, pos.coords.longitude,
        Number(spot.latitude), Number(spot.longitude)
      );

      if (dist > spot.radius_m) {
        toast.error(`スポットから${Math.round(dist)}m離れています（${spot.radius_m}m以内でチェックインできます）`);
        setCheckingIn(false);
        return;
      }

      const { error } = await supabase
        .from('stamps')
        .insert({
          user_id: user.id,
          spot_id: spot.id,
          method: 'gps',
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.info('すでにチェックイン済みです');
        } else {
          throw error;
        }
      } else {
        toast.success('チェックイン成功！スタンプを獲得 🎉');
        queryClient.invalidateQueries({ queryKey: ['stamps'] });
        // Check for newly unlocked rewards
        checkNewRewards(prevRewardIds);
      }
    } catch (err: any) {
      if (err?.code === 1) {
        toast.error('位置情報の許可が必要です。設定から有効にしてください。');
      } else if (err?.code === 2 || err?.code === 3) {
        toast.error('位置情報を取得できませんでした。再度お試しください。');
      } else {
        toast.error('チェックインに失敗しました');
        console.error('Checkin error:', err);
      }
    }
    setCheckingIn(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: spot.name,
        text: `${spot.name} - フォトスポッター東京`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('リンクをコピーしました');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Hero */}
      <div className="relative">
        <div className="w-full aspect-[4/3] bg-muted overflow-hidden">
          {spot.image_url ? (
            <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-card/80 backdrop-blur rounded-full w-10 h-10 shadow-sm flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>

        {isVisited && (
          <span className="absolute top-4 right-16 bg-stamp-gold text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
            <Check className="w-3 h-3" /> 取得済み
          </span>
        )}

        <button onClick={handleShare}
          className="absolute top-4 right-4 bg-card/80 backdrop-blur rounded-full w-10 h-10 shadow-sm flex items-center justify-center">
          <Share2 className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-foreground">{spot.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
            {spot.category}
          </span>
          <span className="text-sm text-muted-foreground">{spot.area}</span>
        </div>

        {spot.photo_tip && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-foreground">📸 撮影ガイド</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">{spot.photo_tip}</p>
          </div>
        )}

        {spot.best_time && (
          <div className="mt-4">
            <h3 className="text-base font-medium text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> ベスト時間帯
            </h3>
            <p className="text-muted-foreground mt-1">{spot.best_time}</p>
          </div>
        )}

        {spot.address && (
          <div className="mt-4">
            <h3 className="text-base font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> アクセス
            </h3>
            <p className="text-muted-foreground mt-1">{spot.address}</p>
            <p className="text-xs text-muted-foreground mt-0.5">📍 チェックイン可能範囲: {spot.radius_m}m 以内</p>
            <a href={getRouteUrl(Number(spot.latitude), Number(spot.longitude))}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm mt-2">
              <Navigation className="w-4 h-4" /> ルート案内
            </a>
          </div>
        )}

        {/* Photo Gallery */}
        <PhotoGallery spotId={spot.id} />
      </div>

      {/* CTA */}
      <div className="fixed bottom-20 left-4 right-4 z-40 md:max-w-[358px] md:mx-auto">
        <button
          onClick={handleCheckin}
          disabled={isVisited || checkingIn}
          className={`w-full rounded-full py-4 text-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2 ${
            isVisited
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : checkingIn
              ? 'bg-accent/70 text-accent-foreground cursor-wait'
              : 'bg-accent hover:bg-accent-light text-accent-foreground'
          }`}
        >
          {checkingIn ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> 位置を確認中...</>
          ) : isVisited ? (
            '✓ チェックイン済み'
          ) : (
            '📍 GPSチェックイン'
          )}
        </button>
      </div>

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ConfettiCanvas active={showCelebration} />
      <RewardUnlockOverlay rewards={newRewards} open={showCelebration} onClose={dismissCelebration} />
    </div>
  );
}
