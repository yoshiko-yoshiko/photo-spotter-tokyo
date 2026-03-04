import { useState, useEffect } from 'react';
import { X, Heart, Camera, Trash2 } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePhotoLikeState } from '@/features/photos/hooks/use-photo-like';
import { useDeletePhoto } from '@/features/photos/hooks/use-photos';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { PhotoActionsMenu } from './photo-actions-menu';
import { PhotoComments } from './photo-comments';

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
  const { user: currentUser, isAuthenticated } = useAuth();

  const {
    localLiked,
    localCount,
    heartBurst,
    isPending,
    showAuthModal,
    setShowAuthModal,
    handleLike,
    handleDoubleTap,
  } = usePhotoLikeState({
    photoId: isOpen ? photo.id : undefined,
    initialLikesCount: photo.likes_count ?? 0,
  });

  const deletePhoto = useDeletePhoto();
  const [imgError, setImgError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeletePhoto = () => {
    deletePhoto.mutate(photo.id, {
      onSuccess: () => {
        toast.success('写真を削除しました');
        onClose();
      },
      onError: () => {
        toast.error('写真の削除に失敗しました');
      },
    });
    setShowDeleteConfirm(false);
  };

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

  const isOwnPhoto = currentUser?.id === photo.user_id;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-fade-in"
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
          className="bg-black/60 backdrop-blur-sm px-4 py-3 animate-slide-up max-h-[50vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User info + actions */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <AvatarImage src={photoUser?.avatar_url} fallback={photoUser?.nickname || 'U'} className="w-8 h-8" />
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
              {isAuthenticated && isOwnPhoto && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="写真を削除"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-white/70" />
                </button>
              )}
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
              disabled={isPending}
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

          {/* Comments section */}
          <div className="mt-3 -mx-4 border-t border-white/10 bg-card rounded-t-xl">
            <PhotoComments photoId={photo.id} />
          </div>
        </div>
      </div>

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl p-5 w-full max-w-xs animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-foreground">写真を削除</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              この写真を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeletePhoto}
                disabled={deletePhoto.isPending}
                className="flex-1 rounded-full bg-destructive py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                {deletePhoto.isPending ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
