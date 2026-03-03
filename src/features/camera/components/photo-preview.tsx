import { X } from 'lucide-react';
import { IMAGE_CONFIG } from '@/features/camera/lib/image-utils';

interface PhotoPreviewProps {
  previewUrl: string;
  caption: string;
  onCaptionChange: (value: string) => void;
  onRetake: () => void;
}

export function PhotoPreview({ previewUrl, caption, onCaptionChange, onRetake }: PhotoPreviewProps) {
  return (
    <>
      <div className="relative mb-4">
        <img src={previewUrl} alt="Preview" className="w-full aspect-[4/3] object-cover rounded-xl" />
        <button
          onClick={onRetake}
          className="absolute top-2 right-2 bg-card/80 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <input
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="キャプションを追加..."
          maxLength={IMAGE_CONFIG.CAPTION_MAX_LENGTH}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-card focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <p className={`text-xs text-right mt-1 ${caption.length >= IMAGE_CONFIG.CAPTION_WARN_THRESHOLD ? 'text-orange-500' : 'text-muted-foreground'}`}>
          {caption.length}/{IMAGE_CONFIG.CAPTION_MAX_LENGTH}
        </p>
      </div>
    </>
  );
}
