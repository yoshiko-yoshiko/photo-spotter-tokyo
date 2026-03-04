import { useRef, useCallback, useState } from 'react';
import { Heart, Camera } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { TIMING } from '@/lib/constants';
import { usePhotoLikeState } from '@/features/photos/hooks/use-photo-like';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { useTimeline } from '@/features/timeline/hooks/use-timeline';
import type { TimelinePost } from '@/features/timeline/types';

function TimelineCard({ post }: { post: TimelinePost }) {
  const { isGuest, isAuthenticated } = useAuth();
  const isLiked = usePhotoLikes(post.id);
  const toggleLike = useToggleLike();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localCount, setLocalCount] = useState(post.likes_count ?? 0);
  const [imgError, setImgError] = useState(false);
  const lastTapRef = useRef(0);

  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLocalCount(post.likes_count ?? 0);
  }, [post.likes_count]);

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
    toggleLike.mutate({ photoId: post.id, isLiked: localLiked });
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < TIMING.DOUBLE_TAP_DELAY) {
      if (!localLiked) handleLike();
    }
    lastTapRef.current = now;
  };

  const nickname = post.users?.nickname ?? 'ユーザー';
  const avatarUrl = post.users?.avatar_url;
  const bio = post.users?.bio;

  return (
    <>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* User info header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <AvatarImage src={avatarUrl} fallback={nickname} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{nickname}</p>
            {bio && <p className="text-xs text-muted-foreground truncate">{bio}</p>}
          </div>
          <p className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ja })}
          </p>
        </div>

        {/* Photo */}
        <div className="relative aspect-[4/3] bg-muted" onClick={handleDoubleTap}>
          {!imgError ? (
            <img
              src={post.image_url}
              alt={post.caption || 'Photo'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Camera className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          {heartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-16 h-16 fill-white text-white drop-shadow-lg animate-like-burst" />
            </div>
          )}
        </div>

        {/* Actions & caption */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              aria-label="いいね"
              className="flex items-center gap-1.5 text-sm transition-all active:scale-125"
            >
              <Heart
                className={`w-5 h-5 transition-all duration-200 ${
                  localLiked ? 'fill-destructive text-destructive scale-110' : 'text-muted-foreground'
                }`}
              />
              <span className={localLiked ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {localCount}
              </span>
            </button>
          </div>

          {post.caption && (
            <p className="text-sm text-foreground">
              <span className="font-semibold mr-1.5">{nickname}</span>
              {post.caption}
            </p>
          )}
        </div>
      </div>

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="px-4 py-3 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelinePage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useTimeline();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: '200px' }
      );
      observerRef.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  if (isLoading) {
    return (
      <div className="px-4 py-4 max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-foreground mb-4">タイムライン</h1>
        <TimelineSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">読み込みに失敗しました</p>
      </div>
    );
  }

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  if (posts.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">まだ投稿がありません</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-foreground mb-4">タイムライン</h1>
      <div className="space-y-4">
        {posts.map(post => (
          <TimelineCard key={post.id} post={post} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="py-4">
          <TimelineSkeleton />
        </div>
      )}
    </div>
  );
}
