import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

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
