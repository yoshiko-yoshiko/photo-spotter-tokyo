import { useRef, useCallback, useEffect, useState } from 'react';
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
  const [mapReady, setMapReady] = useState(false);

  const initMap = useCallback(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Show map immediately with default center (no waiting for geolocation)
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: TOKYO_CENTER,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      projection: 'mercator',
    });

    mapRef.current = map;

    // Fit to spots bounds once map loads (if spots available)
    map.on('load', () => {
      setMapReady(true);
      const bounds = getSpotsBounds(spotsRef.current);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 120, left: 40, right: 40 },
          maxZoom: 14,
        });
      }
    });

    // Asynchronously try to get user location and adjust
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const inTokyo = isInTokyo(latitude, longitude);

        if (inTokyo) {
          // Add user location marker
          const el = document.createElement('div');
          el.className = 'w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow animate-pulse';
          new mapboxgl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map);

          // Fly to user location
          map.flyTo({ center: [longitude, latitude], zoom: MAP_CONFIG.NEARBY_ZOOM });

          // Check for nearby spots
          const currentSpots = spotsRef.current;
          if (currentSpots.length > 0) {
            let minDist = Infinity;
            for (const s of currentSpots) {
              const d = getDistanceMeters(latitude, longitude, Number(s.latitude), Number(s.longitude));
              if (d < minDist) minDist = d;
            }
            if (minDist <= MAP_CONFIG.NEARBY_THRESHOLD_M) {
              onBanner('📍 近くにスポットがあります！');
              setTimeout(() => onBanner(''), MAP_CONFIG.NEARBY_BANNER_DURATION_MS);
            }
          }
        } else {
          onBanner('📍 東京のフォトスポットを表示しています');
          setTimeout(() => onBanner(''), MAP_CONFIG.INFO_BANNER_DURATION_MS);
        }
      },
      () => {
        // Geolocation failed — map is already showing, no action needed
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
    );
  }, [onBanner]);

  useEffect(() => {
    if (viewMode === 'map') {
      const t = setTimeout(initMap, MAP_CONFIG.MAP_INIT_DELAY_MS);
      return () => clearTimeout(t);
    } else {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    }
  }, [viewMode, initMap]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
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

  return { mapContainer, mapRef, markersRef, handleLocate, mapReady };
}
