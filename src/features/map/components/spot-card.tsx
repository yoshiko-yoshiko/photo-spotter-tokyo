import { useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { CATEGORY_COLORS } from '@/features/map/lib/map-utils';
import type { SpotCardProps } from '@/features/map/types';

export function SpotCard({ spot, isVisited, onClick }: SpotCardProps) {
  const color = CATEGORY_COLORS[spot.category] || '#0D9488';
  const [imgError, setImgError] = useState(false);
  return (
    <div onClick={onClick} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
      <div className="relative">
        {!imgError && spot.image_url ? (
          <img
            src={spot.image_url}
            alt={spot.name}
            className="w-full aspect-video object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {isVisited && (
          <span className="absolute top-3 right-3 bg-stamp-gold text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> 訪問済み
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-base font-bold text-foreground truncate">{spot.name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{spot.category}</span>
          <span className="text-xs text-muted-foreground">{spot.area}</span>
        </div>
        {spot.photo_tip && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">{spot.photo_tip}</p>
        )}
        {spot.best_time && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            🕐 {spot.best_time}
          </p>
        )}
      </div>
    </div>
  );
}
