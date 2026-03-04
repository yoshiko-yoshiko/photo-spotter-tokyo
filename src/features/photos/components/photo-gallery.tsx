import { useState } from 'react';
import { useSpotPhotos } from '@/features/photos/hooks/use-photos';
import { PhotoCard } from '@/features/photos/components/photo-card';
import { PhotoDetailModal } from '@/features/photos/components/photo-detail-modal';
import { Camera } from 'lucide-react';
import type { PhotoGalleryProps, PhotoWithUser } from '@/features/photos/types';

export function PhotoGallery({ spotId }: PhotoGalleryProps) {
  const { data: photos = [], isLoading } = useSpotPhotos(spotId);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithUser | null>(null);

  if (isLoading) {
    return (
      <div className="mt-6">
        <h2 className="text-lg font-bold text-foreground px-4 mb-3">📷 みんなの写真</h2>
        <div className="grid grid-cols-2 gap-2 px-4">
          {[1, 2].map(i => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground">📷 みんなの写真</h2>
        <span className="text-sm text-muted-foreground">{photos.length}枚</span>
      </div>

      {photos.length === 0 ? (
        <div className="mx-4 py-8 rounded-xl border border-dashed border-border flex flex-col items-center text-center">
          <Camera className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">まだ写真がありません</p>
          <p className="text-xs text-muted-foreground mt-0.5">最初の投稿者になろう！</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4">
          {photos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo as PhotoWithUser}
              onClick={() => setSelectedPhoto(photo as PhotoWithUser)}
            />
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          user={selectedPhoto.users}
          isOpen
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
