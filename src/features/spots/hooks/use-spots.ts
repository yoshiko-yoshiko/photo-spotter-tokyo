import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useSpots() {
  return useQuery({
    queryKey: ['spots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useSpot(slug: string | undefined) {
  return useQuery({
    queryKey: ['spots', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No spot slug');
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}
