import { MapPin } from 'lucide-react';

export default function MapPage() {
  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center bg-surface px-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MapPin className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-foreground">🗺 地図</h2>
      <p className="text-muted-foreground text-sm mt-2">Phase 2で実装します</p>
    </div>
  );
}
