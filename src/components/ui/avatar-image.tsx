import { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarImageProps {
  src: string | null | undefined;
  fallback?: string;
  className?: string;
  iconSize?: string;
}

const ICON_TO_FONT: Record<string, string> = {
  'w-3 h-3': 'text-[10px]',
  'w-4 h-4': 'text-xs',
  'w-5 h-5': 'text-sm',
  'w-7 h-7': 'text-lg',
  'w-10 h-10': 'text-2xl',
};

export function AvatarImage({ src, fallback, className = 'w-9 h-9', iconSize = 'w-4 h-4' }: AvatarImageProps) {
  const [error, setError] = useState(false);

  const showFallback = !src || error;
  const fontSize = ICON_TO_FONT[iconSize] || 'text-sm';

  return (
    <div className={`rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {!showFallback ? (
        <img
          src={src!}
          alt={fallback ? `${fallback}のアバター` : ""}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      ) : fallback ? (
        <span className={`font-medium text-muted-foreground leading-none ${fontSize}`}>{fallback.charAt(0)}</span>
      ) : (
        <User className={`text-muted-foreground ${iconSize}`} />
      )}
    </div>
  );
}
