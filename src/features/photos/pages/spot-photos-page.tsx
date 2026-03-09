import { useParams, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { useSpot } from '@/features/spots/hooks/use-spots';
import { useSpotIdMap } from '@/features/spots/hooks/use-spot-id-map';
import { useInfiniteSpotPhotos } from '@/features/photos/hooks/use-photos';
import { PhotoCard } from '@/features/photos/components/photo-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpotPhotosPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: spot, isLoading: isSpotLoading } = useSpot(slug);
  const { data: idMap } = useSpotIdMap();
  const supabaseSpotId = idMap?.bySlug[slug ?? ''];

  const {
    data,
    isLoading: isPhotosLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
  } = useInfiniteSpotPhotos(supabaseSpotId);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;

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
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const photos = data?.pages.flatMap((page) => page.photos) ?? [];
  const isLoading = isSpotLoading || isPhotosLoading;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24 md:max-w-3xl md:mx-auto">
        {/* Header skeleton */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 gap-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border bg-card">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-2.5 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-muted-foreground">写真の読み込みに失敗しました</p>
        <button type="button" onClick={() => navigate(-1)} className="text-primary text-sm mt-3">
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24 md:max-w-3xl md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="戻る"
          className="shrink-0 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground truncate">
          {spot?.name ?? 'スポットの写真'}
        </h1>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="mx-4 mt-8 py-12 rounded-xl border border-dashed border-border flex flex-col items-center text-center">
          <Camera className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">このスポットにはまだ写真がありません</p>
          <p className="text-xs text-muted-foreground mt-1">最初の投稿者になろう！</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
