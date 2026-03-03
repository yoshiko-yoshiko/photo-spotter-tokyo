import { useState, useCallback } from 'react';
import type { DebugPosition } from '@/features/debug/types';

const DEBUG_MODE_KEY = 'photo_spotter_debug_gps';
const DEBUG_POSITION_KEY = 'debug_gps_position';

function getStoredDebugMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === 'gps') return true;
  if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') return true;
  return sessionStorage.getItem(DEBUG_MODE_KEY) === 'true';
}

function getStoredPosition(): DebugPosition | null {
  try {
    const stored = sessionStorage.getItem(DEBUG_POSITION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

export function useDebugGps() {
  const [isDebugMode, setIsDebugMode] = useState(getStoredDebugMode);
  const [debugPosition, setDebugPosition] = useState<DebugPosition | null>(getStoredPosition);

  const setDebugMode = useCallback((on: boolean) => {
    if (on) {
      sessionStorage.setItem(DEBUG_MODE_KEY, 'true');
    } else {
      sessionStorage.removeItem(DEBUG_MODE_KEY);
      sessionStorage.removeItem(DEBUG_POSITION_KEY);
      setDebugPosition(null);
    }
    setIsDebugMode(on);
  }, []);

  const setPosition = useCallback((pos: DebugPosition) => {
    setDebugPosition(pos);
    sessionStorage.setItem(DEBUG_POSITION_KEY, JSON.stringify(pos));
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
    setDebugMode,
    debugPosition,
    setPosition,
    getCurrentPosition,
  };
}
