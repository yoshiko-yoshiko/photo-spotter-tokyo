import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Share2, Camera, Clock, MapPin, Check, Navigation, Loader2, Stamp } from 'lucide-react';
import { PhotoGallery } from '@/features/photos/components/photo-gallery';
import { useSpot } from '@/features/spots/hooks/use-spots';
import { useSpotIdMap } from '@/features/spots/hooks/use-spot-id-map';
import { useUserStamps } from '@/features/spots/hooks/use-user-stamps';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCheckin } from '@/features/spots/hooks/use-checkin';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { ConfettiCanvas } from '@/features/rewards/components/confetti-canvas';
import { RewardUnlockOverlay } from '@/features/rewards/components/reward-unlock-overlay';
import { CATEGORY_COLORS, getRouteUrl } from '@/features/map/lib/map-utils';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpotDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromNotifications = (location.state as { from?: string })?.from === 'notifications';
  const { data: spot, isLoading } = useSpot(slug);
  const { data: idMap } = useSpotIdMap();
  const supabaseSpotId = idMap?.bySlug[slug ?? ''];
  const { data: stamps = [] } = useUserStamps();
  const { isGuest } = useAuth();
  const { checkin, isCheckinLoading, newRewards, showCelebration, dismissCelebration } = useCheckin();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  const isVisited = stamps.some(s => s.spot_id === supabaseSpotId);
  const wasVisitedRef = useRef(isVisited);
  const [showStampAnim, setShowStampAnim] = useState(false);

  useEffect(() => {
    if (!wasVisitedRef.current && isVisited) {
      setShowStampAnim(true);
      const timer = setTimeout(() => setShowStampAnim(false), 2000);
      return () => clearTimeout(timer);
    }
    wasVisitedRef.current = isVisited;
  }, [isVisited]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24">
        <Skeleton className="w-full aspect-[4/3] md:aspect-[16/9]" />
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl mt-4" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-muted-foreground">スポットが見つかりません</p>
        <button type="button" onClick={() => navigate('/map')} className="text-primary text-sm mt-3">地図に戻る</button>
      </div>
    );
  }

  const color = CATEGORY_COLORS[spot.category] || '#0D9488';

  const handleCheckin = async () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    if (isVisited) return;

    if (!supabaseSpotId) return;
    await checkin(supabaseSpotId, Number(spot.latitude), Number(spot.longitude), spot.radius_m);
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
    <div className="min-h-[100dvh] bg-background pb-24 md:max-w-3xl md:mx-auto">
      {/* Hero */}
      <div className="relative">
        <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-muted overflow-hidden">
          {!heroImgError && spot.image_url ? (
            <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover"
              onError={() => setHeroImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <button type="button" onClick={() => fromNotifications ? navigate('/profile', { replace: true }) : navigate(-1)}
          aria-label="戻る"
          className="absolute top-4 left-4 bg-card/80 backdrop-blur rounded-full w-10 h-10 shadow-sm flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>

        {isVisited && (
          <span className="absolute top-4 right-16 bg-stamp-gold text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
            <Check className="w-3 h-3" /> 取得済み
          </span>
        )}

        <button type="button" onClick={handleShare}
          aria-label="共有"
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
          <div className="mt-6 rounded-xl border border-border bg-card p-4 border-l-4 border-l-teal-500">
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-500" /> 撮影ガイド
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-2 text-sm">{spot.photo_tip}</p>
          </div>
        )}

        {spot.best_time && (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 border-l-4 border-l-amber-500">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" /> ベスト時間帯
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">{spot.best_time}</p>
          </div>
        )}

        {spot.address && (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 border-l-4 border-l-slate-500">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" /> アクセス
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">{spot.address}</p>
            <p className="text-xs text-muted-foreground mt-0.5">📍 チェックイン可能範囲: {spot.radius_m}m 以内</p>
            <a href={getRouteUrl(Number(spot.latitude), Number(spot.longitude))}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm mt-2">
              <Navigation className="w-4 h-4" /> ルート案内
            </a>
          </div>
        )}

        {/* Photo Gallery */}
        <PhotoGallery spotId={supabaseSpotId ?? ''} slug={slug} />
      </div>

      {/* Stamp animation */}
      {showStampAnim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-stamp-in">
            <div className="w-24 h-24 rounded-full bg-stamp-gold/20 flex items-center justify-center">
              <Stamp className="w-14 h-14 text-stamp-gold" />
            </div>
            <p className="text-center text-stamp-gold font-bold mt-2 text-lg">GET!</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="fixed bottom-20 left-4 right-4 z-40 md:max-w-3xl md:mx-auto space-y-2">
        {isVisited ? (
          <>
            <div className="flex items-center justify-center gap-2 text-sm text-stamp-gold font-bold bg-stamp-gold/10 border border-stamp-gold/20 rounded-full px-4 py-2">
              <Check className="w-4 h-4" /> スタンプ取得済み
            </div>
            <button
              type="button"
              onClick={() => navigate(`/camera?spot=${supabaseSpotId}`)}
              className="w-full rounded-full py-4 text-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Camera className="w-5 h-5" /> もう一枚撮る
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleCheckin}
            disabled={isCheckinLoading}
            className={`w-full rounded-full py-4 text-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2 ${
              isCheckinLoading
                ? 'bg-accent/70 text-accent-foreground cursor-wait'
                : 'bg-accent hover:bg-accent-light text-accent-foreground'
            }`}
          >
            {isCheckinLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 位置を確認中...</>
            ) : (
              '📍 GPSチェックイン'
            )}
          </button>
        )}
      </div>

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ConfettiCanvas active={showCelebration} />
      <RewardUnlockOverlay rewards={newRewards} open={showCelebration} onClose={dismissCelebration} />
    </div>
  );
}
