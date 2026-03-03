import { useDebugGps } from '@/features/debug/hooks/use-debug-gps';
import { useSpots } from '@/features/spots/hooks/use-spots';

export function DebugGpsPanel() {
  const { debugPosition, setPosition } = useDebugGps();
  const { data: spots = [] } = useSpots();

  const handleSpotSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const spotId = e.target.value;
    if (!spotId) return;
    const spot = spots.find(s => s.id === spotId);
    if (spot) {
      setPosition({
        latitude: Number(spot.latitude),
        longitude: Number(spot.longitude),
      });
    }
  };

  return (
    <div className="bg-red-600 text-white px-3 py-2 text-xs z-[9999] relative">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-bold shrink-0">GPS DEBUG ON</span>
        <select
          onChange={handleSpotSelect}
          defaultValue=""
          className="bg-red-800 text-white rounded px-2 py-1 text-xs flex-1 min-w-[140px] max-w-[240px]"
        >
          <option value="">-- select spot --</option>
          {spots.map(spot => (
            <option key={spot.id} value={spot.id}>
              {spot.name}
            </option>
          ))}
        </select>
        {debugPosition && (
          <span className="text-red-200 shrink-0">
            {debugPosition.latitude.toFixed(4)}, {debugPosition.longitude.toFixed(4)}
          </span>
        )}
      </div>
    </div>
  );
}
