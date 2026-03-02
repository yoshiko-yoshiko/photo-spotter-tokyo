import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function useSpot(id: string | undefined) {
  return useQuery({
    queryKey: ['spots', id],
    queryFn: async () => {
      if (!id) throw new Error('No spot ID');
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
