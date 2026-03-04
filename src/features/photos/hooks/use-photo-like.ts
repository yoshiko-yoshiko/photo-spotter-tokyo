import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { TIMING } from '@/lib/constants';
import { usePhotoLikes, useToggleLike } from '@/features/photos/hooks/use-photos';

interface UsePhotoLikeStateOptions {
  photoId: string | undefined;
  initialLikesCount: number;
}

interface UsePhotoLikeStateReturn {
  localLiked: boolean;
  localCount: number;
  heartBurst: boolean;
  isPending: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  handleLike: () => void;
  handleDoubleTap: () => void;
}

export function usePhotoLikeState({
  photoId,
  initialLikesCount,
}: UsePhotoLikeStateOptions): UsePhotoLikeStateReturn {
  const { isGuest, isAuthenticated } = useAuth();
  const isLiked = usePhotoLikes(photoId);
  const toggleLike = useToggleLike();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localCount, setLocalCount] = useState(initialLikesCount);
  const lastTapRef = useRef(0);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLocalCount(initialLikesCount);
  }, [initialLikesCount]);

  // Cleanup burst timer
  useEffect(() => {
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  const handleLike = useCallback(() => {
    if (isGuest || !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!localLiked) {
      setHeartBurst(true);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      burstTimerRef.current = setTimeout(() => {
        setHeartBurst(false);
        burstTimerRef.current = null;
      }, TIMING.LIKE_BURST_DURATION);
    }
    setLocalLiked(!localLiked);
    setLocalCount(prev => localLiked ? prev - 1 : prev + 1);
    if (photoId) {
      toggleLike.mutate({ photoId, isLiked: localLiked });
    }
  }, [isGuest, isAuthenticated, localLiked, toggleLike, photoId]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < TIMING.DOUBLE_TAP_DELAY) {
      if (!localLiked) handleLike();
    }
    lastTapRef.current = now;
  }, [localLiked, handleLike]);

  return {
    localLiked,
    localCount,
    heartBurst,
    isPending: toggleLike.isPending,
    showAuthModal,
    setShowAuthModal,
    handleLike,
    handleDoubleTap,
  };
}
