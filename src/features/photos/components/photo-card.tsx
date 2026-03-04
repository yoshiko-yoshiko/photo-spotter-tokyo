import { memo, useState, useRef } from 'react';
import { Heart, Camera } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { TIMING } from '@/lib/constants';
import { usePhotoLikeState } from '@/features/photos/hooks/use-photo-like';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { PhotoActionsMenu } from './photo-actions-menu';
import type { PhotoCardProps } from '@/features/photos/types';

export const PhotoCard = memo(function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const { user, isAuthenticated } = useAuth();
  const {
    localLiked,
    localCount,
    heartBurst,
    isPending,
    showAuthModal,
    setShowAuthModal,
    handleLike,
  } = usePhotoLikeState({
    photoId: photo.id,
    initialLikesCount: photo.likes_count ?? 0,
  });

  const [imgError, setImgError] = useState(false);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwnPhoto = user?.id === photo.user_id;

  const handleImageTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeSinceLastTap < TIMING.DOUBLE_TAP_DELAY) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (!localLiked) handleLike();
    } else {
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        onClick?.();
      }, TIMING.DOUBLE_TAP_DELAY);
    }
  };

  return (
    <>
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        <div className="relative aspect-square bg-muted" onClick={handleImageTap}>
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
              disabled={isPending}
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
});
