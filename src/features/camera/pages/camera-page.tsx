import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ImagePlus, X, MapPin, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSpots } from '@/features/spots/hooks/use-spots';
import { useSpotIdMap } from '@/features/spots/hooks/use-spot-id-map';
import { usePhotoUpload } from '@/features/camera/hooks/use-photo-upload';
import { useUploadGuard } from '@/features/camera/hooks/use-upload-guard';
import { validateImage, resizeImage } from '@/features/camera/lib/image-utils';
import { PhotoPreview } from '@/features/camera/components/photo-preview';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { ConfettiCanvas } from '@/features/rewards/components/confetti-canvas';
import { RewardUnlockOverlay } from '@/features/rewards/components/reward-unlock-overlay';
import type { Step } from '@/features/camera/types';

export default function CameraPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { data: spots = [] } = useSpots();
  const { data: idMap } = useSpotIdMap();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, isUploading, newRewards, showCelebration, dismissCelebration } = usePhotoUpload();

  const [step, setStep] = useState<Step>('select-photo');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [spotSearch, setSpotSearch] = useState('');
  const showAuthModal = isGuest;

  // Revoke objectURL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Prevent accidental navigation during upload
  useUploadGuard(isUploading);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const valid = await validateImage(f);
    if (!valid) return;

    const resized = await resizeImage(f);
    setFile(resized);
    setPreview(URL.createObjectURL(resized));
    setStep('select-spot');
  };

  const filteredSpots = spots.filter(s =>
    !spotSearch || s.name.toLowerCase().includes(spotSearch.toLowerCase()) || s.area.includes(spotSearch)
  );

  const handleUpload = async () => {
    if (!file || !selectedSpotId) return;
    setStep('uploading');

    try {
      const supabaseId = idMap?.byMicrocmsId[selectedSpotId] ?? selectedSpotId;
      await uploadPhoto(file, supabaseId, caption);
      setStep('done');
    } catch {
      setStep('select-spot');
    }
  };

  const resetFlow = () => {
    setStep('select-photo');
    setPreview(null);
    setFile(null);
    setSelectedSpotId(null);
    setCaption('');
    setSpotSearch('');
  };

  const handleRetake = () => {
    setStep('select-photo');
    setPreview(null);
    setFile(null);
  };

  const selectedSpot = spots.find(s => s.id === selectedSpotId);

  if (isGuest) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-surface px-4 text-center">
        <Camera className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground">ログインが必要です</h2>
        <p className="text-muted-foreground text-sm mt-2">写真を投稿するにはログインしてください</p>
        <AuthPromptModal open={showAuthModal} onClose={() => navigate('/map')} />
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-full">
      {/* Header */}
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <h1 className="text-lg font-bold text-foreground">
          {step === 'select-photo' && '📷 写真を選択'}
          {step === 'select-spot' && '📍 スポットを選択'}
          {step === 'uploading' && '⏳ アップロード中'}
          {step === 'done' && '🎉 投稿完了'}
        </h1>
        {step !== 'select-photo' && step !== 'uploading' && step !== 'done' && (
          <button onClick={resetFlow} aria-label="リセット" className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Step: Select Photo */}
      {step === 'select-photo' && (
        <div className="px-4 pt-8 flex flex-col items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium">写真を撮影・選択</p>
            <p className="text-muted-foreground text-xs">タップしてカメラを起動またはギャラリーから選択</p>
          </button>

          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
              input.click();
            }}
            className="mt-4 flex items-center gap-2 text-primary text-sm"
          >
            <ImagePlus className="w-4 h-4" /> ギャラリーから選択
          </button>
        </div>
      )}

      {/* Step: Select Spot */}
      {step === 'select-spot' && (
        <div className="px-4">
          {preview && (
            <PhotoPreview
              previewUrl={preview}
              caption={caption}
              onCaptionChange={setCaption}
              onRetake={handleRetake}
            />
          )}

          {/* Spot selection */}
          <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" /> 撮影スポットを選択
          </h3>
          <input
            value={spotSearch}
            onChange={(e) => setSpotSearch(e.target.value)}
            placeholder="スポット名で検索..."
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-card focus:ring-2 focus:ring-primary focus:outline-none mb-3"
          />

          <div className="space-y-2 max-h-[40vh] overflow-y-auto pb-24">
            {filteredSpots.map(spot => (
              <button
                key={spot.id}
                onClick={() => setSelectedSpotId(spot.id)}
                className={`w-full text-left rounded-xl p-3 border transition-colors ${
                  selectedSpotId === spot.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{spot.name}</p>
                <p className="text-xs text-muted-foreground">{spot.category} · {spot.area}</p>
              </button>
            ))}
          </div>

          {/* Upload button */}
          <div className="fixed bottom-20 left-4 right-4 z-40 md:max-w-2xl md:mx-auto">
            <button
              onClick={handleUpload}
              disabled={!selectedSpotId || !file}
              className={`w-full rounded-full py-4 text-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-colors ${
                selectedSpotId && file
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Upload className="w-5 h-5" /> 投稿する
            </button>
          </div>
        </div>
      )}

      {/* Step: Uploading */}
      {step === 'uploading' && (
        <div className="px-4 pt-16 flex flex-col items-center text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h2 className="text-lg font-bold text-foreground">アップロード中...</h2>
          <p className="text-muted-foreground text-sm mt-2">写真を投稿しています</p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="px-4 pt-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">投稿完了！</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {selectedSpot?.name}のスタンプを獲得しました
          </p>
          <div className="flex gap-3 mt-8 w-full max-w-xs">
            <button
              onClick={resetFlow}
              className="flex-1 rounded-full border-2 border-primary text-primary py-2.5 font-medium"
            >
              もう1枚投稿
            </button>
            <button
              onClick={() => navigate('/collection')}
              className="flex-1 rounded-full bg-primary text-primary-foreground py-2.5 font-medium"
            >
              スタンプ帳へ
            </button>
          </div>
        </div>
      )}

      <AuthPromptModal open={showAuthModal} onClose={() => navigate('/map')} />
      <ConfettiCanvas active={showCelebration} />
      <RewardUnlockOverlay rewards={newRewards} open={showCelebration} onClose={dismissCelebration} />
    </div>
  );
}
