import { useNavigate } from 'react-router-dom';
import { Camera, Lock, Check } from 'lucide-react';
import { CATEGORY_COLORS } from '@/features/map/lib/map-utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Spot } from '@/lib/microcms/types';

interface StampsGridProps {
  spots: Spot[];
  stampedSpotIds: Set<string>;
  idMap: { byMicrocmsId: Record<string, string> } | undefined;
  isLoading: boolean;
}

export function StampsGrid({ spots, stampedSpotIds, idMap, isLoading }: StampsGridProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="px-3 md:px-8 pt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-w-4xl mx-auto">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-xl overflow-hidden border border-border">
            <Skeleton className="aspect-square w-full" />
            <div className="p-1.5 bg-card">
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-3 md:px-8 pt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-w-4xl mx-auto">
      {spots.map(spot => {
        const isCollected = stampedSpotIds.has(idMap?.byMicrocmsId[spot.id] ?? '');
        const color = CATEGORY_COLORS[spot.category] || '#0D9488';
        return (
          <button
            type="button"
            key={spot.id}
            onClick={() => navigate(`/spots/${spot.slug}`)}
            className={`rounded-xl overflow-hidden border transition-all ${
              isCollected ? 'border-primary shadow-sm' : 'border-border opacity-75 grayscale-[60%]'
            }`}
          >
            <div className="relative aspect-square bg-muted">
              {spot.image_url ? (
                <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }} />
              ) : null}
              <div className="w-full h-full items-center justify-center" style={{ display: spot.image_url ? 'none' : 'flex' }}>
                <Camera className="w-6 h-6 text-muted-foreground/30" />
              </div>
              {isCollected && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-stamp-gold flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              {!isCollected && (
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-foreground/40 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="p-1.5 bg-card">
              <p className="text-[10px] font-medium text-foreground truncate">{spot.name}</p>
              <div className="w-full h-0.5 rounded-full mt-0.5" style={{ background: color }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
