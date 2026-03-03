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
