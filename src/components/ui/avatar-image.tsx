import { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarImageProps {
  src: string | null | undefined;
  fallback?: string;
  className?: string;
  iconSize?: string;
}

export function AvatarImage({ src, fallback, className = 'w-9 h-9', iconSize = 'w-4 h-4' }: AvatarImageProps) {
  const [error, setError] = useState(false);

  const showFallback = !src || error;

  return (
    <div className={`rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {!showFallback ? (
        <img
          src={src!}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      ) : fallback ? (
        <span className={`font-medium text-muted-foreground ${iconSize}`}>{fallback.charAt(0)}</span>
      ) : (
        <User className={`text-muted-foreground ${iconSize}`} />
      )}
    </div>
  );
}
