import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { useSpots } from '@/features/spots/hooks/use-spots';
import { useSpotIdMap, useSpotIdSync } from '@/features/spots/hooks/use-spot-id-map';
import { useUserStamps } from '@/features/spots/hooks/use-user-stamps';
import { CATEGORY_COLORS, escapeHtml, createMarkerElement } from '@/features/map/lib/map-utils';
import { useMapInit } from '@/features/map/hooks/use-map-init';
import { useSpotFilter } from '@/features/map/hooks/use-spot-filter';
import { SpotCard } from '@/features/map/components/spot-card';
import { Search, Map, List, Navigation, Loader2, X } from 'lucide-react';
import type { MapViewMode } from '@/features/map/types';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/lib/env';

const MAPBOX_TOKEN = env.MAPBOX_TOKEN;

export default function MapPage() {
  const navigate = useNavigate();
  const { data: spots = [], isLoading } = useSpots();

  // カテゴリ・エリアをスポットデータから動的生成
  const categories = useMemo(() => {
    const cats = new Set(spots.map(s => s.category).filter(Boolean));
    return ['全て', ...Array.from(cats).sort()];
  }, [spots]);

  const areas = useMemo(() => {
    const areaSet = new Set(spots.map(s => s.area).filter(Boolean));
    return ['全エリア', ...Array.from(areaSet).sort()];
  }, [spots]);
  const { data: idMap } = useSpotIdMap();
  useSpotIdSync(spots);
  const { data: stamps = [] } = useUserStamps();
  const stampedSpotIds = useMemo(() => new Set(stamps.map(s => s.spot_id)), [stamps]);

  const [viewMode, setViewMode] = useState<MapViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全て');
  const [selectedArea, setSelectedArea] = useState<string>('全エリア');
  const [infoBanner, setInfoBanner] = useState('');

  const onBanner = useCallback((msg: string) => setInfoBanner(msg), []);
  const { mapContainer, mapRef, markersRef, handleLocate, mapReady } = useMapInit({ viewMode, spots, onBanner });

  const filteredSpots = useSpotFilter({ spots, searchQuery, selectedCategory, selectedArea });

  // Update markers when spots/filters change
  useEffect(() => {
    if (!mapReady || !mapRef.current || viewMode !== 'map') return;
    const map = mapRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredSpots.forEach(spot => {
      const rawColor = CATEGORY_COLORS[spot.category] || '#0D9488';
      const color = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : '#EF4444';
      const isVisited = stampedSpotIds.has(idMap?.byMicrocmsId[spot.id] ?? '');

      const el = createMarkerElement(spot.name, color, isVisited);

      const imageHtml = spot.image_url
        ? `<img src="${escapeHtml(spot.image_url)}" alt="${escapeHtml(spot.name)}" class="w-full aspect-video object-cover rounded-t-lg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div style="display:none" class="w-full aspect-video bg-slate-100 items-center justify-center rounded-t-lg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>`
        : `<div class="w-full aspect-video bg-slate-100 flex items-center justify-center rounded-t-lg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>`;

      const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '220px', closeButton: true })
        .setHTML(`
          <div class="cursor-pointer" id="popup-${escapeHtml(spot.id)}">
            ${imageHtml}
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
  }, [filteredSpots, stampedSpotIds, idMap, viewMode, navigate, mapReady]);

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
        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Area filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {areas.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                selectedArea === area
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        {/* Active filter indicator */}
        {(selectedCategory !== '全て' || selectedArea !== '全エリア') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              絞り込み中: {selectedCategory !== '全て' ? selectedCategory : ''}{selectedCategory !== '全て' && selectedArea !== '全エリア' ? ' · ' : ''}{selectedArea !== '全エリア' ? selectedArea : ''}
            </span>
            <button
              onClick={() => { setSelectedCategory('全て'); setSelectedArea('全エリア'); }}
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> クリア
            </button>
          </div>
        )}
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
            <div className="text-center py-12">
              <p className="text-muted-foreground">スポットが見つかりません</p>
              {(selectedCategory !== '全て' || selectedArea !== '全エリア' || searchQuery) && (
                <button
                  onClick={() => { setSelectedCategory('全て'); setSelectedArea('全エリア'); setSearchQuery(''); }}
                  className="text-primary text-sm mt-2 font-medium"
                >
                  フィルターをリセット
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSpots.map(spot => (
                <SpotCard key={spot.id} spot={spot} isVisited={stampedSpotIds.has(idMap?.byMicrocmsId[spot.id] ?? '')} onClick={() => navigate(`/spots/${spot.slug}`)} variant="compact" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
