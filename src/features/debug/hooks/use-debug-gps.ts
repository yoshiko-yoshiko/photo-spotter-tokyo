import { useState, useCallback, useMemo } from 'react';
import type { DebugPosition } from '@/features/debug/types';

const DEBUG_STORAGE_KEY = 'debug_gps_position';

function getStoredPosition(): DebugPosition | null {
  try {
    const stored = sessionStorage.getItem(DEBUG_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

function storePosition(pos: DebugPosition) {
  sessionStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(pos));
}

export function useDebugGps() {
  const isDebugMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'gps') return true;
    if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') return true;
    return false;
  }, []);

  const [debugPosition, setDebugPosition] = useState<DebugPosition | null>(
    getStoredPosition
  );

  const setPosition = useCallback((pos: DebugPosition) => {
    setDebugPosition(pos);
    storePosition(pos);
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    if (isDebugMode && debugPosition) {
      return Promise.resolve({
        coords: {
          latitude: debugPosition.latitude,
          longitude: debugPosition.longitude,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    }

    return new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    );
  }, [isDebugMode, debugPosition]);

  return {
    isDebugMode,
    debugPosition,
    setPosition,
    getCurrentPosition,
  };
}
