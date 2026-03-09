import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { geocodeAddress, isCoordsMissing } from '@/features/map/lib/geocode';
import type { Spot } from '@/lib/microcms/types';

/**
 * microCMS id → Supabase UUID のマッピングを提供
 * stamps/photos 等のDB操作で Supabase UUID が必要なため
 */
export function useSpotIdMap() {
  return useQuery({
    queryKey: ['spot-id-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('id, microcms_id, slug');
      if (error) throw error;
      const byMicrocmsId: Record<string, string> = {};
      const bySlug: Record<string, string> = {};
      for (const row of data || []) {
        if (row.microcms_id) byMicrocmsId[row.microcms_id] = row.id;
        if (row.slug) bySlug[row.slug] = row.id;
      }
      return { byMicrocmsId, bySlug };
    },
    staleTime: 1000 * 30,
  });
}

/**
 * microCMS のスポットデータと Supabase のマッピングを自動同期
 * - 新規スポット → Supabase に行を自動作成
 * - 住所のみで緯度経度が未設定 → Mapbox Geocoding で自動補完
 */
export function useSpotIdSync(spots: Spot[]) {
  const queryClient = useQueryClient();
  const { data: idMap } = useSpotIdMap();
  const { isAuthenticated } = useAuth();
  const geocodedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !idMap || spots.length === 0) return;

    const missing = spots.filter(s => !idMap.byMicrocmsId[s.id]);

    const syncMissing = async () => {
      let changed = false;

      for (const spot of missing) {
        // 座標が未設定で住所がある場合、Geocodingで補完
        let { latitude, longitude } = spot;
        if (isCoordsMissing(latitude, longitude) && spot.address) {
          const result = await geocodeAddress(spot.address);
          if (result) {
            latitude = result.latitude;
            longitude = result.longitude;
          }
        }

        const { error } = await supabase
          .from('spots')
          .insert({
            microcms_id: spot.id,
            slug: spot.slug,
            name: spot.name,
            description: spot.description,
            category: spot.category,
            area: spot.area,
            latitude,
            longitude,
            address: spot.address,
            photo_tip: spot.photo_tip,
            best_time: spot.best_time,
            radius_m: spot.radius_m || 100,
            image_url: spot.image_url,
            is_active: true,
          });
        const errMsg = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error);
        if (error && !errMsg.includes('duplicate')) {
          if (import.meta.env.DEV) console.error('Spot sync failed:', spot.slug, errMsg);
        } else if (!error) {
          changed = true;
        }
      }

      if (changed) {
        await queryClient.refetchQueries({ queryKey: ['spot-id-map'] });
        await queryClient.refetchQueries({ queryKey: ['spots'] });
      }
    };

    // 既存スポットで座標が未設定のものもGeocodingで補完
    const geocodeMissing = async () => {
      let updated = false;
      for (const spot of spots) {
        const supabaseId = idMap.byMicrocmsId[spot.id];
        if (!supabaseId) continue;
        if (geocodedRef.current.has(spot.id)) continue;
        if (!isCoordsMissing(spot.latitude, spot.longitude)) continue;
        if (!spot.address) continue;

        geocodedRef.current.add(spot.id);

        const result = await geocodeAddress(spot.address);
        if (!result) continue;

        const { error } = await supabase
          .from('spots')
          .update({ latitude: result.latitude, longitude: result.longitude })
          .eq('id', supabaseId);

        if (error) {
          const errMsg = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error);
          if (import.meta.env.DEV) console.error('Geocode update failed:', spot.slug, errMsg);
        } else {
          updated = true;
        }
      }
      // Geocoding完了後、spotsを強制再取得して座標を反映
      if (updated) {
        await queryClient.refetchQueries({ queryKey: ['spots'] });
      }
    };

    if (missing.length > 0) {
      syncMissing();
    }
    geocodeMissing();
  }, [isAuthenticated, idMap, spots, queryClient]);
}
