import { useSpots } from '@/features/spots/hooks/use-spots';
import { useDebugGps } from '@/features/debug/hooks/use-debug-gps';
import { MapPin, Bug, Navigation, ToggleLeft, ToggleRight } from 'lucide-react';

export default function DebugPage() {
  const { data: spots = [] } = useSpots();
  const { isDebugMode, setDebugMode, debugPosition, setPosition } = useDebugGps();

  return (
    <div className="min-h-dvh bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Bug className="w-6 h-6 text-red-500" />
          <h1 className="text-xl font-bold">デバッグコンソール</h1>
        </div>

        {/* GPS Debug Toggle */}
        <section className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              GPSデバッグモード
            </h2>
            <button onClick={() => setDebugMode(!isDebugMode)}
              className={`p-2 rounded-lg ${isDebugMode ? 'bg-red-500 text-white' : 'bg-muted'}`}>
              {isDebugMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
          </div>
          {isDebugMode && (
            <div className="text-sm text-muted-foreground">
              現在の設定: {debugPosition ? `${debugPosition.latitude.toFixed(4)}, ${debugPosition.longitude.toFixed(4)}` : '未設定'}
            </div>
          )}
        </section>

        {/* Spot Selector */}
        {isDebugMode && (
          <section className="bg-card rounded-xl border p-4 space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              スポット位置に移動
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {spots.map(spot => (
                <button key={spot.id}
                  onClick={() => setPosition({ latitude: Number(spot.latitude), longitude: Number(spot.longitude) })}
                  className="text-left p-3 rounded-lg border hover:bg-muted transition-colors">
                  <div className="font-medium text-sm">{spot.name}</div>
                  <div className="text-xs text-muted-foreground">{spot.area} · {spot.latitude}, {spot.longitude}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Environment Info */}
        <section className="bg-card rounded-xl border p-4 space-y-2">
          <h2 className="font-bold">環境情報</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Mode: {import.meta.env.MODE}</div>
            <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '設定済み' : '未設定'}</div>
            <div>Mapbox Token: {import.meta.env.VITE_MAPBOX_TOKEN ? '設定済み' : '未設定'}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
