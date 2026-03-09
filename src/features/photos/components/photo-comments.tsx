import { useState, useRef, useCallback } from 'react';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { LIMITS, TIMING } from '@/lib/constants';
import { usePhotoComments, useAddComment, useDeleteComment } from '@/features/photos/hooks/use-comments';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';

const MAX_COMMENT_LENGTH = LIMITS.MAX_COMMENT_LENGTH;

interface PhotoCommentsProps {
  photoId: string;
}

export function PhotoComments({ photoId }: PhotoCommentsProps) {
  const { user, isGuest, isAuthenticated } = useAuth();
  const { data: comments = [], isLoading } = usePhotoComments(photoId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const [body, setBody] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSubmit = body.trim().length > 0 && body.length <= MAX_COMMENT_LENGTH && !addComment.isPending;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    if (isGuest || !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    addComment.mutate(
      { photoId, body: body.trim() },
      {
        onSuccess: () => {
          setBody('');
          inputRef.current?.focus();
        },
        onError: () => {
          toast.error('コメントの投稿に失敗しました');
        },
      },
    );
  }, [canSubmit, isGuest, isAuthenticated, addComment, photoId, body]);

  const handleDelete = useCallback(
    (commentId: string) => {
      deleteComment.mutate(
        { commentId, photoId },
        {
          onError: () => {
            toast.error('コメントの削除に失敗しました');
          },
        },
      );
      setDeleteTargetId(null);
    },
    [deleteComment, photoId],
  );

  const handleLongPressStart = useCallback(
    (commentId: string) => {
      longPressTimerRef.current = setTimeout(() => {
        setDeleteTargetId(commentId);
      }, TIMING.LONG_PRESS_DELAY);
    },
    [],
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleInputFocus = () => {
    if (isGuest || !isAuthenticated) {
      setShowAuthModal(true);
      inputRef.current?.blur();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Comment list */}
        <div className="max-h-60 overflow-y-auto px-4 py-2 space-y-3">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              まだコメントはありません
            </p>
          ) : (
            comments.map((comment) => {
              const isOwn = user?.id === comment.user_id;
              return (
                <div
                  key={comment.id}
                  className="flex gap-2.5"
                  onContextMenu={(e) => {
                    if (isOwn) {
                      e.preventDefault();
                      setDeleteTargetId(comment.id);
                    }
                  }}
                  onTouchStart={() => isOwn && handleLongPressStart(comment.id)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                >
                  {/* Avatar */}
                  <AvatarImage
                    src={comment.users?.avatar_url}
                    fallback={comment.users?.nickname ?? '?'}
                    className="w-7 h-7"
                    iconSize="w-3 h-3"
                  />

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {comment.users?.nickname ?? '不明なユーザー'}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">{comment.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
          <input
            ref={inputRef}
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            onFocus={handleInputFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="コメントを入力..."
            className="flex-1 min-w-0 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="送信"
            className="flex-shrink-0 p-2 rounded-full text-primary disabled:text-muted-foreground transition-colors"
          >
            {addComment.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4"
          onClick={() => setDeleteTargetId(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl p-5 w-full max-w-xs animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-foreground">コメントを削除</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              このコメントを削除しますか？
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                いいえ
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTargetId)}
                disabled={deleteComment.isPending}
                className="flex-1 rounded-full bg-destructive py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                {deleteComment.isPending ? '削除中...' : 'はい'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
