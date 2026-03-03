import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { useSpots } from '@/features/spots/hooks/use-spots';
import { useUserStamps } from '@/features/spots/hooks/use-user-stamps';
import { CATEGORY_COLORS, escapeHtml, createMarkerElement } from '@/features/map/lib/map-utils';
import { useMapInit } from '@/features/map/hooks/use-map-init';
import { SpotCard } from '@/features/map/components/spot-card';
import { Search, Map, List, Navigation, Loader2 } from 'lucide-react';
import type { MapViewMode } from '@/features/map/types';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/lib/env';

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

  const onBanner = useCallback((msg: string) => setInfoBanner(msg), []);
  const { mapContainer, mapRef, markersRef, handleLocate } = useMapInit({ viewMode, spots, onBanner });

  const filteredSpots = spots.filter(spot => {
    const matchSearch = !searchQuery || spot.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === '全て' || spot.category === selectedCategory;
    const matchArea = selectedArea === '全エリア' || spot.area === selectedArea;
    return matchSearch && matchCategory && matchArea;
  });

  // Update markers when spots/filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || viewMode !== 'map') return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredSpots.forEach(spot => {
      const color = CATEGORY_COLORS[spot.category] || '#0D9488';
      const isVisited = stampedSpotIds.has(spot.id);

      const el = createMarkerElement(spot.name, color, isVisited);

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
            navigate(`/spots/${spot.slug}`);
          });
        }, 10);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'top' })
        .setLngLat([Number(spot.longitude), Number(spot.latitude)])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredSpots, stampedSpotIds, viewMode, navigate, mapRef, markersRef]);

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
      {/* Search & filters */}
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

      {/* Map or List */}
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
                <SpotCard key={spot.id} spot={spot} isVisited={stampedSpotIds.has(spot.id)} onClick={() => navigate(`/spots/${spot.slug}`)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
