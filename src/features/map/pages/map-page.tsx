import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSpots } from '@/features/spots/hooks/use-spots';
import { useUserStamps } from '@/features/spots/hooks/use-user-stamps';
import { isInTokyo, TOKYO_CENTER, CATEGORY_COLORS, getSpotsBounds, getDistanceMeters } from '@/features/map/lib/map-utils';
import { Search, Map, List, Navigation, Camera, Check, Loader2 } from 'lucide-react';
import type { MapViewMode, SpotCardProps } from '@/features/map/types';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/lib/env';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const MAPBOX_TOKEN = env.MAPBOX_TOKEN;

const CATEGORIES = ['全て', 'ランドマーク', '寺社・歴史', '自然・公園', '都市・カルチャー'] as const;
const AREAS = ['全エリア', '港区', '台東区', '渋谷区', '墨田区', '千代田区', '新宿区'] as const;

export default function MapPage() {
  const navigate = useNavigate();
  const { data: spots = [], isLoading } = useSpots();
  const { data: stamps = [] } = useUserStamps();
  const stampedSpotIds = new Set(stamps.map(s => s.spot_id));

  const [viewMode, setViewMode] = useState<MapViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全て');
  const [selectedArea, setSelectedArea] = useState<string>('全エリア');
  const [infoBanner, setInfoBanner] = useState('');

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const spotsRef = useRef(spots);
  spotsRef.current = spots;

  const filteredSpots = spots.filter(spot => {
    const matchSearch = !searchQuery || spot.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === '全て' || spot.category === selectedCategory;
    const matchArea = selectedArea === '全エリア' || spot.area === selectedArea;
    return matchSearch && matchCategory && matchArea;
  });

  const initMap = useCallback(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const inTokyo = isInTokyo(latitude, longitude);
        const center: [number, number] = inTokyo ? [longitude, latitude] : TOKYO_CENTER;
        const zoom = inTokyo ? 13 : 11;

        if (!inTokyo) {
          setInfoBanner('📍 東京のフォトスポットを表示しています');
          setTimeout(() => setInfoBanner(''), 5000);
        }

        createMap(center, zoom, inTokyo ? { latitude, longitude } : null);
      },
      () => {
        createMap(TOKYO_CENTER, 11, null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  const createMap = (center: [number, number], zoom: number, userLoc: { latitude: number; longitude: number } | null) => {
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

      // Pattern A: in Tokyo — check for nearby spots
      const currentSpots = spotsRef.current;
      if (currentSpots.length > 0) {
        let minDist = Infinity;
        for (const s of currentSpots) {
          const d = getDistanceMeters(userLoc.latitude, userLoc.longitude, Number(s.latitude), Number(s.longitude));
          if (d < minDist) minDist = d;
        }
        if (minDist <= 1000) {
          setInfoBanner('📍 近くにスポットがあります！');
          setTimeout(() => setInfoBanner(''), 3000);
        }
      }
    } else {
      // Pattern B/C: outside Tokyo or GPS failure — fit to all spots
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
  };

  useEffect(() => {
    if (viewMode === 'map') {
      // small delay to let DOM render
      const t = setTimeout(initMap, 100);
      return () => clearTimeout(t);
    } else {
      // Cleanup map when switching to list view
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    }
  }, [viewMode, initMap]);

  // Update markers when spots/filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || viewMode !== 'map') return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredSpots.forEach(spot => {
      const color = CATEGORY_COLORS[spot.category] || '#0D9488';
      const isVisited = stampedSpotIds.has(spot.id);

      const el = document.createElement('div');
      el.style.width = '80px';
      el.className = 'flex flex-col items-center cursor-pointer';
      el.innerHTML = `
        <div class="relative">
          <div style="background:${color}" class="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </div>
          ${isVisited ? '<div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' : ''}
        </div>
        <span class="mt-1 text-[10px] font-bold text-slate-700 bg-white/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap max-w-[80px] truncate">${escapeHtml(spot.name)}</span>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '220px', closeButton: false })
        .setHTML(`
          <div class="cursor-pointer" id="popup-${escapeHtml(spot.id)}">
            <img src="${escapeHtml(spot.image_url || '')}" alt="${escapeHtml(spot.name)}" class="w-full aspect-video object-cover rounded-t-lg" onerror="this.style.display='none'" />
            <div class="p-2">
              <p class="text-sm font-bold text-slate-800 truncate">${escapeHtml(spot.name)}</p>
              <div class="flex items-center gap-1 mt-1">
                <span class="text-xs px-1.5 py-0.5 rounded-full" style="background:${color}20;color:${color}">${escapeHtml(spot.category)}</span>
                <span class="text-xs text-slate-500">${escapeHtml(spot.area || '')}</span>
              </div>
              <p class="text-xs text-teal-600 font-medium mt-1.5">詳細を見る →</p>
            </div>
          </div>
        `);

      popup.on('open', () => {
        setTimeout(() => {
          document.getElementById(`popup-${spot.id}`)?.addEventListener('click', () => {
            navigate(`/spots/${spot.id}`);
          });
        }, 10);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'top' })
        .setLngLat([Number(spot.longitude), Number(spot.latitude)])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredSpots, stampedSpotIds, viewMode, navigate]);

  // Cleanup
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 });
      },
      () => {}
    );
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center bg-surface px-4 text-center">
        <Map className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground">Mapboxトークンが未設定</h2>
        <p className="text-muted-foreground text-sm mt-2">
          環境変数 VITE_MAPBOX_TOKEN を設定してください
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Search & filters - compact top bar */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border px-3 pt-2 pb-2 space-y-1.5 z-10">
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-full px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="スポット名・エリアで検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="bg-muted rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('map')}
              aria-label="地図表示に切替"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="リスト表示に切替"
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="text-border mx-0.5 self-center">|</span>
          {AREAS.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedArea === area
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      {infoBanner && (
        <div className="bg-primary/10 text-primary text-sm px-4 py-1.5 text-center animate-fade-in">
          {infoBanner}
        </div>
      )}

      {/* Map or List - fills remaining space */}
      {viewMode === 'map' ? (
        <div className="relative flex-1 min-h-0">
          <div ref={mapContainer} className="w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          <button
            onClick={handleLocate}
            aria-label="現在地に移動"
            className="absolute bottom-6 right-3 z-10 bg-card rounded-full w-12 h-12 shadow-md flex items-center justify-center border border-border"
          >
            <Navigation className="w-5 h-5 text-primary" />
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pb-4 px-3 pt-3 bg-background">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                  <Skeleton className="w-full aspect-video" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">スポットが見つかりません</div>
          ) : (
            <div className="space-y-3">
              {filteredSpots.map(spot => (
                <SpotCard key={spot.id} spot={spot} isVisited={stampedSpotIds.has(spot.id)} onClick={() => navigate(`/spots/${spot.id}`)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpotCard({ spot, isVisited, onClick }: SpotCardProps) {
  const color = CATEGORY_COLORS[spot.category] || '#0D9488';
  const [imgError, setImgError] = useState(false);
  return (
    <div onClick={onClick} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
      <div className="relative">
        {!imgError && spot.image_url ? (
          <img
            src={spot.image_url}
            alt={spot.name}
            className="w-full aspect-video object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {isVisited && (
          <span className="absolute top-3 right-3 bg-stamp-gold text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> 訪問済み
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-base font-bold text-foreground truncate">{spot.name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{spot.category}</span>
          <span className="text-xs text-muted-foreground">{spot.area}</span>
        </div>
        {spot.photo_tip && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">{spot.photo_tip}</p>
        )}
        {spot.best_time && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            🕐 {spot.best_time}
          </p>
        )}
      </div>
    </div>
  );
}
