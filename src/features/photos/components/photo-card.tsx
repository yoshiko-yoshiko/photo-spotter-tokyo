import { useState, useRef, useEffect } from 'react';
import { Heart, Camera } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { TIMING } from '@/lib/constants';
import { usePhotoLikes, useToggleLike } from '@/features/photos/hooks/use-photos';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { PhotoActionsMenu } from './photo-actions-menu';
import type { PhotoCardProps } from '@/features/photos/types';

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const { user, isGuest, isAuthenticated } = useAuth();
  const isLiked = usePhotoLikes(photo.id);
  const toggleLike = useToggleLike();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [imgError, setImgError] = useState(false);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localCount, setLocalCount] = useState(photo.likes_count ?? 0);

  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLocalCount(photo.likes_count ?? 0);
  }, [photo.likes_count]);

  const isOwnPhoto = user?.id === photo.user_id;

  const handleLike = () => {
    if (isGuest || !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!localLiked) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), TIMING.LIKE_BURST_DURATION);
    }
    setLocalLiked(!localLiked);
    setLocalCount(prev => localLiked ? prev - 1 : prev + 1);
    toggleLike.mutate({ photoId: photo.id, isLiked: localLiked });
  };

  const handleImageTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeSinceLastTap < TIMING.DOUBLE_TAP_DELAY) {
      // Double-tap: cancel pending single-tap, fire like
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (!localLiked) handleLike();
    } else {
      // Potential single-tap: wait to see if double-tap follows
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        onClick?.();
      }, TIMING.DOUBLE_TAP_DELAY);
    }
  };

  return (
    <>
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        <div className="relative aspect-[4/3] bg-muted" onClick={handleImageTap}>
          {!imgError ? (
            <img
              src={photo.image_url}
              alt={photo.caption || 'Photo'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Camera className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          {/* Heart burst animation on double-tap */}
          {heartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-16 h-16 fill-white text-white drop-shadow-lg animate-like-burst" />
            </div>
          )}
        </div>
        <div className="p-2.5">
          {photo.caption && (
            <p className="text-xs text-foreground line-clamp-2 mb-1.5">{photo.caption}</p>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              aria-label="いいね"
              className="flex items-center gap-1 text-xs transition-all active:scale-125"
            >
              <Heart
                className={`w-4 h-4 transition-all duration-200 ${
                  localLiked ? 'fill-destructive text-destructive scale-110' : 'text-muted-foreground'
                }`}
              />
              <span className={localLiked ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {localCount}
              </span>
            </button>

            {isAuthenticated && !isOwnPhoto && (
              <PhotoActionsMenu photoId={photo.id} photoUserId={photo.user_id} />
            )}
          </div>
        </div>
      </div>

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
