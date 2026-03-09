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
import { DeletePhotoDialog } from './delete-photo-dialog';
import { formatRelativeDate } from '@/lib/utils/format-date';

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Photo */}
        <div
          className="relative h-[45vh] shrink-0 flex items-center justify-center bg-black"
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
          {heartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-24 h-24 fill-white text-white drop-shadow-lg animate-like-burst" />
            </div>
          )}
        </div>

        {/* Info + Comments */}
        <div
          className="flex-1 min-h-0 overflow-y-auto bg-card"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <AvatarImage src={photoUser?.avatar_url} fallback={photoUser?.nickname || 'U'} className="w-8 h-8" />
              <div className="min-w-0">
                <span className="text-foreground text-sm font-medium truncate block">
                  {photoUser?.nickname || 'ユーザー'}
                </span>
                {photoUser?.bio && (
                  <span className="text-muted-foreground text-xs truncate block">
                    {photoUser.bio}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated && isOwnPhoto && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="写真を削除"
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
              {isAuthenticated && !isOwnPhoto && (
                <PhotoActionsMenu photoId={photo.id} photoUserId={photo.user_id} />
              )}
            </div>
          </div>

          {photo.caption && (
            <p className="text-foreground text-sm whitespace-pre-line px-4 pb-2">
              {photo.caption}
            </p>
          )}

          <div className="flex items-center justify-between px-4 pb-2">
            <button
              type="button"
              onClick={handleLike}
              disabled={isPending}
              aria-label="いいね"
              className="flex items-center gap-1.5 transition-all active:scale-125"
            >
              <Heart
                className={`w-5 h-5 transition-all duration-200 ${
                  localLiked ? 'fill-destructive text-destructive scale-110' : 'text-muted-foreground'
                }`}
              />
              <span className={`text-sm ${localLiked ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {localCount}
              </span>
            </button>
            <span className="text-muted-foreground text-xs">
              {formatRelativeDate(photo.created_at)}
            </span>
          </div>

          <div className="border-t border-border pb-[env(safe-area-inset-bottom)]">
            <PhotoComments photoId={photo.id} />
          </div>
        </div>
      </div>

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {showDeleteConfirm && (
        <DeletePhotoDialog
          isPending={deletePhoto.isPending}
          onConfirm={handleDeletePhoto}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
