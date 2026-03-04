import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, Camera } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePhotoLikes, useToggleLike } from '@/features/photos/hooks/use-photos';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { PhotoActionsMenu } from './photo-actions-menu';

interface PhotoDetailModalProps {
  photo: {
    id: string;
    image_url: string;
    caption: string | null;
    likes_count: number;
    created_at: string;
    user_id: string;
  };
  user: {
    nickname: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 30) return `${diffDays}日前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

export function PhotoDetailModal({ photo, user: photoUser, isOpen, onClose }: PhotoDetailModalProps) {
  const { user: currentUser, isGuest, isAuthenticated } = useAuth();
  const isLiked = usePhotoLikes(isOpen ? photo.id : undefined);
  const toggleLike = useToggleLike();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localCount, setLocalCount] = useState(photo.likes_count ?? 0);
  const lastTapRef = useRef(0);

  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLocalCount(photo.likes_count ?? 0);
  }, [photo.likes_count]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const handleLike = useCallback(() => {
    if (isGuest || !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!localLiked) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 600);
    }
    setLocalLiked(!localLiked);
    setLocalCount(prev => localLiked ? prev - 1 : prev + 1);
    toggleLike.mutate({ photoId: photo.id, isLiked: localLiked });
  }, [isGuest, isAuthenticated, localLiked, toggleLike, photo.id]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!localLiked) handleLike();
    }
    lastTapRef.current = now;
  }, [localLiked, handleLike]);

  const isOwnPhoto = currentUser?.id === photo.user_id;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Photo */}
        <div
          className="flex-1 min-h-0 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            handleDoubleTap();
          }}
        >
          {!imgError ? (
            <img
              src={photo.image_url}
              alt={photo.caption || 'Photo'}
              className="max-w-full max-h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center">
              <Camera className="w-16 h-16 text-white/20" />
            </div>
          )}
          {/* Heart burst animation */}
          {heartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-24 h-24 fill-white text-white drop-shadow-lg animate-like-burst" />
            </div>
          )}
        </div>

        {/* Info panel */}
        <div
          className="bg-black/60 backdrop-blur-sm px-4 py-3 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User info + actions */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {photoUser?.avatar_url ? (
                <img
                  src={photoUser.avatar_url}
                  alt={photoUser.nickname}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-white text-sm font-medium truncate block">
                  {photoUser?.nickname || 'ユーザー'}
                </span>
                {photoUser?.bio && (
                  <span className="text-white/60 text-xs truncate block">
                    {photoUser.bio}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated && !isOwnPhoto && (
                <PhotoActionsMenu photoId={photo.id} photoUserId={photo.user_id} />
              )}
            </div>
          </div>

          {/* Caption */}
          {photo.caption && (
            <p className="text-white/90 text-sm whitespace-pre-line mb-2">
              {photo.caption}
            </p>
          )}

          {/* Like + date */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              aria-label="いいね"
              className="flex items-center gap-1.5 transition-all active:scale-125"
            >
              <Heart
                className={`w-5 h-5 transition-all duration-200 ${
                  localLiked ? 'fill-destructive text-destructive scale-110' : 'text-white/70'
                }`}
              />
              <span className={`text-sm ${localLiked ? 'text-destructive font-medium' : 'text-white/70'}`}>
                {localCount}
              </span>
            </button>
            <span className="text-white/50 text-xs">
              {formatRelativeDate(photo.created_at)}
            </span>
          </div>
        </div>
      </div>

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
