import { useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { CATEGORY_COLORS } from '@/features/map/lib/map-utils';
import type { SpotCardProps } from '@/features/map/types';

export function SpotCard({ spot, isVisited, onClick, variant = 'default' }: SpotCardProps) {
  const color = CATEGORY_COLORS[spot.category] || '#0D9488';
  const [imgError, setImgError] = useState(false);

  if (variant === 'compact') {
    return (
      <div onClick={onClick} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform flex">
        <div className="relative w-24 h-24 shrink-0">
          {!imgError && spot.image_url ? (
            <img
              src={spot.image_url}
              alt={spot.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Camera className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
          {isVisited && (
            <span className="absolute top-1.5 right-1.5 bg-stamp-gold text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="p-2.5 flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-foreground truncate">{spot.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{spot.category}</span>
            <span className="text-[10px] text-muted-foreground">{spot.area}</span>
          </div>
          {spot.photo_tip && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{spot.photo_tip}</p>
          )}
        </div>
      </div>
    );
  }

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
