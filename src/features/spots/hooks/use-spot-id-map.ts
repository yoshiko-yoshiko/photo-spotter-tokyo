import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
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
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * microCMS のスポットデータと Supabase のマッピングを自動同期
 * microCMS で新規追加されたスポットがあれば Supabase に行を自動作成
 */
export function useSpotIdSync(spots: Spot[]) {
  const queryClient = useQueryClient();
  const { data: idMap } = useSpotIdMap();

  useEffect(() => {
    if (!idMap || spots.length === 0) return;

    const missing = spots.filter(s => !idMap.byMicrocmsId[s.id]);
    if (missing.length === 0) return;

    const syncMissing = async () => {
      for (const spot of missing) {
        const { error } = await supabase
          .from('spots')
          .insert({
            microcms_id: spot.id,
            slug: spot.slug,
            name: spot.name,
            description: spot.description,
            category: spot.category,
            area: spot.area,
            latitude: spot.latitude,
            longitude: spot.longitude,
            address: spot.address,
            photo_tip: spot.photo_tip,
            best_time: spot.best_time,
            radius_m: spot.radius_m,
            image_url: spot.image_url,
            is_active: true,
          });
        if (error && !error.message.includes('duplicate')) {
          console.error('Spot sync failed:', spot.slug, error.message);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['spot-id-map'] });
    };

    syncMissing();
  }, [idMap, spots, queryClient]);
}
