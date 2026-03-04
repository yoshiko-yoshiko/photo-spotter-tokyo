import { useRef, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  isInTokyo,
  TOKYO_CENTER,
  getSpotsBounds,
  getDistanceMeters,
  MAP_CONFIG,
} from '@/features/map/lib/map-utils';
import { env } from '@/lib/env';
import type { Spot } from '@/lib/microcms/types';

const MAPBOX_TOKEN = env.MAPBOX_TOKEN;

interface UseMapInitOptions {
  viewMode: 'map' | 'list';
  spots: Spot[];
  onBanner: (msg: string) => void;
}

export function useMapInit({ viewMode, spots, onBanner }: UseMapInitOptions) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const spotsRef = useRef(spots);
  spotsRef.current = spots;

  const createMap = useCallback(
    (center: [number, number], zoom: number, userLoc: { latitude: number; longitude: number } | null) => {
      if (!mapContainer.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom,
      });

      if (userLoc) {
        const el = document.createElement('div');
        el.className = 'w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow animate-pulse';
        new mapboxgl.Marker({ element: el }).setLngLat([userLoc.longitude, userLoc.latitude]).addTo(map);

        const currentSpots = spotsRef.current;
        if (currentSpots.length > 0) {
          let minDist = Infinity;
          for (const s of currentSpots) {
            const d = getDistanceMeters(userLoc.latitude, userLoc.longitude, Number(s.latitude), Number(s.longitude));
            if (d < minDist) minDist = d;
          }
          if (minDist <= MAP_CONFIG.NEARBY_THRESHOLD_M) {
            onBanner('📍 近くにスポットがあります！');
            setTimeout(() => onBanner(''), MAP_CONFIG.NEARBY_BANNER_DURATION_MS);
          }
        }
      } else {
        const bounds = getSpotsBounds(spotsRef.current);
        if (bounds) {
          map.on('load', () => {
            map.fitBounds(bounds, {
              padding: { top: 80, bottom: 120, left: 40, right: 40 },
              maxZoom: 14,
            });
          });
        }
      }

      mapRef.current = map;
    },
    [onBanner],
  );

  const initMap = useCallback(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const inTokyo = isInTokyo(latitude, longitude);
        const center: [number, number] = inTokyo ? [longitude, latitude] : TOKYO_CENTER;
        const zoom = inTokyo ? MAP_CONFIG.NEARBY_ZOOM : MAP_CONFIG.DEFAULT_ZOOM;

        if (!inTokyo) {
          onBanner('📍 東京のフォトスポットを表示しています');
          setTimeout(() => onBanner(''), MAP_CONFIG.INFO_BANNER_DURATION_MS);
        }

        createMap(center, zoom, inTokyo ? { latitude, longitude } : null);
      },
      () => {
        createMap(TOKYO_CENTER, MAP_CONFIG.DEFAULT_ZOOM, null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
    );
  }, [createMap, onBanner]);

  useEffect(() => {
    if (viewMode === 'map') {
      const t = setTimeout(initMap, MAP_CONFIG.MAP_INIT_DELAY_MS);
      return () => clearTimeout(t);
    } else {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    }
  }, [viewMode, initMap]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handleLocate = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: MAP_CONFIG.LOCATE_ZOOM });
      },
      () => {},
    );
  }, []);

  return { mapContainer, mapRef, markersRef, handleLocate };
}
