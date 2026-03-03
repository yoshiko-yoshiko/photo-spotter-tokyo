export const TOKYO_BOUNDS = {
  latMin: 35.5,
  latMax: 35.85,
  lngMin: 139.5,
  lngMax: 140.0,
};

export const TOKYO_CENTER: [number, number] = [139.7671, 35.6812];

export function isInTokyo(lat: number, lng: number): boolean {
  return (
    lat >= TOKYO_BOUNDS.latMin &&
    lat <= TOKYO_BOUNDS.latMax &&
    lng >= TOKYO_BOUNDS.lngMin &&
    lng <= TOKYO_BOUNDS.lngMax
  );
}

export const CATEGORY_COLORS: Record<string, string> = {
  'ランドマーク': '#0D9488',
  '寺社・歴史': '#9333EA',
  '自然・公園': '#059669',
  '都市・カルチャー': '#F97316',
};

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getSpotsBounds(
  spots: { latitude: number | string; longitude: number | string }[]
): [[number, number], [number, number]] | null {
  if (spots.length === 0) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const s of spots) {
    const lng = Number(s.longitude);
    const lat = Number(s.latitude);
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}

export function getRouteUrl(lat: number, lng: number): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return `https://maps.apple.com/?daddr=${lat},${lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export const MAP_CONFIG = {
  DEFAULT_ZOOM: 11,
  NEARBY_ZOOM: 13,
  LOCATE_ZOOM: 15,
  NEARBY_THRESHOLD_M: 1000,
  INFO_BANNER_DURATION_MS: 5000,
  NEARBY_BANNER_DURATION_MS: 3000,
  MAP_INIT_DELAY_MS: 100,
} as const;

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function createMarkerElement(spotName: string, color: string, isVisited: boolean): HTMLDivElement {
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
    <span class="mt-1 text-[10px] font-bold text-slate-700 bg-white/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap max-w-[80px] truncate">${escapeHtml(spotName)}</span>
  `;
  return el;
}
