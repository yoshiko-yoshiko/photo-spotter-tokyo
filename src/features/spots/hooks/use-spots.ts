import { useQuery } from '@tanstack/react-query';
import { cmsClient } from '@/lib/microcms/client';
import { supabase } from '@/lib/supabase/client';
import type { CMSSpot } from '@/lib/microcms/types';
import { cmsSpotToSpot } from '@/lib/microcms/utils';
import { isCoordsMissing } from '@/features/map/lib/geocode';

export function useSpots() {
  return useQuery({
    queryKey: ['spots'],
    queryFn: async () => {
      const res = await cmsClient.getList<CMSSpot>({
        endpoint: 'spots',
        queries: { limit: 100 },
      });
      const spots = res.contents.map(cmsSpotToSpot);

      // 座標が未設定のスポットがあれば、Supabase側の座標で補完
      const needCoords = spots.some(s => isCoordsMissing(s.latitude, s.longitude));
      if (needCoords) {
        const { data: dbSpots } = await supabase
          .from('spots')
          .select('microcms_id, latitude, longitude');
        if (dbSpots) {
          const coordMap = new Map(
            dbSpots.filter(d => d.microcms_id).map(d => [d.microcms_id!, { lat: d.latitude, lng: d.longitude }])
          );
          for (const spot of spots) {
            if (isCoordsMissing(spot.latitude, spot.longitude)) {
              const coords = coordMap.get(spot.id);
              if (coords && !isCoordsMissing(coords.lat, coords.lng)) {
                spot.latitude = coords.lat;
                spot.longitude = coords.lng;
              }
            }
          }
        }
      }

      return spots;
    },
    staleTime: 1000 * 60 * 1,
  });
}

export function useSpot(slug: string | undefined) {
  return useQuery({
    queryKey: ['spots', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No spot slug');
      const res = await cmsClient.getList<CMSSpot>({
        endpoint: 'spots',
        queries: { filters: `slug[equals]${slug}`, limit: 1 },
      });
      if (res.contents.length === 0) throw new Error('Spot not found');
      const spot = cmsSpotToSpot(res.contents[0]);

      // 座標が未設定ならSupabase側から補完
      if (isCoordsMissing(spot.latitude, spot.longitude)) {
        const { data } = await supabase
          .from('spots')
          .select('latitude, longitude')
          .eq('microcms_id', spot.id)
          .maybeSingle();
        if (data && !isCoordsMissing(data.latitude, data.longitude)) {
          spot.latitude = data.latitude;
          spot.longitude = data.longitude;
        }
      }

      return spot;
    },
    enabled: !!slug,
  });
}
