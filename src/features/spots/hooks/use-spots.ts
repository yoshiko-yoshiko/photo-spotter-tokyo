import { useQuery } from '@tanstack/react-query';
import { cmsClient } from '@/lib/microcms/client';
import type { CMSSpot } from '@/lib/microcms/types';
import { cmsSpotToSpot } from '@/lib/microcms/utils';

export function useSpots() {
  return useQuery({
    queryKey: ['spots'],
    queryFn: async () => {
      const res = await cmsClient.getList<CMSSpot>({
        endpoint: 'spots',
        queries: { limit: 100 },
      });
      return res.contents.map(cmsSpotToSpot);
    },
    staleTime: 1000 * 60 * 10,
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
      return cmsSpotToSpot(res.contents[0]);
    },
    enabled: !!slug,
  });
}
