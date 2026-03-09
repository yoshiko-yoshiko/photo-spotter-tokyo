import { env } from '@/lib/env';

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Mapbox Geocoding API で住所から緯度経度を取得
 * @param address 住所文字列（日本語OK）
 * @returns 座標 or null（見つからない場合）
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const token = env.MAPBOX_TOKEN;
  if (!token || !address.trim()) return null;

  const encoded = encodeURIComponent(address.trim());
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=jp&language=ja&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature?.center) return null;

    const [longitude, latitude] = feature.center;
    return { latitude, longitude };
  } catch (err: unknown) {
    if (import.meta.env.DEV) console.error('Geocoding error:', err);
    return null;
  }
}

/**
 * 緯度経度が未設定（0 or NaN）かどうかを判定
 */
export function isCoordsMissing(lat: number, lng: number): boolean {
  return (!lat && !lng) || (lat === 0 && lng === 0) || isNaN(lat) || isNaN(lng);
}
